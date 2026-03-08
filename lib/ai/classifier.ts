import OpenAI from "openai"
import { prisma as db } from "@/lib/db"
import type { ClassificationResult } from "./rule-matcher"

const SYSTEM_PROMPT = `
Você é um classificador financeiro pessoal especializado.

CONTEXTO DO USUÁRIO:
- O usuário é pessoa física que usa a conta Nubank para gastos pessoais E empresariais misturados
- Contas XP e Bitybank são EXCLUSIVAMENTE investimentos pessoais
- O usuário tem uma empresa e usa ferramentas profissionais pagas

REGRAS DE CLASSIFICAÇÃO:
- CapCut, Adobe, Figma, Canva, Notion, Slack, Linear, Continuity → nature: work_tool, category: assinatura
- Qualquer "SALARIO" ou "FOLHA" → nature: pessoal, category: receita, type: receita
- Transferências para MEI/CNPJ/nome de empresa → nature: empresa
- Igrejas, templos, ministérios, "NOVOS COMECOS", "COMUNIDADE", "MINISTERIO", "IGREJA" → nature: pessoal, category: doacao, subcategory: dizimo
- Descrições com "DIZIMO", "OFERTA", "DONATIVO", "CONTRIBUICAO" para entidades religiosas → nature: pessoal, category: doacao, subcategory: oferta
- O usuário é cristão e dizima regularmente — transferências recorrentes para o mesmo CNPJ/pessoa de instituição religiosa devem ser tratadas como dízimo

DIMENSÕES:
- nature: pessoal | empresa | work_tool | misto
- category: saude | educacao | lazer | alimentacao | moradia | assinatura | investimento | transporte | receita | pet | servicos | doacao | outros
- type: gasto | investimento | reserva | receita | transferencia

Responda SEMPRE em JSON com array "results", um item por transação enviada.
Confidence de 0.0 a 1.0. Se confidence < 0.7, explique em "reasoning".

Formato de cada item:
{ "id": "...", "nature": "...", "category": "...", "subcategory": "...", "type": "...", "confidence": 0.95, "reasoning": "..." }
`.trim()

type TransactionPayload = {
  id: string
  date: string
  description: string
  amount: number
  account: string
}

async function getApiKey(): Promise<string | null> {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY
  const config = await db.appConfig.findUnique({ where: { key: "OPENAI_API_KEY" } })
  return config?.value ?? null
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

export function estimateCost(transactionCount: number): { tokens: number; costBRL: number } {
  const inputTokens = transactionCount * 150
  const outputTokens = transactionCount * 60
  const costUSD = inputTokens * 0.00000015 + outputTokens * 0.0000006
  return { tokens: inputTokens + outputTokens, costBRL: parseFloat((costUSD * 5.7).toFixed(4)) }
}

export async function classifyBatch(
  transactions: TransactionPayload[]
): Promise<{ results: Map<string, ClassificationResult>; tokensUsed: number }> {
  const apiKey = await getApiKey()
  if (!apiKey) throw new Error("OPENAI_API_KEY não configurada")

  const client = new OpenAI({ apiKey })
  const batches = chunk(transactions, 20)
  const results = new Map<string, ClassificationResult>()
  let tokensUsed = 0

  for (const batch of batches) {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(batch) },
      ],
    })

    tokensUsed += response.usage?.total_tokens ?? 0
    const content = response.choices[0]?.message?.content ?? "{}"

    let parsed: { results?: ClassificationResult[] } = {}
    try {
      parsed = JSON.parse(content)
    } catch {
      // malformed response — skip batch
    }

    for (const item of (parsed.results ?? []) as Array<ClassificationResult & { id: string }>) {
      if (item.id) {
        results.set(item.id, { ...item, source: "ai" as const })
      }
    }

    // Respect rate limits
    if (batches.length > 1) await new Promise((r) => setTimeout(r, 500))
  }

  return { results, tokensUsed }
}

