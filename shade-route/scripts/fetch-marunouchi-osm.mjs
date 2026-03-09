import { mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { TARGET_BBOX } from './shared.mjs'

const execFileAsync = promisify(execFile)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const outputPath = path.join(projectRoot, 'public', 'data', 'marunouchi-walkways.geojson')

const overpassEndpoints = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]

const overpassQuery = `[out:json][timeout:60];
(
  way[highway~"footway|pedestrian|path|living_street|service|residential|steps"](${TARGET_BBOX.south},${TARGET_BBOX.west},${TARGET_BBOX.north},${TARGET_BBOX.east});
);
out geom;`

function wayToFeature(way) {
  return {
    type: 'Feature',
    properties: {
      id: way.id,
      highway: way.tags?.highway ?? null,
      name: way.tags?.name ?? null,
      access: way.tags?.access ?? null,
      surface: way.tags?.surface ?? null,
    },
    geometry: {
      type: 'LineString',
      coordinates: (way.geometry ?? []).map((point) => [point.lon, point.lat]),
    },
  }
}

async function fetchFromEndpoint(endpoint) {
  const { stdout } = await execFileAsync(
    'curl',
    [
      '--fail',
      '--silent',
      '--show-error',
      '--max-time',
      '60',
      '-A',
      'shade-route-data-fetcher/0.1',
      '-X',
      'POST',
      endpoint,
      '--data-urlencode',
      `data=${overpassQuery}`,
    ],
    {
      maxBuffer: 32 * 1024 * 1024,
    }
  )

  return JSON.parse(stdout)
}

async function main() {
  let payload = null
  let selectedEndpoint = null

  for (const endpoint of overpassEndpoints) {
    try {
      payload = await fetchFromEndpoint(endpoint)
      selectedEndpoint = endpoint
      break
    } catch (error) {
      console.warn(`[fetch:osm] endpoint failed: ${endpoint}`)
      console.warn(error instanceof Error ? error.message : String(error))
    }
  }

  if (!payload) {
    throw new Error('All Overpass endpoints failed')
  }

  const features = (payload.elements ?? [])
    .filter((element) => element.type === 'way' && Array.isArray(element.geometry) && element.geometry.length >= 2)
    .map(wayToFeature)

  const featureCollection = {
    type: 'FeatureCollection',
    metadata: {
      source: 'OpenStreetMap via Overpass API',
      endpoint: selectedEndpoint,
      generatedAt: new Date().toISOString(),
      bbox: TARGET_BBOX,
      count: features.length,
      osmBaseTimestamp: payload.osm3s?.timestamp_osm_base ?? null,
    },
    features,
  }

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(featureCollection, null, 2)}\n`, 'utf8')
  console.log(`[fetch:osm] wrote ${features.length} features to ${outputPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})