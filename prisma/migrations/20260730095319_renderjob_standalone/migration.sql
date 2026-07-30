/*
  Warnings:

  - Added the required column `audioKey` to the `RenderJob` table without a default value. This is not possible if the table is not empty.
  - Added the required column `settings` to the `RenderJob` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RenderJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "audioKey" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "progress" REAL NOT NULL DEFAULT 0,
    "outputPath" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "RenderJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RenderJob" ("completedAt", "createdAt", "errorMessage", "id", "outputPath", "progress", "projectId", "status") SELECT "completedAt", "createdAt", "errorMessage", "id", "outputPath", "progress", "projectId", "status" FROM "RenderJob";
DROP TABLE "RenderJob";
ALTER TABLE "new_RenderJob" RENAME TO "RenderJob";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
