import {
  isValidDisplayCategoryCode,
  toCoupangAttributes,
  toCoupangNotices,
  validateStoredAttributes,
  validateStoredNotices,
} from "@/lib/coupang/category-metadata";
import type { CoupangProductSource, CoupangReadiness } from "@/lib/coupang/types";
import { imageStorage } from "@/lib/storage";

export function isCoupangLiveEnabled() {
  return process.env.COUPANG_LIVE_ENABLED === "true";
}

export function isCoupangRequestAllowed(method: string) {
  return method.toUpperCase() === "GET" || isCoupangLiveEnabled();
}

export function validateProductForCoupang(
  product: CoupangProductSource,
): CoupangReadiness {
  const setting = product.coupangSetting;
  const primaryImage = product.images.find((image) => image.isPrimary);
  const attributeValidation = validateStoredAttributes(setting?.attributes);
  const noticeValidation = validateStoredNotices(setting?.notices);
  const payloadAttributes = toCoupangAttributes(setting?.attributes);
  const payloadNotices = toCoupangNotices(setting?.notices);
  const alreadyRegistered = product.marketplaceProducts.some(
    (record) =>
      record.marketplace === "COUPANG" &&
      ["REGISTERING", "REGISTERED", "REMOTE_CREATED_LOCAL_SAVE_FAILED"].includes(
        record.status,
      ),
  );

  const checks = [
    check("name", "상품명", Boolean(product.name.trim())),
    check("salePrice", "판매가", product.salePrice !== null && product.salePrice > 0),
    check("stock", "재고", product.stock >= 0 && product.stock <= 99_999),
    check("primaryImage", "대표 이미지", Boolean(primaryImage)),
    check(
      "publicImages",
      "마켓 등록용 공개 이미지",
      product.images.every((image) => imageStorage.isPubliclyAccessible(image.imageUrl)),
    ),
    check("brand", "브랜드", Boolean(product.brand?.trim())),
    check("manufacturer", "제조사", Boolean(product.manufacturer?.trim())),
    check("origin", "원산지", Boolean(product.origin?.trim())),
    check(
      "identifier",
      "GTIN 또는 모델번호",
      Boolean(product.barcode?.trim() || product.modelNo?.trim()),
    ),
    check(
      "category",
      "쿠팡 카테고리",
      isValidDisplayCategoryCode(setting?.displayCategoryCode),
    ),
    check(
      "attributes",
      "쿠팡 필수 구매옵션",
      attributeValidation.valid &&
        payloadAttributes.length > 0 &&
        attributeValidation.duplicateKeys.length === 0 &&
        attributeValidation.missingRequiredKeys.length === 0 &&
        attributeValidation.invalidValueKeys.length === 0,
    ),
    check(
      "notices",
      "상품고시정보",
      noticeValidation.valid &&
        payloadNotices.length > 0 &&
        noticeValidation.duplicateKeys.length === 0 &&
        noticeValidation.missingRequiredKeys.length === 0,
    ),
    check("vendorUserId", "Wing 사용자 ID", Boolean(setting?.vendorUserId?.trim())),
    check("deliveryCompany", "택배사", Boolean(setting?.deliveryCompanyCode?.trim())),
    check("outboundPlace", "출고지", Boolean(setting?.outboundShippingPlaceCode?.trim())),
    check(
      "returnPlace",
      "반품지",
      Boolean(
        setting?.returnCenterCode?.trim() &&
          setting.returnChargeName?.trim() &&
          setting.companyContactNumber?.trim() &&
          setting.returnZipCode?.trim() &&
          setting.returnAddress?.trim() &&
          setting.returnAddressDetail?.trim() &&
          setting.returnCharge !== null &&
          setting.deliveryChargeOnReturn !== null,
      ),
    ),
    check("duplicate", "쿠팡 중복 등록 없음", !alreadyRegistered),
  ];

  const warnings: string[] = [];
  if (!isCoupangLiveEnabled()) {
    warnings.push("실제 쿠팡 상품등록 기능이 비활성화되어 있습니다.");
  }
  if (attributeValidation.duplicateKeys.length > 0) {
    warnings.push(`중복 속성: ${attributeValidation.duplicateKeys.join(", ")}`);
  }
  if (attributeValidation.missingRequiredKeys.length > 0) {
    warnings.push(
      `값이 없는 필수 속성: ${attributeValidation.missingRequiredKeys.join(", ")}`,
    );
  }
  if (attributeValidation.invalidValueKeys.length > 0) {
    warnings.push(
      `허용 목록에 없는 속성값: ${attributeValidation.invalidValueKeys.join(", ")}`,
    );
  }
  if (noticeValidation.duplicateKeys.length > 0) {
    warnings.push(`중복 상품고시: ${noticeValidation.duplicateKeys.join(", ")}`);
  }
  if (noticeValidation.missingRequiredKeys.length > 0) {
    warnings.push(
      `내용이 없는 필수 상품고시: ${noticeValidation.missingRequiredKeys.join(", ")}`,
    );
  }
  warnings.push("상품은 자동 승인 요청 없이 임시 저장 상태로 생성됩니다.");

  return {
    ready: checks.every((item) => item.passed),
    liveEnabled: isCoupangLiveEnabled(),
    checks,
    missingFields: checks.filter((item) => !item.passed).map((item) => getMissingMessage(item.key)),
    warnings,
    payloadSummary: {
      displayCategoryCode: setting?.displayCategoryCode ?? null,
      itemCount: 1,
      salePrice: product.salePrice,
      stock: product.stock,
      imageCount: product.images.length,
    },
  };
}

export const getAttributes = toCoupangAttributes;
export const getNotices = toCoupangNotices;

function check(key: string, label: string, passed: boolean) {
  return { key, label, passed };
}

function getMissingMessage(key: string) {
  const messages: Record<string, string> = {
    name: "상품명이 필요합니다.",
    salePrice: "0원보다 큰 판매가가 필요합니다.",
    stock: "재고는 0개 이상 99,999개 이하여야 합니다.",
    primaryImage: "대표 이미지가 없습니다.",
    publicImages: "실제 마켓 등록용 공개 이미지 저장소가 필요합니다.",
    brand: "브랜드가 필요합니다.",
    manufacturer: "제조사가 필요합니다.",
    origin: "원산지가 필요합니다.",
    identifier: "GTIN(바코드) 또는 모델번호가 필요합니다.",
    category: "쿠팡 카테고리 코드는 0으로 시작하지 않는 숫자여야 합니다.",
    attributes: "속성 구조, 필수값 또는 중복 속성을 확인해 주세요.",
    notices: "상품고시 구조, 필수 내용 또는 중복 고시를 확인해 주세요.",
    vendorUserId: "쿠팡 Wing 사용자 ID가 필요합니다.",
    deliveryCompany: "쿠팡 택배사 코드가 필요합니다.",
    outboundPlace: "쿠팡 출고지 코드가 필요합니다.",
    returnPlace: "쿠팡 반품지 정보와 반품배송비가 필요합니다.",
    duplicate: "이미 쿠팡 등록 중이거나 등록된 상품입니다.",
  };

  return messages[key] ?? "쿠팡 등록 필수정보가 누락되었습니다.";
}
