import fs from 'fs/promises'
import path from 'path'
import { collectSnapshotData } from './collector'
import { buildSnapshotHTML } from './template'

export type GenerateResult = {
  path: string
  generatedAt: string
  fileSizeKB: number
}

/**
 * Generates the static snapshot HTML file.
 * @param outputDir  absolute path to the output folder (created if missing)
 * @param passwordHash  bcrypt hash for lock screen, or undefined for public
 * @param maskValues  when true, monetary amounts are replaced with ●●●●
 */
export async function generateSnapshot(
  outputDir: string,
  passwordHash?: string,
  maskValues = false,
): Promise<GenerateResult> {
  const data = await collectSnapshotData(maskValues)
  const html = buildSnapshotHTML(data, passwordHash)

  await fs.mkdir(outputDir, { recursive: true })

  const outFile = path.join(outputDir, 'index.html')
  await fs.writeFile(outFile, html, 'utf-8')

  const stat = await fs.stat(outFile)

  return {
    path: outFile,
    generatedAt: data.generatedAt,
    fileSizeKB: Math.round(stat.size / 1024),
  }
}

/** Returns the default snapshot output directory (next.js public/snapshot). */
export function defaultSnapshotDir(): string {
  // Resolve relative to the project root (where next.config.ts lives)
  return path.resolve(process.cwd(), 'public', 'snapshot')
}
