import { mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const outputPath = path.join(projectRoot, 'public', 'data', 'plateau-chiyoda-resources.json')

const datasetId = 'plateau-13101-chiyoda-ku-2023'
const endpoint = `https://www.geospatial.jp/ckan/api/3/action/package_show?id=${datasetId}`

const resourceMatchers = [
  { key: 'catalog', includes: ['データ目録', 'v4'] },
  { key: 'citygml', includes: ['CityGML', 'v4'] },
  { key: 'tiles', includes: ['3D Tiles, MVT', 'v4'] },
  { key: 'related', includes: ['関連データセット', 'v4'] },
]

function pickResource(resources, matcher) {
  return resources.find((resource) => matcher.includes.every((token) => (resource.name ?? '').includes(token))) ?? null
}

async function main() {
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
      endpoint,
    ],
    {
      maxBuffer: 8 * 1024 * 1024,
    }
  )

  const payload = JSON.parse(stdout)
  const result = payload.result
  const resources = result.resources ?? []

  const selectedResources = Object.fromEntries(
    resourceMatchers.map((matcher) => [matcher.key, pickResource(resources, matcher)])
  )

  const manifest = {
    dataset: {
      id: result.name,
      title: result.title,
      city: result.area,
      licenseTitle: result.license_title,
      licenseUrl: result.license_url,
      datasetUrl: `https://www.geospatial.jp/ckan/dataset/${result.name}`,
      metadataModified: result.metadata_modified,
    },
    resources: selectedResources,
    generatedAt: new Date().toISOString(),
  }

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  console.log(`[fetch:plateau] wrote manifest to ${outputPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})