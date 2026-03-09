import { PrismaClient } from "../app/generated/prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function makeHash(str: string): string {
  return createHash("sha256").update(str).digest("hex").substring(0, 16);
}

async function main() {
  console.log("🌱 Seeding database...");

  // --- Accounts ---
  const nubank = await prisma.account.upsert({
    where: { id: "acc_nubank_01" },
    update: {},
    create: {
      id: "acc_nubank_01",
      name: "Nubank Conta",
      institution: "nubank",
      type: "checking",
    },
  });

  const xp = await prisma.account.upsert({
    where: { id: "acc_xp_01" },
    update: {},
    create: {
      id: "acc_xp_01",
      name: "XP Investimentos",
      institution: "xp",
      type: "investment",
    },
  });

  const bity = await prisma.account.upsert({
    where: { id: "acc_bity_01" },
    update: {},
    create: {
      id: "acc_bity_01",
      name: "Bitybank Crypto",
      institution: "bitybank",
      type: "crypto",
    },
  });

  console.log("✅ Accounts created:", nubank.name, xp.name, bity.name);

  // --- Transactions ---
  const transactions = [
    {
      id: "tx_001",
      date: new Date("2026-02-05"),
      description: "iFood",
      amount: -89.9,
      accountId: nubank.id,
      nature: "pessoal",
      category: "alimentacao",
      type: "gasto",
      confidence: 0.95,
    },
    {
      id: "tx_002",
      date: new Date("2026-02-10"),
      description: "Netflix",
      amount: -55.9,
      accountId: nubank.id,
      nature: "pessoal",
      category: "assinatura",
      type: "gasto",
      confidence: 0.98,
    },
    {
      id: "tx_003",
      date: new Date("2026-02-12"),
      description: "CapCut Pro",
      amount: -29.9,
      accountId: nubank.id,
      nature: "work_tool",
      category: "assinatura",
      type: "gasto",
      confidence: 0.9,
    },
    {
      id: "tx_004",
      date: new Date("2026-02-15"),
      description: "Salário CLT",
      amount: 8500.0,
      accountId: nubank.id,
      nature: "pessoal",
      category: "receita",
      type: "receita",
      confidence: 0.99,
    },
    {
      id: "tx_005",
      date: new Date("2026-02-18"),
      description: "Freelance Design",
      amount: 2000.0,
      accountId: nubank.id,
      nature: "empresa",
      category: "receita",
      type: "receita",
      confidence: 0.85,
    },
    {
      id: "tx_006",
      date: new Date("2026-02-20"),
      description: "Farmácia Drogasil",
      amount: -145.0,
      accountId: nubank.id,
      nature: "pessoal",
      category: "saude",
      type: "gasto",
      confidence: 0.92,
    },
    {
      id: "tx_007",
      date: new Date("2026-02-22"),
      description: "Uber",
      amount: -38.5,
      accountId: nubank.id,
      nature: "misto",
      category: "transporte",
      type: "gasto",
      confidence: 0.6,
    },
    {
      id: "tx_008",
      date: new Date("2026-02-25"),
      description: "Tesouro Selic 2029",
      amount: -500.0,
      accountId: xp.id,
      nature: "pessoal",
      category: "investimento",
      type: "investimento",
      confidence: 0.99,
    },
    {
      id: "tx_009",
      date: new Date("2026-02-28"),
      description: "IPTU parcela 2/10",
      amount: -320.0,
      accountId: nubank.id,
      nature: "pessoal",
      category: "moradia",
      type: "gasto",
      confidence: 0.95,
    },
    {
      id: "tx_010",
      date: new Date("2026-03-01"),
      description: "BTC compra",
      amount: -1000.0,
      accountId: bity.id,
      nature: "pessoal",
      category: "investimento",
      type: "investimento",
      confidence: 0.99,
    },
  ];

  for (const tx of transactions) {
    const hash = makeHash(`${tx.id}-${tx.date}-${tx.description}`);
    await prisma.transaction.upsert({
      where: { id: tx.id },
      update: {},
      create: {
        ...tx,
        hash,
      },
    });
  }

  console.log(`✅ ${transactions.length} transactions created`);

  // --- Assets ---
  const tesouro = await prisma.asset.upsert({
    where: { id: "asset_001" },
    update: {},
    create: {
      id: "asset_001",
      name: "Tesouro Selic 2029",
      type: "tesouro",
      institution: "XP Investimentos",
      currentValue: 12500.0,
      purpose: "reserve",
      accountId: xp.id,
    },
  });

  const fii = await prisma.asset.upsert({
    where: { id: "asset_002" },
    update: {},
    create: {
      id: "asset_002",
      name: "HGLG11",
      type: "fii",
      institution: "XP Investimentos",
      currentValue: 8200.0,
      purpose: "personal",
      accountId: xp.id,
    },
  });

  const btc = await prisma.asset.upsert({
    where: { id: "asset_003" },
    update: {},
    create: {
      id: "asset_003",
      name: "Bitcoin",
      type: "cripto",
      institution: "Bitybank",
      currentValue: 4300.0,
      purpose: "personal",
      accountId: bity.id,
    },
  });

  console.log("✅ Assets created:", tesouro.name, fii.name, btc.name);

  // --- Dream ---
  await prisma.dream.upsert({
    where: { id: "dream_001" },
    update: {},
    create: {
      id: "dream_001",
      name: "Viagem Japão",
      targetAmount: 25000.0,
      targetDate: new Date("2027-10-01"),
      priorityOrder: 1,
      status: "acumulando",
      notes: "Meta para 2027: Japão + Coreia do Sul, 21 dias",
    },
  });

  console.log("✅ Dream created");

  // --- Classification Rules ---
  const rules = [
    {
      id: "rule_001",
      pattern: "capcut",
      nature: "work_tool",
      category: "assinatura",
      type: "gasto",
      source: "system",
    },
    {
      id: "rule_002",
      pattern: "bitybank",
      nature: "pessoal",
      category: "investimento",
      type: "investimento",
      source: "system",
    },
    {
      id: "rule_003",
      pattern: "netflix|spotify|amazon prime|disney",
      nature: "pessoal",
      category: "assinatura",
      type: "gasto",
      source: "system",
    },
    {
      id: "rule_004",
      pattern: "ifood|rappi|uber eats",
      nature: "pessoal",
      category: "alimentacao",
      type: "gasto",
      source: "system",
    },
    {
      id: "rule_005",
      pattern: "tesouro|cdb|lci|lca|fii|fundo",
      nature: "pessoal",
      category: "investimento",
      type: "investimento",
      source: "system",
    },
  ];

  for (const rule of rules) {
    await prisma.classificationRule.upsert({
      where: { id: rule.id },
      update: {},
      create: rule,
    });
  }

  console.log(`✅ ${rules.length} classification rules created`);

  // --- Budget ---
  const budgets = [
    { id: "budget_001", category: "alimentacao", targetPct: 15 },
    { id: "budget_002", category: "moradia", targetPct: 30 },
    { id: "budget_003", category: "saude", targetPct: 8 },
    { id: "budget_004", category: "lazer", targetPct: 10 },
    { id: "budget_005", category: "assinatura", targetPct: 5 },
    { id: "budget_006", category: "transporte", targetPct: 7 },
    { id: "budget_007", category: "educacao", targetPct: 5 },
    { id: "budget_008", category: "investimento", targetPct: 20 },
  ];

  for (const b of budgets) {
    await prisma.budget.upsert({
      where: { id: b.id },
      update: {},
      create: b,
    });
  }

  console.log(`✅ ${budgets.length} budgets created`);

  // --- Emergency Reserve Config ---
  await prisma.emergencyReserveConfig.upsert({
    where: { id: "reserve_config_001" },
    update: {},
    create: {
      id: "reserve_config_001",
      targetMonths: 4,
      calculationWindowMonths: 3,
      excludeOutliers: false,
    },
  });

  console.log("✅ Emergency reserve config created");
  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
