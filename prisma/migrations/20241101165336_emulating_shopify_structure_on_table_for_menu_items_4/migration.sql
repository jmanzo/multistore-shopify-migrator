/*
  Warnings:

  - A unique constraint covering the columns `[shopifyId,handle]` on the table `Menu` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Menu_shopifyId_handle_key" ON "Menu"("shopifyId", "handle");
