export type ProductData = {
  name: string;
  costPrice: number;
  shippingCost: number;
  stock: number;
  sku: string | null;
  brand: string | null;
  barcode: string | null;
  modelNo: string | null;
  description: string | null;
  salePrice: number | null;
  manufacturer: string | null;
  origin: string | null;
  category: string | null;
  supplierName: string | null;
  supplierUrl: string | null;
  supplierProductCode: string | null;
  weight: number | null;
  width: number | null;
  height: number | null;
  depth: number | null;
  autoPricingEnabled: boolean;
  targetMarginRate: number | null;
};

type ValidationResult = { data: ProductData } | { error: string };

type ProductInput = Record<string, unknown>;

const optionalStringFields = [
  ["sku", "SKU"],
  ["brand", "브랜드"],
  ["barcode", "바코드"],
  ["modelNo", "모델번호"],
  ["description", "상품 설명"],
  ["manufacturer", "제조사"],
  ["origin", "원산지"],
  ["category", "카테고리"],
  ["supplierName", "공급처"],
  ["supplierUrl", "공급처 URL"],
  ["supplierProductCode", "공급처 상품코드"],
] as const;

const optionalIntegerFields = [
  ["weight", "무게"],
  ["width", "가로"],
  ["height", "세로"],
  ["depth", "깊이"],
] as const;

export function validateProductInput(body: unknown): ValidationResult {
  if (!isObject(body)) {
    return { error: "요청 본문은 상품 정보 객체여야 합니다." };
  }

  if (typeof body.name !== "string" || body.name.trim() === "") {
    return { error: "상품명은 비어 있을 수 없습니다." };
  }

  for (const [fieldName, label] of [
    ["costPrice", "매입가"],
    ["shippingCost", "배송비"],
    ["stock", "재고"],
  ] as const) {
    if (!isNonNegativeInteger(body[fieldName])) {
      return { error: `${label}는 0 이상의 정수여야 합니다.` };
    }
  }

  if (
    body.salePrice !== undefined &&
    body.salePrice !== null &&
    !isNonNegativeInteger(body.salePrice)
  ) {
    return { error: "판매가는 비어 있거나 0 이상의 정수여야 합니다." };
  }

  if (
    body.autoPricingEnabled !== undefined &&
    typeof body.autoPricingEnabled !== "boolean"
  ) {
    return { error: "자동 판매가 계산 여부는 true 또는 false여야 합니다." };
  }

  if (
    body.targetMarginRate !== undefined &&
    body.targetMarginRate !== null &&
    !isValidPercentage(body.targetMarginRate)
  ) {
    return { error: "목표 마진율은 0 이상 100 미만의 숫자여야 합니다." };
  }

  for (const [fieldName, label] of optionalStringFields) {
    const value = body[fieldName];

    if (value !== undefined && value !== null && typeof value !== "string") {
      return { error: `${label}은(는) 문자열이어야 합니다.` };
    }
  }

  if (!isValidOptionalUrl(body.supplierUrl)) {
    return { error: "공급처 URL은 올바른 http 또는 https URL이어야 합니다." };
  }

  for (const [fieldName, label] of optionalIntegerFields) {
    const value = body[fieldName];

    if (value !== undefined && value !== null && !isNonNegativeInteger(value)) {
      return { error: `${label}는 비어 있거나 0 이상의 정수여야 합니다.` };
    }
  }

  const costPrice = Number(body.costPrice);
  const shippingCost = Number(body.shippingCost);
  const stock = Number(body.stock);

  return {
    data: {
      name: body.name.trim(),
      costPrice,
      shippingCost,
      stock,
      sku: getOptionalString(body.sku),
      brand: getOptionalString(body.brand),
      barcode: getOptionalString(body.barcode),
      modelNo: getOptionalString(body.modelNo),
      description: getOptionalString(body.description),
      salePrice: getOptionalInteger(body.salePrice),
      manufacturer: getOptionalString(body.manufacturer),
      origin: getOptionalString(body.origin),
      category: getOptionalString(body.category),
      supplierName: getOptionalString(body.supplierName),
      supplierUrl: getOptionalString(body.supplierUrl),
      supplierProductCode: getOptionalString(body.supplierProductCode),
      weight: getOptionalInteger(body.weight),
      width: getOptionalInteger(body.width),
      height: getOptionalInteger(body.height),
      depth: getOptionalInteger(body.depth),
      autoPricingEnabled: body.autoPricingEnabled ?? false,
      targetMarginRate: getOptionalNumber(body.targetMarginRate),
    },
  };
}

function isObject(value: unknown): value is ProductInput {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isValidPercentage(value: unknown): value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return false;
  }

  return (
    value >= 0 &&
    value < 100 &&
    Math.abs(value * 100 - Math.round(value * 100)) < 1e-9
  );
}

function getOptionalString(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmedValue = String(value).trim();
  return trimmedValue === "" ? null : trimmedValue;
}

function getOptionalInteger(value: unknown): number | null {
  return value === undefined || value === null ? null : Number(value);
}

function getOptionalNumber(value: unknown): number | null {
  return value === undefined || value === null ? null : Number(value);
}

function isValidOptionalUrl(value: unknown) {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value !== "string" || value.trim() === "") {
    return true;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
