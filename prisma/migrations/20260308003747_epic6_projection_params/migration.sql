-- CreateTable
CREATE TABLE "ProjectionParams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetCategory" TEXT NOT NULL,
    "annualRate" REAL NOT NULL,
    "irRate" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GlobalParams" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "inflationRate" REAL NOT NULL DEFAULT 0.045,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectionParams_assetCategory_key" ON "ProjectionParams"("assetCategory");
