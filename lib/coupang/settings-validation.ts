import type { Prisma } from "@/app/generated/prisma/client";
import {
  isValidDisplayCategoryCode,
  validateStoredAttributes,
  validateStoredNotices,
} from "@/lib/coupang/category-metadata";

type SettingData = {
  displayCategoryCode: string | null;
  brandId: string | null;
  vendorUserId: string | null;
  deliveryMethod: string;
  deliveryCompanyCode: string | null;
  deliveryChargeType: string;
  deliveryCharge: number;
  freeShipOverAmount: number;
  deliveryChargeOnReturn: number | null;
  remoteAreaDeliverable: string;
  unionDeliveryType: string;
  returnCenterCode: string | null;
  returnChargeName: string | null;
  companyContactNumber: string | null;
  returnZipCode: string | null;
  returnAddress: string | null;
  returnAddressDetail: string | null;
  returnCharge: number | null;
  outboundShippingPlaceCode: string | null;
  outboundShippingTimeDay: number;
  maximumBuyForPerson: number;
  maximumBuyForPersonPeriod: number;
  unitCount: number;
  adultOnly: string;
  taxType: string;
  parallelImported: string;
  overseasPurchased: string;
  pccNeeded: boolean;
  emptyBarcodeReason: string | null;
  attributes: Prisma.InputJsonValue;
  notices: Prisma.InputJsonValue;
  certifications: Prisma.InputJsonValue;
  requiredDocuments: Prisma.InputJsonValue;
};

export function validateCoupangSetting(body: unknown):
  | { data: SettingData }
  | { error: string } {
  if (!isObject(body)) {
    return { error: "쿠팡 설정은 객체 형식이어야 합니다." };
  }

  const displayCategoryCode = optionalString(body.displayCategoryCode);
  if (displayCategoryCode !== null && !isValidDisplayCategoryCode(displayCategoryCode)) {
    return { error: "쿠팡 카테고리 코드는 0으로 시작하지 않는 숫자여야 합니다." };
  }

  for (const [field, label] of [
    ["deliveryCharge", "기본 배송비"],
    ["freeShipOverAmount", "무료배송 기준금액"],
    ["outboundShippingTimeDay", "기준 출고일"],
    ["maximumBuyForPerson", "인당 최대 구매수량"],
    ["maximumBuyForPersonPeriod", "구매 제한 기간"],
    ["unitCount", "단위수량"],
  ] as const) {
    if (!isNonNegativeInteger(body[field])) {
      return { error: `${label}은(는) 0 이상의 정수여야 합니다.` };
    }
  }

  for (const [field, label] of [
    ["deliveryChargeOnReturn", "초도반품배송비"],
    ["returnCharge", "반품배송비"],
  ] as const) {
    if (body[field] !== null && !isNonNegativeInteger(body[field])) {
      return { error: `${label}은(는) 비어 있거나 0 이상의 정수여야 합니다.` };
    }
  }

  for (const [field, allowed] of [
    ["deliveryMethod", ["SEQUENCIAL", "COLD_FRESH", "MAKE_ORDER", "AGENT_BUY", "VENDOR_DIRECT"]],
    ["deliveryChargeType", ["FREE", "NOT_FREE", "CHARGE_RECEIVED", "CONDITIONAL_FREE"]],
    ["remoteAreaDeliverable", ["Y", "N"]],
    ["unionDeliveryType", ["UNION_DELIVERY", "NOT_UNION_DELIVERY"]],
    ["adultOnly", ["ADULT_ONLY", "EVERYONE"]],
    ["taxType", ["TAX", "FREE"]],
    ["parallelImported", ["PARALLEL_IMPORTED", "NOT_PARALLEL_IMPORTED"]],
    ["overseasPurchased", ["OVERSEAS_PURCHASED", "NOT_OVERSEAS_PURCHASED"]],
  ] as const) {
    if (typeof body[field] !== "string" || !allowed.includes(body[field] as never)) {
      return { error: `${field} 값이 올바르지 않습니다.` };
    }
  }

  if (typeof body.pccNeeded !== "boolean") {
    return { error: "개인통관부호 필요 여부는 true 또는 false여야 합니다." };
  }

  for (const field of ["attributes", "notices", "certifications", "requiredDocuments"] as const) {
    if (!Array.isArray(body[field]) || !body[field].every(isObject)) {
      return { error: `${field} 값은 객체 목록이어야 합니다.` };
    }
  }

  const attributesInput = body.attributes as unknown[];
  const noticesInput = body.notices as unknown[];
  const attributeValidation = validateStoredAttributes(attributesInput);
  if (attributesInput.length > 0 && !attributeValidation.valid) {
    return { error: "속성의 이름, 값 또는 메타정보 형식이 올바르지 않습니다." };
  }
  if (attributeValidation.duplicateKeys.length > 0) {
    return { error: `중복 속성이 있습니다: ${attributeValidation.duplicateKeys.join(", ")}` };
  }

  const noticeValidation = validateStoredNotices(noticesInput);
  if (noticesInput.length > 0 && !noticeValidation.valid) {
    return { error: "상품고시의 카테고리, 상세 항목 또는 내용 형식이 올바르지 않습니다." };
  }
  if (noticeValidation.duplicateKeys.length > 0) {
    return { error: `중복 상품고시가 있습니다: ${noticeValidation.duplicateKeys.join(", ")}` };
  }

  return {
    data: {
      displayCategoryCode,
      brandId: optionalString(body.brandId),
      vendorUserId: optionalString(body.vendorUserId),
      deliveryMethod: String(body.deliveryMethod),
      deliveryCompanyCode: optionalString(body.deliveryCompanyCode),
      deliveryChargeType: String(body.deliveryChargeType),
      deliveryCharge: Number(body.deliveryCharge),
      freeShipOverAmount: Number(body.freeShipOverAmount),
      deliveryChargeOnReturn: optionalInteger(body.deliveryChargeOnReturn),
      remoteAreaDeliverable: String(body.remoteAreaDeliverable),
      unionDeliveryType: String(body.unionDeliveryType),
      returnCenterCode: optionalString(body.returnCenterCode),
      returnChargeName: optionalString(body.returnChargeName),
      companyContactNumber: optionalString(body.companyContactNumber),
      returnZipCode: optionalString(body.returnZipCode),
      returnAddress: optionalString(body.returnAddress),
      returnAddressDetail: optionalString(body.returnAddressDetail),
      returnCharge: optionalInteger(body.returnCharge),
      outboundShippingPlaceCode: optionalString(body.outboundShippingPlaceCode),
      outboundShippingTimeDay: Number(body.outboundShippingTimeDay),
      maximumBuyForPerson: Number(body.maximumBuyForPerson),
      maximumBuyForPersonPeriod: Number(body.maximumBuyForPersonPeriod),
      unitCount: Number(body.unitCount),
      adultOnly: String(body.adultOnly),
      taxType: String(body.taxType),
      parallelImported: String(body.parallelImported),
      overseasPurchased: String(body.overseasPurchased),
      pccNeeded: Boolean(body.pccNeeded),
      emptyBarcodeReason: optionalString(body.emptyBarcodeReason),
      attributes: body.attributes as Prisma.InputJsonValue,
      notices: body.notices as Prisma.InputJsonValue,
      certifications: body.certifications as Prisma.InputJsonValue,
      requiredDocuments: body.requiredDocuments as Prisma.InputJsonValue,
    },
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalInteger(value: unknown) {
  return value === null ? null : Number(value);
}
