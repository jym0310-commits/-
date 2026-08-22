-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "costPrice" INTEGER NOT NULL,
    "shippingCost" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL,
    "sku" TEXT,
    "brand" TEXT,
    "barcode" TEXT,
    "modelNo" TEXT,
    "description" TEXT,
    "salePrice" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
