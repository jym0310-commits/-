import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { imageStorage } from "@/lib/storage";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseProductId(id: string) {
  const productId = Number(id);
  return Number.isInteger(productId) && productId > 0 ? productId : null;
}

function isValidImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function findProduct(context: RouteContext) {
  const { id } = await context.params;
  const productId = parseProductId(id);

  if (productId === null) {
    return { productId: null, product: null };
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  return { productId, product };
}

export async function GET(_request: Request, context: RouteContext) {
  const { productId, product } = await findProduct(context);

  if (productId === null) {
    return NextResponse.json({ error: "상품 ID가 올바르지 않습니다." }, { status: 400 });
  }

  if (!product) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }

  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
  });

  return NextResponse.json(images, { status: 200 });
}

export async function POST(request: Request, context: RouteContext) {
  const { productId, product } = await findProduct(context);

  if (productId === null) {
    return NextResponse.json({ error: "상품 ID가 올바르지 않습니다." }, { status: 400 });
  }

  if (!product) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let imageUrl: string;

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "이미지 파일을 선택해주세요." }, { status: 400 });
      }

      imageUrl = await imageStorage.save({ productId, file });
    } else {
      const body: unknown = await request.json();
      const requestedUrl =
        typeof body === "object" && body !== null && "imageUrl" in body
          ? body.imageUrl
          : undefined;

      if (!isValidImageUrl(requestedUrl)) {
        return NextResponse.json(
          { error: "imageUrl은 올바른 http 또는 https URL이어야 합니다." },
          { status: 400 },
        );
      }

      imageUrl = requestedUrl.trim();
    }

    const imageCount = await prisma.productImage.count({ where: { productId } });
    const image = await prisma.productImage.create({
      data: {
        productId,
        imageUrl,
        sortOrder: imageCount,
        isPrimary: imageCount === 0,
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("상품 이미지 저장에 실패했습니다.", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "상품 이미지를 저장하지 못했습니다." },
      { status: 400 },
    );
  }
}
