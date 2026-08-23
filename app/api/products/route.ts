import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateProductInput } from "@/lib/products/validation";

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

  const validation = validateProductInput(body);
  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const product = await prisma.product.create({ data: validation.data });
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
      include: {
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
          take: 1,
        },
      },
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
