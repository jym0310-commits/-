import { Marketplace } from "@/app/generated/prisma/enums";
import { NextResponse } from "next/server";
import {
  getMarketplaceAdapter,
  hasMarketplaceAdapter,
} from "@/lib/marketplaces/registry";
import {
  isMarketplaceProductStatus,
  MARKETPLACE_LABELS,
  MARKETPLACE_PRODUCT_STATUS,
  MARKETPLACE_PRODUCT_STATUS_LABELS,
  type MarketplaceChannelView,
} from "@/lib/marketplaces/types";
import { calculateMarketplaceProfitability } from "@/lib/pricing/calculator";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const protectedStatuses = new Set<
  (typeof MARKETPLACE_PRODUCT_STATUS)[keyof typeof MARKETPLACE_PRODUCT_STATUS]
>([
  MARKETPLACE_PRODUCT_STATUS.REGISTERING,
  MARKETPLACE_PRODUCT_STATUS.REGISTERED,
  MARKETPLACE_PRODUCT_STATUS.REMOTE_CREATED_LOCAL_SAVE_FAILED,
]);

export async function GET(_request: Request, context: RouteContext) {
  const productId = await getProductId(context);
  if (productId === null) {
    return NextResponse.json(
      { error: "상품 ID가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  try {
    const [product, feeSettings] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        include: {
          coupangSetting: true,
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
          },
          marketplaceProducts: true,
        },
      }),
      prisma.marketplaceFeeSetting.findMany(),
    ]);

    if (!product) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const channels: MarketplaceChannelView[] = Object.values(Marketplace).map(
      (marketplace) => {
        const record = product.marketplaceProducts.find(
          (item) => item.marketplace === marketplace,
        );
        const status =
          record && isMarketplaceProductStatus(record.status)
            ? record.status
            : null;
        const adapterAvailable = hasMarketplaceAdapter(marketplace);
        const readiness = adapterAvailable
          ? getMarketplaceAdapter(marketplace).validateProduct(product)
          : null;
        const feeSetting = feeSettings.find(
          (setting) => setting.marketplace === marketplace,
        );

        return {
          marketplace,
          label: MARKETPLACE_LABELS[marketplace],
          adapterAvailable,
          selected:
            Boolean(record) && status !== MARKETPLACE_PRODUCT_STATUS.DISABLED,
          status,
          statusLabel: status
            ? MARKETPLACE_PRODUCT_STATUS_LABELS[status]
            : record
              ? "알 수 없는 상태"
              : "미선택",
          readiness,
          readinessMessage: adapterAvailable
            ? readiness?.ready
              ? "등록 준비가 완료되었습니다."
              : "필수정보가 부족합니다."
            : "아직 연동되지 않은 마켓입니다.",
          finalSalePrice: record?.salePrice ?? null,
          recommendedSalePrice: getRecommendedSalePrice(product, feeSetting),
          lastSentStock: record?.stock ?? null,
          marketplaceProductId: record?.marketplaceProductId ?? null,
          marketplaceItemId: record?.marketplaceItemId ?? null,
          canDisable: Boolean(status && !protectedStatuses.has(status)),
        };
      },
    );

    return NextResponse.json({ channels }, { status: 200 });
  } catch (error) {
    console.error("판매 채널 상태 조회에 실패했습니다.", error);
    return NextResponse.json(
      { error: "판매 채널 상태를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

function getRecommendedSalePrice(
  product: {
    costPrice: number;
    shippingCost: number;
    salePrice: number | null;
    targetMarginRate: { toString(): string } | null;
  },
  feeSetting:
    | {
        feeRate: { toString(): string };
        additionalCost: number;
        enabled: boolean;
      }
    | undefined,
) {
  if (!feeSetting?.enabled) {
    return null;
  }

  const result = calculateMarketplaceProfitability({
    costPrice: product.costPrice,
    shippingCost: product.shippingCost,
    additionalCost: feeSetting.additionalCost,
    feeRate: Number(feeSetting.feeRate),
    targetMarginRate: Number(product.targetMarginRate ?? 0),
    salePrice: product.salePrice,
    autoPricingEnabled: true,
  });

  return result.canCalculate ? result.salePrice : null;
}

async function getProductId(context: RouteContext) {
  const { id } = await context.params;
  const productId = Number(id);
  return Number.isInteger(productId) && productId > 0 ? productId : null;
}
