/**
 * Aplica as migrations Prisma no banco Turso via @libsql/client.
 * Usado no build do Vercel: `node scripts/migrate-turso.mjs`
 */
import { createClient } from "@libsql/client";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !url.startsWith("libsql://")) {
  console.log("ℹ️  TURSO_DATABASE_URL não é libsql:// — pulando migrate-turso (dev local).");
  process.exit(0);
}

const client = createClient({ url, authToken });

async function migrate() {
  // Cria tabela de controle de migrations (compatível com Prisma)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id           TEXT    NOT NULL PRIMARY KEY,
      checksum     TEXT    NOT NULL,
      finished_at  TEXT,
      migration_name TEXT  NOT NULL,
      logs         TEXT,
      rolled_back_at TEXT,
      started_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      applied_steps_count INTEGER NOT NULL DEFAULT 0
    )
  `);

  const applied = await client.execute(
    "SELECT migration_name FROM _prisma_migrations WHERE rolled_back_at IS NULL"
  );
  const appliedNames = new Set(applied.rows.map((r) => r[0]));

  const migrationsDir = join(__dirname, "..", "prisma", "migrations");
  const dirs = readdirSync(migrationsDir)
    .filter((d) => !d.endsWith(".toml") && !d.startsWith("."))
    .sort();

  let applied_count = 0;
  for (const dir of dirs) {
    if (appliedNames.has(dir)) {
      console.log(`⏭  Já aplicada: ${dir}`);
      continue;
    }

    const sqlPath = join(migrationsDir, dir, "migration.sql");
    const sql = readFileSync(sqlPath, "utf-8");

    console.log(`⚡ Aplicando: ${dir}`);
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await client.execute(stmt + ";");
    }

    await client.execute({
      sql: `INSERT INTO _prisma_migrations 
              (id, checksum, finished_at, migration_name, applied_steps_count)
            VALUES (?, ?, ?, ?, ?)`,
      args: [randomUUID(), "0".repeat(64), new Date().toISOString(), dir, 1],
    });

    console.log(`✅ ${dir}`);
    applied_count++;
  }

  if (applied_count === 0) {
    console.log("✅ Nenhuma migration pendente.");
  } else {
    console.log(`🎉 ${applied_count} migration(s) aplicada(s).`);
  }

  client.close();
}

migrate().catch((err) => {
  console.error("❌ Erro ao aplicar migrations:", err);
  process.exit(1);
});
