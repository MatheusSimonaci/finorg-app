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
  quantity?: number  // units / shares / coins
  unitPrice?: number // price per unit in BRL
}

type LLMResult =
  | { ok: true; transactions: NormalizedRow[]; bankName: string; closingBalanceBRL?: number }
  | { ok: false; error: string }

async function getApiKey(): Promise<string | null> {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY
  const config = await db.appConfig.findUnique({ where: { key: "OPENAI_API_KEY" } })
  return config?.value ?? null
}

const SYSTEM_PROMPT = `
Você é um parser financeiro universal.

Receberá linhas de qualquer arquivo financeiro (extrato bancário, fatura de cartão,
plataforma de investimentos, corretora, exchange de criptomoedas, etc.) de qualquer
banco ou instituição brasileira ou estrangeira.

Sua tarefa: identificar TODOS os registros financeiros e convertê-los ao formato
normalizado abaixo. Também identifique o banco/plataforma e o saldo final em BRL.

RETORNE APENAS JSON VÁLIDO, sem markdown, sem explicações fora do JSON.

Formato de sucesso:
{
  "ok": true,
  "bankName": "nome do banco ou plataforma (ex: Nubank, XP Investimentos, Itaú, Bitpreco)",
  "closingBalanceBRL": 0.00,
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "descrição curta",
      "amount": 0.00,
      "quantity": null,
      "unitPrice": null,
      "rawData": "linha original como JSON.stringify'd"
    }
  ]
}

REGRAS CRÍTICAS:

1. FORMATO BRASILEIRO: vírgula = decimal, ponto = milhar.
   "100,00" = 100.00 | "1.500,00" = 1500.00 | "492.620,73" = 492620.73

2. date sempre "YYYY-MM-DD". "28/12/2025" → "2025-12-28".

3. amount: crédito/entrada/depósito = positivo; débito/saída/compra = negativo.
   Colunas separadas Crédito/Débito: amount = credito > 0 ? credito : -debito.

4. EXCHANGES DE CRIPTO (Bitpreco, Binance, Mercado Bitcoin, etc.):
   - Arquivos podem ter seção de saldos de moedas ANTES das transações — ignore zeros.
   - Saldo NÃO ZERADO de cripto (ex: BTC 0,00196695): crie transação com
     date=referenceDate, description="Posição BTC: 0.00196695", amount=0,
     quantity=0.00196695, unitPrice=null.
   - DEPÓSITO BRL: amount = valor positivo.
   - COMPRA de cripto: amount = Total R$ negativo, quantity = qtd comprada,
     unitPrice = preço unitário em R$.
   - VENDA de cripto: amount = Total R$ positivo, quantity = qtd vendida, unitPrice = preço.
   - SAQUE BRL: amount = negativo.

5. POSIÇÕES DE INVESTIMENTO (XP, fundos, ações, FIIs):
   Para cada ativo, crie uma transação:
   date=referenceDate, description="Posição {TICKER}", amount=valor total BRL,
   quantity=cotas/ações, unitPrice=preço unitário.

6. Ignore linhas de rodapé, totais, cabeçalhos repetidos, linhas vazias.

7. closingBalanceBRL: saldo final em BRL declarado. Só BRL, sem converter cripto. null se ausente.

8. Se impossível extrair qualquer transação:
   { "ok": false, "error": "motivo em português" }
`.trim()

/**
 * Maps any financial file rows (CSV or XLSX) to normalised transactions via LLM.
 * @param rows           2-D string array (all rows, all columns)
 * @param referenceDate  "YYYY-MM-DD" fallback date for portfolio/snapshot files
 */

/**
 * Intelligently selects rows to send to the LLM.
 * Files like Bitpreco list ~200 zero-balance coins before any transactions,
 * so a naive `slice(0, 60)` would never reach the actual transaction data.
 *
 * Strategy:
 * - Always keep the first 5 rows (bank/platform identification)
 * - Keep rows that look like section headers (multi-word first cell)
 * - Keep rows with 2+ non-empty, non-zero cells (balance entries or transaction rows)
 * - Keep rows whose first cell looks like a date
 * - Skip purely empty rows
 * - Cap at 100 rows for token budget
 */
function smartSampleRows(rows: string[][], maxRows = 100): string[][] {
  const dateRe = /\d{2}[\/\-]\d{2}[\/\-]\d{4}/
  const result: string[][] = []
  const seen = new Set<string>()

  // Always include first 5 rows
  for (const row of rows.slice(0, 5)) {
    const key = row.join("|")
    if (!seen.has(key)) { seen.add(key); result.push(row) }
  }

  for (const row of rows.slice(5)) {
    if (result.length >= maxRows) break
    const first = row[0]?.trim().replace(/\r$/, "") ?? ""
    const nonEmpty = row.filter(c => c.trim().replace(/\r$/, "") !== "" && c.trim() !== "0").length

    // Skip fully empty rows
    if (nonEmpty === 0 && !first) continue

    // Include: date in first column
    if (dateRe.test(first)) { result.push(row); continue }

    // Include: section title or column header (first cell is a multi-word/multi-char string)
    if (first.length > 4 && !/^[A-Z0-9]+$/.test(first)) { result.push(row); continue }

    // Include: row has 2+ meaningful cells (non-zero balance or transaction data)
    if (nonEmpty >= 2) { result.push(row); continue }
  }

  return result
}

export async function mapFileWithLLM(
  rows: string[][],
  referenceDate: string
): Promise<LLMResult> {
  const apiKey = await getApiKey()
  if (!apiKey) {
    return { ok: false, error: "OPENAI_API_KEY não configurada. Configure em Configurações → IA." }
  }

  // Smart row sampling: always include first 5 rows (bank ID) + rows likely to contain
  // transaction data. This prevents truncation on files with large balance-listing sections
  // (e.g. Bitpreco which lists ~200 crypto balances before the transaction section).
  const sample = smartSampleRows(rows)

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
    const closingBalanceBRL = typeof p.closingBalanceBRL === "number" ? p.closingBalanceBRL : undefined
    const transactions: NormalizedRow[] = []
    for (const t of p.transactions as Record<string, unknown>[]) {
      const date = String(t.date ?? "")
      const description = String(t.description ?? "")
      const amount = typeof t.amount === "number" ? t.amount : parseFloat(String(t.amount ?? "0"))
      const rawData = String(t.rawData ?? "")
      const quantity = typeof t.quantity === "number" && !isNaN(t.quantity) ? t.quantity : undefined
      const unitPrice = typeof t.unitPrice === "number" && !isNaN(t.unitPrice) ? t.unitPrice : undefined
      if (date && description && !isNaN(amount)) {
        transactions.push({ date, description, amount, rawData, quantity, unitPrice })
      }
    }
    if (transactions.length === 0) {
      return { ok: false, error: "LLM não encontrou nenhuma transação válida no arquivo." }
    }
    return { ok: true, transactions, bankName, closingBalanceBRL }
  }

  return { ok: false, error: "LLM retornou formato inesperado." }
}

/** @deprecated use mapFileWithLLM */
export const mapXlsxWithLLM = mapFileWithLLM
