export type NormalizedTransaction = {
  date: Date
  description: string
  amount: number
  accountId: string
  rawData: string
  hash: string
}

export type ParseResult = {
  transactions: NormalizedTransaction[]
  parseErrors: { row: number; error: string }[]
}

export type BankParser = {
  bankName: string
  detect: (headers: string[]) => boolean
  parse: (rows: Record<string, string>[], accountId: string) => ParseResult
}
