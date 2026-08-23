import { NextResponse } from "next/server";
import { findProductForCoupang, getProductId } from "@/lib/coupang/product";
import { validateProductForCoupang } from "@/lib/coupang/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const productId = await getProductId(context);
  if (productId === null) {
    return NextResponse.json({ error: "상품 ID가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const product = await findProductForCoupang(productId);
    if (!product) {
      return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(validateProductForCoupang(product));
  } catch (error) {
    console.error("쿠팡 등록 준비상태 조회에 실패했습니다.", error);
    return NextResponse.json(
      { error: "쿠팡 등록 준비상태를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
