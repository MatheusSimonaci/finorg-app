-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Transaction" (
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
    "importBatchId" TEXT,
    "hash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassificationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pattern" TEXT NOT NULL,
    "nature" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT,
    "subcategory" TEXT,
    "source" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "institution" TEXT NOT NULL,
    "currentValue" DECIMAL NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purpose" TEXT NOT NULL DEFAULT 'personal',
    "dreamId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "accountId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Asset_dreamId_fkey" FOREIGN KEY ("dreamId") REFERENCES "Dream" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Asset_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dream" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "targetAmount" DECIMAL NOT NULL,
    "targetDate" DATETIME,
    "priorityOrder" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planejando',
    "achievedAt" DATETIME,
    "archivedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "targetPct" REAL NOT NULL,
    "alertThresholdPct" REAL NOT NULL DEFAULT 80,
    "monthOverride" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmergencyReserveConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "targetMonths" INTEGER NOT NULL DEFAULT 4,
    "calculationWindowMonths" INTEGER NOT NULL DEFAULT 3,
    "excludeOutliers" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_hash_key" ON "Transaction"("hash");
