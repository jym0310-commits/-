import { NextResponse } from "next/server";
import { hasCoupangApiCredentials } from "@/lib/coupang/auth";
import { getCoupangCategoryMetadata } from "@/lib/coupang/category-metadata-api";
import { buildCoupangCategoryMetadataPreview } from "@/lib/coupang/category-metadata-preview";
import { isValidDisplayCategoryCode } from "@/lib/coupang/category-metadata";
import { findProductForCoupang, getProductId } from "@/lib/coupang/product";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const productId = await getProductId(context);
  if (productId === null) {
    return NextResponse.json({ error: "상품 ID가 올바르지 않습니다." }, { status: 400 });
  }

  const product = await findProductForCoupang(productId);
  if (!product) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }

  const setting = product.coupangSetting;
  const displayCategoryCode = setting?.displayCategoryCode?.trim() ?? "";
  if (!isValidDisplayCategoryCode(displayCategoryCode)) {
    return NextResponse.json(
      { error: "쿠팡 카테고리 코드를 먼저 저장해 주세요." },
      { status: 400 },
    );
  }

  if (!hasCoupangApiCredentials()) {
    return NextResponse.json(
      {
        success: false,
        code: "COUPANG_CREDENTIALS_MISSING",
        message: "쿠팡 API 인증정보가 필요합니다.",
      },
      { status: 503 },
    );
  }

  try {
    const metadata = await getCoupangCategoryMetadata(displayCategoryCode);
    return NextResponse.json(
      buildCoupangCategoryMetadataPreview({
        displayCategoryCode,
        metadata,
        existingAttributes: setting?.attributes,
        existingNotices: setting?.notices,
      }),
    );
  } catch (error) {
    console.error("쿠팡 카테고리 메타정보 조회에 실패했습니다.", error);
    return NextResponse.json(
      { error: "쿠팡 카테고리 메타정보를 불러오지 못했습니다." },
      { status: 502 },
    );
  }
}
