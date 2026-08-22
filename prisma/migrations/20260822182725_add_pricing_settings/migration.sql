-- CreateEnum
CREATE TYPE "Marketplace" AS ENUM ('COUPANG', 'NAVER', 'ELEVENST', 'GMARKET', 'AUCTION');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "autoPricingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "targetMarginRate" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "MarketplaceFeeSetting" (
    "id" SERIAL NOT NULL,
    "marketplace" "Marketplace" NOT NULL,
    "feeRate" DECIMAL(5,2) NOT NULL,
    "additionalCost" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceFeeSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceFeeSetting_marketplace_key" ON "MarketplaceFeeSetting"("marketplace");
