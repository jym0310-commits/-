-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" TEXT,
ADD COLUMN     "depth" INTEGER,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "supplierName" TEXT,
ADD COLUMN     "supplierProductCode" TEXT,
ADD COLUMN     "supplierUrl" TEXT,
ADD COLUMN     "weight" INTEGER,
ADD COLUMN     "width" INTEGER;

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
