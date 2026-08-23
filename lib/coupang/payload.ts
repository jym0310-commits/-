import type {
  CoupangCertification,
  CoupangProductPayload,
  CoupangProductSource,
  CoupangRequiredDocument,
} from "@/lib/coupang/types";
import {
  toCoupangAttributes,
  toCoupangNotices,
} from "@/lib/coupang/category-metadata";

export function buildCoupangPayload(
  product: CoupangProductSource,
  vendorId: string,
  now = new Date(),
): CoupangProductPayload {
  const setting = product.coupangSetting;

  if (!setting || product.salePrice === null) {
    throw new Error("쿠팡 payload를 만들기 위한 필수정보가 없습니다.");
  }

  const images = [...product.images].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder,
  );
  const certifications = getArray<CoupangCertification>(setting.certifications);
  const requiredDocuments = getArray<CoupangRequiredDocument>(setting.requiredDocuments);
  const attributes = addProductIdentifiers(
    toCoupangAttributes(setting.attributes),
    product.barcode,
    product.modelNo,
  );
  const description = product.description?.trim() || `${product.name} 상품 상세정보`;

  return {
    displayCategoryCode: Number(setting.displayCategoryCode),
    sellerProductName: product.name.slice(0, 100),
    vendorId,
    saleStartedAt: formatCoupangDate(now),
    saleEndedAt: "2099-12-31T23:59:59",
    displayProductName: [product.brand, product.name].filter(Boolean).join(" ").slice(0, 100),
    brand: product.brand ?? "",
    ...(setting.brandId ? { brandId: setting.brandId } : {}),
    generalProductName: product.name.slice(0, 100),
    deliveryMethod: setting.deliveryMethod,
    deliveryCompanyCode: setting.deliveryCompanyCode ?? "",
    deliveryChargeType: setting.deliveryChargeType,
    deliveryCharge: setting.deliveryCharge,
    freeShipOverAmount: setting.freeShipOverAmount,
    deliveryChargeOnReturn: setting.deliveryChargeOnReturn ?? 0,
    remoteAreaDeliverable: setting.remoteAreaDeliverable,
    unionDeliveryType: setting.unionDeliveryType,
    returnCenterCode: setting.returnCenterCode ?? "",
    returnChargeName: setting.returnChargeName ?? "",
    companyContactNumber: setting.companyContactNumber ?? "",
    returnZipCode: setting.returnZipCode ?? "",
    returnAddress: setting.returnAddress ?? "",
    returnAddressDetail: setting.returnAddressDetail ?? "",
    returnCharge: setting.returnCharge ?? 0,
    outboundShippingPlaceCode: Number(setting.outboundShippingPlaceCode),
    vendorUserId: setting.vendorUserId ?? "",
    requested: false,
    items: [
      {
        itemName: product.name.slice(0, 150),
        originalPrice: product.salePrice,
        salePrice: product.salePrice,
        maximumBuyCount: product.stock,
        maximumBuyForPerson: setting.maximumBuyForPerson,
        maximumBuyForPersonPeriod: setting.maximumBuyForPersonPeriod,
        outboundShippingTimeDay: setting.outboundShippingTimeDay,
        unitCount: setting.unitCount,
        adultOnly: setting.adultOnly,
        taxType: setting.taxType,
        parallelImported: setting.parallelImported,
        overseasPurchased: setting.overseasPurchased,
        pccNeeded: setting.pccNeeded,
        ...(product.sku ? { externalVendorSku: product.sku } : {}),
        ...(product.barcode
          ? { barcode: product.barcode }
          : {
              emptyBarcode: true as const,
              emptyBarcodeReason: setting.emptyBarcodeReason ?? "바코드 없음",
            }),
        ...(product.modelNo ? { modelNo: product.modelNo } : {}),
        images: images.map((image, index) => ({
          imageOrder: index,
          imageType: index === 0 ? "REPRESENTATION" : "DETAIL",
          vendorPath: image.imageUrl,
        })),
        notices: toCoupangNotices(setting.notices),
        attributes,
        ...(certifications.length > 0 ? { certifications } : {}),
        contents: [
          {
            contentsType: "TEXT",
            contentDetails: [{ content: description, detailType: "TEXT" }],
          },
        ],
      },
    ],
    ...(requiredDocuments.length > 0 ? { requiredDocuments } : {}),
  };
}

function addProductIdentifiers(
  attributes: ReturnType<typeof toCoupangAttributes>,
  barcode: string | null,
  modelNo: string | null,
) {
  const result = [...attributes];
  if (
    barcode &&
    !result.some((item) => item.attributeTypeName === "Global Trade Item Number")
  ) {
    result.push({
      attributeTypeName: "Global Trade Item Number",
      attributeValueName: barcode,
      exposed: "NONE",
    });
  }
  if (
    modelNo &&
    !result.some((item) => item.attributeTypeName === "Manufacturer Part Number")
  ) {
    result.push({
      attributeTypeName: "Manufacturer Part Number",
      attributeValueName: modelNo,
      exposed: "NONE",
    });
  }
  return result;
}

function formatCoupangDate(date: Date) {
  return date.toISOString().slice(0, 19);
}

function getArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
