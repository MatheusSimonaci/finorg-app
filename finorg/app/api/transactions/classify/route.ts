import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { classifyBatch, estimateCost } from "@/lib/ai/classifier"
import { applyRules } from "@/lib/ai/rule-matcher"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { batchId, transactionIds, estimateOnly } = body as {
      batchId?: string
      transactionIds?: string[]
      estimateOnly?: boolean
    }

    // Fetch unclassified transactions
    const where = batchId
      ? { importBatchId: batchId, nature: null }
      : transactionIds
      ? { id: { in: transactionIds }, nature: null }
      : {}

    const transactions = await db.transaction.findMany({
      where,
      include: { account: true },
    })

    if (estimateOnly) {
      const xpBityCount = transactions.filter(
        (t) => t.account.institution === "xp" || t.account.institution === "bitybank"
      ).length
      const toClassify = transactions.length - xpBityCount
      return NextResponse.json({ transactionCount: toClassify, ...estimateCost(toClassify) })
    }

    // Load all active rules
    const rules = await db.classificationRule.findMany({ where: { active: true } })

    const classified: string[] = []
    const skipped: string[] = []
    const ruleClassified: string[] = []

    // Phase 1: auto-classify XP/Bitybank without API
    for (const tx of transactions) {
      if (tx.account.institution === "xp" || tx.account.institution === "bitybank") {
        await db.transaction.update({
          where: { id: tx.id },
          data: {
            nature: "pessoal",
            category: "investimento",
            type: "investimento",
            confidence: 1.0,
            reasoning: `Conta ${tx.account.institution} — investimento automático`,
            classificationSource: "rule",
            reviewStatus: "approved",
          },
        })
        classified.push(tx.id)
        skipped.push(tx.id)
      }
    }

    // Phase 2: apply user-defined rules
    const remaining = transactions.filter(
      (t) => !classified.includes(t.id)
    )

    const toAI: typeof transactions = []
    for (const tx of remaining) {
      const ruleResult = applyRules(tx.description, rules)
      if (ruleResult) {
        await db.transaction.update({
          where: { id: tx.id },
          data: {
            nature: ruleResult.nature,
            category: ruleResult.category,
            subcategory: ruleResult.subcategory,
            type: ruleResult.type,
            confidence: ruleResult.confidence,
            reasoning: ruleResult.reasoning,
            classificationSource: "rule",
            reviewStatus: "approved",
          },
        })
        classified.push(tx.id)
        ruleClassified.push(tx.id)
      } else {
        toAI.push(tx)
      }
    }

    // Phase 3: call OpenAI for remaining
    let tokensUsed = 0
    if (toAI.length > 0) {
      try {
        const { results, tokensUsed: tokens } = await classifyBatch(
          toAI.map((t) => ({
            id: t.id,
            date: t.date.toISOString().slice(0, 10),
            description: t.description,
            amount: parseFloat(t.amount.toString()),
            account: t.account.institution,
          }))
        )
        tokensUsed = tokens

        for (const tx of toAI) {
          const r = results.get(tx.id)
          if (r) {
            await db.transaction.update({
              where: { id: tx.id },
              data: {
                nature: r.nature,
                category: r.category,
                subcategory: r.subcategory,
                type: r.type,
                confidence: r.confidence,
                reasoning: r.reasoning,
                classificationSource: "ai",
                reviewStatus: r.confidence >= 0.75 ? "approved" : "pending",
              },
            })
            classified.push(tx.id)
          }
        }
      } catch (e) {
        console.warn("[classify] OpenAI unavailable:", e)
        // Fallback: leave unclassified, don't throw
      }
    }

    const costBRL = estimateCost(toAI.length).costBRL

    // Update batch stats
    if (batchId) {
      await db.importBatch.update({
        where: { id: batchId },
        data: { tokensUsed, costBRL, status: "classified" },
      })
    }

    return NextResponse.json({
      classified: classified.length,
      ruleClassified: ruleClassified.length,
      aiClassified: toAI.length,
      tokensUsed,
      costBRL,
    })
  } catch (e) {
    console.error("[classify]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
