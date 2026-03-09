import "dotenv/config";
import { defineConfig } from "prisma/config";

// Em prod (Turso): monta URL com authToken embutido para o CLI Prisma
// Em dev: usa DATABASE_URL (file: local)
function getDatasourceUrl(): string {
  const tursoUrl = process.env["TURSO_DATABASE_URL"];
  const tursoToken = process.env["TURSO_AUTH_TOKEN"];
  if (tursoUrl && tursoUrl.startsWith("libsql://") && tursoToken) {
    return `${tursoUrl}?authToken=${tursoToken}`;
  }
  return process.env["DATABASE_URL"]!;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getDatasourceUrl(),
  },
});
