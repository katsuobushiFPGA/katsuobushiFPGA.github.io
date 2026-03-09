import { access, mkdir } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const cacheDir = path.join(projectRoot, 'data-cache')
const outputPath = path.join(cacheDir, 'chiyoda-citygml-v4.zip')
const downloadUrl = 'https://assets.cms.plateau.reearth.io/assets/f0/8694c9-c697-4c07-96fc-720b6f61b06b/13101_chiyoda-ku_pref_2023_citygml_2_op.zip'

async function main() {
  await mkdir(cacheDir, { recursive: true })

  try {
    await access(outputPath)
    console.log(`[download:plateau-citygml] using cached archive: ${outputPath}`)
    return
  } catch {
    // continue to download
  }

  await execFileAsync(
    'curl',
    [
      '--fail',
      '--location',
      '--continue-at',
      '-',
      '--output',
      outputPath,
      downloadUrl,
    ],
    {
      cwd: projectRoot,
      maxBuffer: 4 * 1024 * 1024,
    }
  )

  console.log(`[download:plateau-citygml] downloaded archive to ${outputPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})