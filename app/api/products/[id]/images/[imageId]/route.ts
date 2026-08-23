import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { imageStorage } from "@/lib/storage";

type RouteContext = {
  params: Promise<{ id: string; imageId: string }>;
};

function parsePositiveInteger(value: string) {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

async function getIds(context: RouteContext) {
  const { id, imageId } = await context.params;
  return {
    productId: parsePositiveInteger(id),
    imageId: parsePositiveInteger(imageId),
  };
}

async function findImage(productId: number, imageId: number) {
  return prisma.productImage.findFirst({ where: { id: imageId, productId } });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { productId, imageId } = await getIds(context);

  if (productId === null || imageId === null) {
    return NextResponse.json({ error: "상품 ID 또는 이미지 ID가 올바르지 않습니다." }, { status: 400 });
  }

  const image = await findImage(productId, imageId);
  if (!image) {
    return NextResponse.json({ error: "상품 이미지를 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.productImage.delete({ where: { id: imageId } });

      if (image.isPrimary) {
        const nextImage = await transaction.productImage.findFirst({
          where: { productId },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        });

        if (nextImage) {
          await transaction.productImage.update({
            where: { id: nextImage.id },
            data: { isPrimary: true },
          });
        }
      }
    });

    await imageStorage.delete(image.imageUrl);
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    console.error("상품 이미지 삭제에 실패했습니다.", error);
    return NextResponse.json({ error: "상품 이미지를 삭제하지 못했습니다." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { productId, imageId } = await getIds(context);

  if (productId === null || imageId === null) {
    return NextResponse.json({ error: "상품 ID 또는 이미지 ID가 올바르지 않습니다." }, { status: 400 });
  }

  const image = await findImage(productId, imageId);
  if (!image) {
    return NextResponse.json({ error: "상품 이미지를 찾을 수 없습니다." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문은 올바른 JSON 형식이어야 합니다." }, { status: 400 });
  }

  if (isObject(body) && body.isPrimary === true) {
    await prisma.$transaction([
      prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } }),
      prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
    ]);

    return NextResponse.json({ ...image, isPrimary: true }, { status: 200 });
  }

  if (!isObject(body) || (body.direction !== "up" && body.direction !== "down")) {
    return NextResponse.json(
      { error: "대표 이미지 지정 또는 direction(up/down)이 필요합니다." },
      { status: 400 },
    );
  }

  const neighboringImage = await prisma.productImage.findFirst({
    where: {
      productId,
      sortOrder: body.direction === "up" ? { lt: image.sortOrder } : { gt: image.sortOrder },
    },
    orderBy: {
      sortOrder: body.direction === "up" ? "desc" : "asc",
    },
  });

  if (!neighboringImage) {
    return NextResponse.json(image, { status: 200 });
  }

  await prisma.$transaction([
    prisma.productImage.update({ where: { id: image.id }, data: { sortOrder: neighboringImage.sortOrder } }),
    prisma.productImage.update({ where: { id: neighboringImage.id }, data: { sortOrder: image.sortOrder } }),
  ]);

  return NextResponse.json(
    { ...image, sortOrder: neighboringImage.sortOrder },
    { status: 200 },
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
