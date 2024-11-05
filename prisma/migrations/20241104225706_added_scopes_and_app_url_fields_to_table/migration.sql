/*
  Warnings:

  - Added the required column `appUrl` to the `Connection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scopes` to the `Connection` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Connection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "apiSecret" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "appUrl" TEXT NOT NULL
);
INSERT INTO "new_Connection" ("apiKey", "apiSecret", "id", "shop", "storeName") SELECT "apiKey", "apiSecret", "id", "shop", "storeName" FROM "Connection";
DROP TABLE "Connection";
ALTER TABLE "new_Connection" RENAME TO "Connection";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
