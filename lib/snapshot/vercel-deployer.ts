import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

type VercelFile = {
  file: string
  data: string
  encoding: 'base64' | 'utf-8'
}

export type DeployResult = {
  url: string
  deploymentId: string
}

/**
 * Deploy the contents of snapshotDir to Vercel using the Deploy API.
 * Returns the public URL on success, throws on failure.
 */
export async function deployToVercel(
  snapshotDir: string,
  token: string,
  projectName = 'finorg-snapshot',
): Promise<DeployResult> {
  // Collect files
  const entries = await fs.readdir(snapshotDir)
  const files: VercelFile[] = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(snapshotDir, entry)
      const buf = await fs.readFile(full)
      return {
        file: entry,
        data: buf.toString('base64'),
        encoding: 'base64' as const,
      }
    }),
  )

  if (files.length === 0) {
    throw new Error('Snapshot directory is empty — generate snapshot first.')
  }

  const body = {
    name: projectName,
    files,
    projectSettings: { framework: null },
    target: 'production',
  }

  const res = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  // Sanitize error — never expose token in logs
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    if (res.status === 401 || res.status === 403) {
      throw new Error('Token Vercel inválido ou sem permissão. Verifique o token nas configurações.')
    }
    if (res.status === 429) {
      throw new Error('Limite de deploys da Vercel atingido. Aguarde alguns minutos.')
    }
    throw new Error(`Erro ao fazer deploy: ${res.status} — ${errText.slice(0, 200)}`)
  }

  const payload = (await res.json()) as { url?: string; id?: string; uid?: string }
  const url = payload.url ? `https://${payload.url}` : ''
  const deploymentId = payload.id ?? payload.uid ?? crypto.randomUUID()

  if (!url) {
    throw new Error('Deploy concluído mas URL não retornada pela Vercel.')
  }

  return { url, deploymentId }
}
