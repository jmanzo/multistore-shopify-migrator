/*
  Warnings:

  - You are about to drop the `Collection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Metafield` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Variant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CollectionToProduct` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Metafield" DROP CONSTRAINT "Metafield_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "Metafield" DROP CONSTRAINT "Metafield_productId_fkey";

-- DropForeignKey
ALTER TABLE "Variant" DROP CONSTRAINT "Variant_productId_fkey";

-- DropForeignKey
ALTER TABLE "_CollectionToProduct" DROP CONSTRAINT "_CollectionToProduct_A_fkey";

-- DropForeignKey
ALTER TABLE "_CollectionToProduct" DROP CONSTRAINT "_CollectionToProduct_B_fkey";

-- DropTable
DROP TABLE "Collection";

-- DropTable
DROP TABLE "Metafield";

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "Variant";

-- DropTable
DROP TABLE "_CollectionToProduct";

-- CreateTable
CREATE TABLE "Setting" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "products" BOOLEAN NOT NULL DEFAULT false,
    "collections" BOOLEAN NOT NULL DEFAULT false,
    "navigations" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Setting_shop_key" ON "Setting"("shop");
