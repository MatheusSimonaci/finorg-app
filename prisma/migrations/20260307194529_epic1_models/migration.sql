-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "imported" INTEGER NOT NULL DEFAULT 0,
    "duplicates" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "tokensUsed" INTEGER,
    "costBRL" REAL,
    "status" TEXT NOT NULL DEFAULT 'imported',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClassificationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pattern" TEXT NOT NULL,
    "nature" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT,
    "subcategory" TEXT,
    "source" TEXT NOT NULL DEFAULT 'user',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ClassificationRule" ("category", "createdAt", "id", "nature", "pattern", "source", "subcategory", "type") SELECT "category", "createdAt", "id", "nature", "pattern", "source", "subcategory", "type" FROM "ClassificationRule";
DROP TABLE "ClassificationRule";
ALTER TABLE "new_ClassificationRule" RENAME TO "ClassificationRule";
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "accountId" TEXT NOT NULL,
    "nature" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "type" TEXT,
    "confidence" REAL,
    "reasoning" TEXT,
    "isReimbursable" BOOLEAN NOT NULL DEFAULT false,
    "classificationOverride" BOOLEAN NOT NULL DEFAULT false,
    "classificationSource" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
    "importBatchId" TEXT,
    "hash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("accountId", "amount", "category", "classificationOverride", "confidence", "createdAt", "date", "description", "hash", "id", "importBatchId", "isReimbursable", "nature", "reasoning", "subcategory", "type") SELECT "accountId", "amount", "category", "classificationOverride", "confidence", "createdAt", "date", "description", "hash", "id", "importBatchId", "isReimbursable", "nature", "reasoning", "subcategory", "type" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE UNIQUE INDEX "Transaction_hash_key" ON "Transaction"("hash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AppConfig_key_key" ON "AppConfig"("key");
