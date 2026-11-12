-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RenderJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "userId" TEXT,
    "audioKey" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "progress" REAL NOT NULL DEFAULT 0,
    "outputPath" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "workerId" TEXT,
    "heartbeatAt" DATETIME,
    "startedAt" DATETIME,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "appOrigin" TEXT,
    CONSTRAINT "RenderJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RenderJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RenderJob" ("audioKey", "completedAt", "createdAt", "errorMessage", "id", "outputPath", "progress", "projectId", "settings", "status", "userId") SELECT "audioKey", "completedAt", "createdAt", "errorMessage", "id", "outputPath", "progress", "projectId", "settings", "status", "userId" FROM "RenderJob";
DROP TABLE "RenderJob";
ALTER TABLE "new_RenderJob" RENAME TO "RenderJob";
CREATE INDEX "RenderJob_status_createdAt_idx" ON "RenderJob"("status", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
