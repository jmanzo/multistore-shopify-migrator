/*
  Warnings:

  - A unique constraint covering the columns `[name,menuItemId]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_menuItemId_key" ON "Tag"("name", "menuItemId");
