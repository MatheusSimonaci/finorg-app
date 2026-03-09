/**
 * file-mapper.ts  (xlsx-mapper.ts)
 *
 * Uses OpenAI to extract normalised transactions from ANY financial file
 * (CSV or XLSX rows), regardless of bank or platform.
 *
 * Returns either:
 *   { ok: true,  transactions: NormalizedRow[], bankName: string }
 *   { ok: false, error: string }
 */

import OpenAI from "openai"
import { prisma as db } from "@/lib/db"

export type NormalizedRow = {
  date: string       // "YYYY-MM-DD"
  description: string
  amount: number     // positive = credit, negative = debit
  rawData: string
}

type LLMResult =
  | { ok: true; transactions: NormalizedRow[]; bankName: string }
  | { ok: false; error: string }

async function getApiKey(): Promise<string | null> {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY
  const config = await db.appConfig.findUnique({ where: { key: "OPENAI_API_KEY" } })
  return config?.value ?? null
}

const SYSTEM_PROMPT = `
Você é um parser financeiro universal.

Receberá linhas de qualquer arquivo financeiro (extrato bancário, fatura de cartão,
plataforma de investimentos, corretora, criptomoedas, etc.) de qualquer banco ou
instituição brasileira ou estrangeira.

Sua tarefa: identificar TODOS os registros financeiros e convertê-los ao formato
normalizado abaixo. Também identifique o banco/plataforma de origem.

RETORNE APENAS JSON VÁLIDO, sem markdown, sem explicações fora do JSON.

Formato de sucesso:
{
  "ok": true,
  "bankName": "nome do banco ou plataforma (ex: Nubank, XP Investimentos, Itaú, Binance)",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "descrição curta do lançamento",
      "amount": 0.00,
      "rawData": "linha original como JSON.stringify'd"
    }
  ]
}

REGRAS:
1. date sempre "YYYY-MM-DD".
2. amount: crédito/entrada = positivo; débito/saída = negativo.
   Se houver colunas separadas de Crédito e Débito: amount = credito > 0 ? credito : -debito.
3. Ignore linhas de rodapé, totais, cabeçalhos repetidos, linhas totalmente vazias.
4. Para arquivos de posição de portfólio (sem data de transação): use referenceDate e
   coluna "Posição" ou "Valor" como amount positivo; description = "Posição {ticker/nome}".
5. Se for absolutamente impossível extrair qualquer transação financeira, retorne:
   { "ok": false, "error": "motivo claro em português" }
`.trim()

/**
 * Maps any financial file rows (CSV or XLSX) to normalised transactions via LLM.
 * @param rows           2-D string array (all rows, all columns)
 * @param referenceDate  "YYYY-MM-DD" fallback date for portfolio/snapshot files
 */
export async function mapFileWithLLM(
  rows: string[][],
  referenceDate: string
): Promise<LLMResult> {
  const apiKey = await getApiKey()
  if (!apiKey) {
    return { ok: false, error: "OPENAI_API_KEY não configurada. Configure em Configurações → IA." }
  }

  // Send at most 60 rows to keep token count low; always include first row (potential header)
  const sample = rows.slice(0, 60)

  const userMessage = JSON.stringify({
    referenceDate,
    rows: sample,
  })

  const client = new OpenAI({ apiKey })

  let raw = ""
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0,
    })
    raw = response.choices[0]?.message?.content ?? "{}"
  } catch (e) {
    return { ok: false, error: `Erro ao chamar LLM: ${e instanceof Error ? e.message : String(e)}` }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: "LLM retornou resposta inválida (não é JSON)." }
  }

  const p = parsed as Record<string, unknown>

  if (p.ok === false) {
    return { ok: false, error: String(p.error ?? "LLM não conseguiu mapear o arquivo.") }
  }

  if (p.ok === true && Array.isArray(p.transactions)) {
    const bankName = String(p.bankName ?? "outros").trim() || "outros"
    const transactions: NormalizedRow[] = []
    for (const t of p.transactions as Record<string, unknown>[]) {
      const date = String(t.date ?? "")
      const description = String(t.description ?? "")
      const amount = typeof t.amount === "number" ? t.amount : parseFloat(String(t.amount ?? "0"))
      const rawData = String(t.rawData ?? "")
      if (date && description && !isNaN(amount)) {
        transactions.push({ date, description, amount, rawData })
      }
    }
    if (transactions.length === 0) {
      return { ok: false, error: "LLM não encontrou nenhuma transação válida no arquivo." }
    }
    return { ok: true, transactions, bankName }
  }

  return { ok: false, error: "LLM retornou formato inesperado." }
}

/** @deprecated use mapFileWithLLM */
export const mapXlsxWithLLM = mapFileWithLLM
