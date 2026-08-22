import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateProductInput } from "@/lib/products/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getProductId(context: RouteContext) {
  const { id } = await context.params;
  const productId = Number(id);

  return Number.isInteger(productId) && productId > 0 ? productId : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const productId = await getProductId(context);

  if (productId === null) {
    return NextResponse.json(
      { error: "상품 ID는 올바른 양의 정수여야 합니다." },
      { status: 400 },
    );
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("상품 조회에 실패했습니다.", error);

    return NextResponse.json(
      { error: "상품을 불러오지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const productId = await getProductId(context);

  if (productId === null) {
    return NextResponse.json(
      { error: "상품 ID는 올바른 양의 정수여야 합니다." },
      { status: 400 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 본문은 올바른 JSON 형식이어야 합니다." },
      { status: 400 },
    );
  }

  const validation = validateProductInput(body);
  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: validation.data,
    });

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("상품 수정에 실패했습니다.", error);

    return NextResponse.json(
      { error: "상품을 수정하지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
