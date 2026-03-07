import type { ClassificationRule } from "@/app/generated/prisma/client"

export type ClassificationResult = {
  nature: string
  category: string
  subcategory?: string
  type: string
  confidence: number
  reasoning: string
  source: "rule" | "ai" | "manual"
}

export function applyRules(
  description: string,
  rules: ClassificationRule[]
): ClassificationResult | null {
  const activeRules = rules.filter((r) => r.active)
  for (const rule of activeRules) {
    try {
      const regex = new RegExp(rule.pattern, "i")
      if (regex.test(description)) {
        return {
          nature: rule.nature,
          category: rule.category,
          subcategory: rule.subcategory ?? undefined,
          type: rule.type ?? "gasto",
          confidence: 1.0,
          reasoning: `Regra: "${rule.pattern}"`,
          source: "rule",
        }
      }
    } catch {
      // Invalid regex pattern — skip silently
    }
  }
  return null
}
