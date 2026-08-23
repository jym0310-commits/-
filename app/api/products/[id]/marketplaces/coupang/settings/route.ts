import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductId } from "@/lib/coupang/product";
import { validateCoupangSetting } from "@/lib/coupang/settings-validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const productId = await getProductId(context);
  if (productId === null) {
    return NextResponse.json({ error: "상품 ID가 올바르지 않습니다." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문은 올바른 JSON이어야 합니다." }, { status: 400 });
  }

  const validation = validateCoupangSetting(body);
  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) {
      return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
    }

    const setting = await prisma.coupangProductSetting.upsert({
      where: { productId },
      create: { productId, ...validation.data },
      update: validation.data,
    });
    return NextResponse.json(setting);
  } catch (error) {
    console.error("쿠팡 상품 설정 저장에 실패했습니다.", error);
    return NextResponse.json({ error: "쿠팡 상품 설정을 저장하지 못했습니다." }, { status: 500 });
  }
}
