import { Marketplace } from "@/app/generated/prisma/enums";
import { NextResponse } from "next/server";
import {
  MARKETPLACE_PRODUCT_STATUS,
  type MarketplaceProductStatus,
} from "@/lib/marketplaces/types";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string; marketplace: string }>;
};

const protectedStatuses = new Set<MarketplaceProductStatus>([
  MARKETPLACE_PRODUCT_STATUS.REGISTERING,
  MARKETPLACE_PRODUCT_STATUS.REGISTERED,
  MARKETPLACE_PRODUCT_STATUS.REMOTE_CREATED_LOCAL_SAVE_FAILED,
]);

const disableAllowedStatuses: MarketplaceProductStatus[] = [
  MARKETPLACE_PRODUCT_STATUS.DRAFT,
  MARKETPLACE_PRODUCT_STATUS.NOT_READY,
  MARKETPLACE_PRODUCT_STATUS.READY,
  MARKETPLACE_PRODUCT_STATUS.FAILED,
];

export async function PUT(request: Request, context: RouteContext) {
  const params = await getParams(context);
  if (!params) {
    return NextResponse.json(
      { error: "상품 ID 또는 마켓이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 본문은 올바른 JSON이어야 합니다." },
      { status: 400 },
    );
  }

  if (!isSelectionInput(body)) {
    return NextResponse.json(
      { error: "selected는 true 또는 false여야 합니다." },
      { status: 400 },
    );
  }

  const { productId, marketplace } = params;

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const existing = await prisma.marketplaceProduct.findUnique({
      where: { productId_marketplace: { productId, marketplace } },
    });

    if (body.selected) {
      const channel = existing
        ? await enableExistingChannel(existing.id, existing.status)
        : await prisma.marketplaceProduct.upsert({
            where: { productId_marketplace: { productId, marketplace } },
            update: {},
            create: {
              productId,
              marketplace,
              status: MARKETPLACE_PRODUCT_STATUS.DRAFT,
            },
          });

      return NextResponse.json({ selected: true, channel }, { status: 200 });
    }

    if (!existing) {
      return NextResponse.json(
        { selected: false, channel: null },
        { status: 200 },
      );
    }

    if (protectedStatuses.has(existing.status as MarketplaceProductStatus)) {
      return NextResponse.json(
        {
          error:
            "등록 중이거나 등록된 상품은 단순 선택 해제할 수 없습니다.",
        },
        { status: 409 },
      );
    }

    if (existing.status === MARKETPLACE_PRODUCT_STATUS.DISABLED) {
      return NextResponse.json(
        { selected: false, channel: existing },
        { status: 200 },
      );
    }

    const updated = await prisma.marketplaceProduct.updateMany({
      where: {
        id: existing.id,
        status: { in: disableAllowedStatuses },
      },
      data: { status: MARKETPLACE_PRODUCT_STATUS.DISABLED },
    });

    if (updated.count !== 1) {
      return NextResponse.json(
        { error: "현재 채널 상태에서는 선택 해제할 수 없습니다." },
        { status: 409 },
      );
    }

    const channel = await prisma.marketplaceProduct.findUnique({
      where: { id: existing.id },
    });
    return NextResponse.json({ selected: false, channel }, { status: 200 });
  } catch (error) {
    console.error("판매 채널 선택 상태 저장에 실패했습니다.", error);
    return NextResponse.json(
      { error: "판매 채널 선택 상태를 저장하지 못했습니다." },
      { status: 500 },
    );
  }
}

async function enableExistingChannel(id: number, status: string) {
  if (status !== MARKETPLACE_PRODUCT_STATUS.DISABLED) {
    return prisma.marketplaceProduct.findUniqueOrThrow({ where: { id } });
  }

  return prisma.marketplaceProduct.update({
    where: { id },
    data: {
      status: MARKETPLACE_PRODUCT_STATUS.DRAFT,
      lastErrorCode: null,
      lastErrorMessage: null,
    },
  });
}

async function getParams(context: RouteContext) {
  const { id, marketplace: marketplaceParam } = await context.params;
  const productId = Number(id);
  const marketplace = marketplaceParam.toUpperCase();

  if (
    !Number.isInteger(productId) ||
    productId <= 0 ||
    !Object.values(Marketplace).includes(marketplace as Marketplace)
  ) {
    return null;
  }

  return { productId, marketplace: marketplace as Marketplace };
}

function isSelectionInput(
  body: unknown,
): body is { selected: boolean } {
  return (
    typeof body === "object" &&
    body !== null &&
    !Array.isArray(body) &&
    "selected" in body &&
    typeof body.selected === "boolean"
  );
}
