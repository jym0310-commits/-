-- CreateTable
CREATE TABLE "CoupangProductSetting" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "displayCategoryCode" TEXT,
    "brandId" TEXT,
    "vendorUserId" TEXT,
    "deliveryMethod" TEXT NOT NULL DEFAULT 'SEQUENCIAL',
    "deliveryCompanyCode" TEXT,
    "deliveryChargeType" TEXT NOT NULL DEFAULT 'FREE',
    "deliveryCharge" INTEGER NOT NULL DEFAULT 0,
    "freeShipOverAmount" INTEGER NOT NULL DEFAULT 0,
    "deliveryChargeOnReturn" INTEGER,
    "remoteAreaDeliverable" TEXT NOT NULL DEFAULT 'N',
    "unionDeliveryType" TEXT NOT NULL DEFAULT 'UNION_DELIVERY',
    "returnCenterCode" TEXT,
    "returnChargeName" TEXT,
    "companyContactNumber" TEXT,
    "returnZipCode" TEXT,
    "returnAddress" TEXT,
    "returnAddressDetail" TEXT,
    "returnCharge" INTEGER,
    "outboundShippingPlaceCode" TEXT,
    "outboundShippingTimeDay" INTEGER NOT NULL DEFAULT 1,
    "maximumBuyForPerson" INTEGER NOT NULL DEFAULT 0,
    "maximumBuyForPersonPeriod" INTEGER NOT NULL DEFAULT 1,
    "unitCount" INTEGER NOT NULL DEFAULT 1,
    "adultOnly" TEXT NOT NULL DEFAULT 'EVERYONE',
    "taxType" TEXT NOT NULL DEFAULT 'TAX',
    "parallelImported" TEXT NOT NULL DEFAULT 'NOT_PARALLEL_IMPORTED',
    "overseasPurchased" TEXT NOT NULL DEFAULT 'NOT_OVERSEAS_PURCHASED',
    "pccNeeded" BOOLEAN NOT NULL DEFAULT false,
    "emptyBarcodeReason" TEXT,
    "attributes" JSONB,
    "notices" JSONB,
    "certifications" JSONB,
    "requiredDocuments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoupangProductSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceProduct" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "marketplace" "Marketplace" NOT NULL,
    "marketplaceProductId" TEXT,
    "marketplaceItemId" TEXT,
    "salePrice" INTEGER,
    "stock" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "lastErrorCode" TEXT,
    "lastErrorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoupangProductSetting_productId_key" ON "CoupangProductSetting"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceProduct_productId_marketplace_key" ON "MarketplaceProduct"("productId", "marketplace");

-- CreateIndex
CREATE INDEX "MarketplaceProduct_marketplace_status_idx" ON "MarketplaceProduct"("marketplace", "status");

-- AddForeignKey
ALTER TABLE "CoupangProductSetting" ADD CONSTRAINT "CoupangProductSetting_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceProduct" ADD CONSTRAINT "MarketplaceProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
