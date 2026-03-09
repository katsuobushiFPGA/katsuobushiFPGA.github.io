import { mkdir, writeFile } from 'node:fs/promises'
import { execFile, spawn } from 'node:child_process'
import path from 'node:path'
import readline from 'node:readline'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { TARGET_BBOX, intersectsBBox, ringToBBox } from './shared.mjs'

const execFileAsync = promisify(execFile)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const zipPath = path.join(projectRoot, 'data-cache', 'chiyoda-citygml-v4.zip')
const outputPath = path.join(projectRoot, 'public', 'data', 'plateau-marunouchi-buildings.geojson')

function parseTriplePosList(posList) {
  const values = posList.trim().split(/\s+/).map(Number)
  const ring = []

  for (let index = 0; index < values.length; index += 3) {
    const lat = values[index]
    const lon = values[index + 1]

    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      ring.push([lon, lat])
    }
  }

  return ring
}

function extractEnvelope(xml) {
  const lower = xml.match(/<gml:lowerCorner>([^<]+)<\/gml:lowerCorner>/)
  const upper = xml.match(/<gml:upperCorner>([^<]+)<\/gml:upperCorner>/)

  if (!lower || !upper) {
    return null
  }

  const [south, west] = lower[1].trim().split(/\s+/).map(Number)
  const [north, east] = upper[1].trim().split(/\s+/).map(Number)

  return { south, west, north, east }
}

function extractBuildingFromBlock(block, meshCode) {
  const id = block.match(/gml:id="([^"]+)"/)?.[1] ?? null
  const measuredHeight = Number(block.match(/<bldg:measuredHeight[^>]*>([^<]+)<\/bldg:measuredHeight>/)?.[1] ?? '0')
  const storeys = Number(block.match(/<bldg:storeysAboveGround>([^<]+)<\/bldg:storeysAboveGround>/)?.[1] ?? '0')
  const roofEdge = block.match(/<bldg:lod0RoofEdge>[\s\S]*?<gml:posList>([\s\S]*?)<\/gml:posList>[\s\S]*?<\/bldg:lod0RoofEdge>/)?.[1] ?? null

  if (!id || !roofEdge) {
    return null
  }

  const ring = parseTriplePosList(roofEdge)

  if (ring.length < 4) {
    return null
  }

  const bbox = ringToBBox(ring)

  if (!intersectsBBox(bbox, TARGET_BBOX)) {
    return null
  }

  const centroid = ring.slice(0, -1).reduce(
    (acc, point) => {
      acc.lon += point[0]
      acc.lat += point[1]
      return acc
    },
    { lon: 0, lat: 0 }
  )
  const divisor = Math.max(1, ring.length - 1)

  return {
    type: 'Feature',
    properties: {
      id,
      measuredHeight,
      storeysAboveGround: storeys,
      meshCode,
      centroid: [centroid.lon / divisor, centroid.lat / divisor],
    },
    geometry: {
      type: 'Polygon',
      coordinates: [ring],
    },
  }
}

async function listGmlFiles() {
  const { stdout } = await execFileAsync('unzip', ['-Z1', zipPath, 'udx/bldg/*'], {
    cwd: projectRoot,
    maxBuffer: 8 * 1024 * 1024,
  })

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.endsWith('.gml'))
}

async function extractFromEntry(entryPath) {
  const meshCode = entryPath.split('/').pop()?.split('_')[0] ?? 'unknown'
  const unzip = spawn('unzip', ['-p', zipPath, entryPath], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const rl = readline.createInterface({ input: unzip.stdout, crlfDelay: Infinity })
  const features = []
  let header = ''
  let envelopeChecked = false
  let relevant = true
  let stoppedEarly = false
  let collecting = false
  let currentBlock = ''

  for await (const line of rl) {
    if (!envelopeChecked) {
      header += `${line}\n`

      if (line.includes('</gml:boundedBy>')) {
        envelopeChecked = true
        const envelope = extractEnvelope(header)
        relevant = envelope ? intersectsBBox(envelope, TARGET_BBOX) : true

        if (!relevant) {
          stoppedEarly = true
          unzip.kill('SIGTERM')
          break
        }
      }
    }

    if (!relevant) {
      continue
    }

    if (line.includes('<core:cityObjectMember>')) {
      collecting = true
      currentBlock = `${line}\n`
      continue
    }

    if (collecting) {
      currentBlock += `${line}\n`

      if (line.includes('</core:cityObjectMember>')) {
        collecting = false
        const feature = extractBuildingFromBlock(currentBlock, meshCode)

        if (feature) {
          features.push(feature)
        }

        currentBlock = ''
      }
    }
  }

  await new Promise((resolve, reject) => {
    unzip.on('error', reject)
    unzip.on('close', (code, signal) => {
      if (signal === 'SIGTERM' || code === 0 || (stoppedEarly && code === 80)) {
        resolve()
      } else {
        reject(new Error(`unzip failed for ${entryPath}: code=${code} signal=${signal}`))
      }
    })
  })

  return {
    entryPath,
    features,
    relevant,
  }
}

async function main() {
  const gmlFiles = await listGmlFiles()
  const relevantFiles = []
  const features = []

  for (const entryPath of gmlFiles) {
    const result = await extractFromEntry(entryPath)

    if (result.relevant) {
      relevantFiles.push(result.entryPath)
      features.push(...result.features)
    }
  }

  const featureCollection = {
    type: 'FeatureCollection',
    metadata: {
      source: 'PLATEAU CityGML v4',
      generatedAt: new Date().toISOString(),
      bbox: TARGET_BBOX,
      count: features.length,
      meshFiles: relevantFiles,
      archivePath: zipPath,
    },
    features,
  }

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(featureCollection, null, 2)}\n`, 'utf8')
  console.log(`[extract:plateau-buildings] wrote ${features.length} buildings to ${outputPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})