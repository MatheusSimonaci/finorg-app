-- CreateTable
CREATE TABLE "RecurringExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "category" TEXT NOT NULL,
    "totalInstallments" INTEGER,
    "currentInstallment" INTEGER,
    "startDate" DATETIME,
    "monthOfYear" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SnoozedAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertKey" TEXT NOT NULL,
    "reason" TEXT,
    "snoozedUntil" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "SnoozedAlert_alertKey_key" ON "SnoozedAlert"("alertKey");
