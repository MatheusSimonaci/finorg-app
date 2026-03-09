import Papa from "papaparse"
import { nubankParser } from "./nubank"
import { xpParser } from "./xp"
import { biybankParser } from "./bitybank"

export type { NormalizedTransaction, ParseResult, BankParser } from "./types"

const PARSERS = [nubankParser, xpParser, biybankParser]

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

export function detectBank(headers: string[]) {
  const normalized = headers.map(normalizeHeader)
  return PARSERS.find((p) => p.detect(normalized)) ?? null
}

export function parseCSV(csvText: string, accountId: string) {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  const headers = parsed.meta.fields ?? []
  const bank = detectBank(headers)

  if (!bank) {
    return {
      bank: null,
      result: {
        transactions: [],
        parseErrors: [
          {
            row: 0,
            error:
              "Formato não reconhecido. Verifique se é um extrato Nubank, XP ou Bitybank.",
          },
        ],
      },
    }
  }

  return { bank: bank.bankName, result: bank.parse(parsed.data, accountId) }
}
