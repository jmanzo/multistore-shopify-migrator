/*
  Warnings:

  - You are about to drop the column `apiSecret` on the `Connection` table. All the data in the column will be lost.
  - You are about to drop the column `appUrl` on the `Connection` table. All the data in the column will be lost.
  - You are about to drop the column `scopes` on the `Connection` table. All the data in the column will be lost.
  - Added the required column `accessToken` to the `Connection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `Connection` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Connection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "url" TEXT NOT NULL
);
INSERT INTO "new_Connection" ("apiKey", "id", "shop", "storeName") SELECT "apiKey", "id", "shop", "storeName" FROM "Connection";
DROP TABLE "Connection";
ALTER TABLE "new_Connection" RENAME TO "Connection";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
