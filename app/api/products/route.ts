import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ProductInput = Record<string, unknown>;

function isObject(value: unknown): value is ProductInput {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function getOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue === "" ? null : trimmedValue;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 본문은 올바른 JSON 형식이어야 합니다." },
      { status: 400 },
    );
  }

  if (!isObject(body)) {
    return NextResponse.json(
      { error: "요청 본문은 상품 정보 객체여야 합니다." },
      { status: 400 },
    );
  }

  if (typeof body.name !== "string" || body.name.trim() === "") {
    return NextResponse.json(
      { error: "상품명은 비어 있을 수 없습니다." },
      { status: 400 },
    );
  }

  if (!isNonNegativeInteger(body.costPrice)) {
    return NextResponse.json(
      { error: "매입가는 0 이상의 정수여야 합니다." },
      { status: 400 },
    );
  }

  if (!isNonNegativeInteger(body.shippingCost)) {
    return NextResponse.json(
      { error: "배송비는 0 이상의 정수여야 합니다." },
      { status: 400 },
    );
  }

  if (!isNonNegativeInteger(body.stock)) {
    return NextResponse.json(
      { error: "재고는 0 이상의 정수여야 합니다." },
      { status: 400 },
    );
  }

  if (
    body.salePrice !== undefined &&
    body.salePrice !== null &&
    !isNonNegativeInteger(body.salePrice)
  ) {
    return NextResponse.json(
      { error: "판매가는 비어 있거나 0 이상의 정수여야 합니다." },
      { status: 400 },
    );
  }

  const optionalFields = [
    ["sku", "SKU"],
    ["brand", "브랜드"],
    ["barcode", "바코드"],
    ["modelNo", "모델번호"],
    ["description", "상품 설명"],
  ] as const;

  for (const [fieldName, displayName] of optionalFields) {
    const value = body[fieldName];

    if (value !== undefined && value !== null && typeof value !== "string") {
      return NextResponse.json(
        { error: `${displayName}은(는) 문자열이어야 합니다.` },
        { status: 400 },
      );
    }
  }

  try {
    const product = await prisma.product.create({
      data: {
        name: body.name.trim(),
        costPrice: body.costPrice,
        shippingCost: body.shippingCost,
        stock: body.stock,
        sku: getOptionalString(body.sku),
        brand: getOptionalString(body.brand),
        barcode: getOptionalString(body.barcode),
        modelNo: getOptionalString(body.modelNo),
        description: getOptionalString(body.description),
        salePrice: body.salePrice === undefined ? null : body.salePrice,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("상품 저장에 실패했습니다.", error);

    return NextResponse.json(
      { error: "상품을 저장하지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("상품 목록 조회에 실패했습니다.", error);

    return NextResponse.json(
      { error: "상품 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
