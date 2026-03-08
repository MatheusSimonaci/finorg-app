-- CreateTable
CREATE TABLE "DreamRebalancingSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dreamId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "deviationPct" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DreamRebalancingSnapshot_dreamId_fkey" FOREIGN KEY ("dreamId") REFERENCES "Dream" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
