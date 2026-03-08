-- CreateTable
CREATE TABLE "SnapshotSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "privacyMode" TEXT NOT NULL DEFAULT 'public',
    "passwordHash" TEXT,
    "maskValues" BOOLEAN NOT NULL DEFAULT false,
    "vercelTokenEnc" TEXT,
    "lastDeployUrl" TEXT,
    "lastDeployedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);
