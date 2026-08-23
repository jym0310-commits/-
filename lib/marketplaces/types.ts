import type { Marketplace } from "@/app/generated/prisma/enums";

/**
 * 공통 상품 필드의 의미:
 * - Product.salePrice: 우리 시스템의 기준 판매가
 * - Product.stock: 중앙 가용재고
 * - Product.category: 우리 시스템 내부 카테고리
 * - MarketplaceProduct.salePrice: 마켓에 적용하거나 적용 예정인 최종 판매가
 * - MarketplaceProduct.stock: 해당 마켓에 마지막으로 전송된 재고
 */

export const MARKETPLACE_PRODUCT_STATUS = {
  DRAFT: "DRAFT",
  NOT_READY: "NOT_READY",
  READY: "READY",
  REGISTERING: "REGISTERING",
  REGISTERED: "REGISTERED",
  FAILED: "FAILED",
  REMOTE_CREATED_LOCAL_SAVE_FAILED: "REMOTE_CREATED_LOCAL_SAVE_FAILED",
  DISABLED: "DISABLED",
} as const;

export type MarketplaceProductStatus =
  (typeof MARKETPLACE_PRODUCT_STATUS)[keyof typeof MARKETPLACE_PRODUCT_STATUS];

export const MARKETPLACE_LABELS: Record<Marketplace, string> = {
  COUPANG: "쿠팡",
  NAVER: "네이버 스마트스토어",
  ELEVENST: "11번가",
  GMARKET: "G마켓",
  AUCTION: "옥션",
};

export const MARKETPLACE_PRODUCT_STATUS_LABELS: Record<
  MarketplaceProductStatus,
  string
> = {
  DRAFT: "설정 작성 중",
  NOT_READY: "정보 부족",
  READY: "등록 준비 완료",
  REGISTERING: "등록 중",
  REGISTERED: "등록 완료",
  FAILED: "등록 실패",
  REMOTE_CREATED_LOCAL_SAVE_FAILED:
    "외부 등록 완료 · 로컬 저장 확인 필요",
  DISABLED: "선택 해제",
};

export function isMarketplaceProductStatus(
  value: string,
): value is MarketplaceProductStatus {
  return Object.values(MARKETPLACE_PRODUCT_STATUS).some(
    (status) => status === value,
  );
}

export const MARKETPLACE_CAPABILITY = {
  UPDATE_PRODUCT: "UPDATE_PRODUCT",
  UPDATE_PRICE: "UPDATE_PRICE",
  UPDATE_STOCK: "UPDATE_STOCK",
  STATUS_QUERY: "STATUS_QUERY",
  STOP_PRODUCT: "STOP_PRODUCT",
} as const;

export type MarketplaceCapability =
  (typeof MARKETPLACE_CAPABILITY)[keyof typeof MARKETPLACE_CAPABILITY];

export type MarketplaceReadinessCheck = {
  key: string;
  label: string;
  passed: boolean;
  message?: string;
};

export type MarketplaceReadiness = {
  ready: boolean;
  checks: MarketplaceReadinessCheck[];
  missingFields: string[];
  warnings: string[];
};

export type MarketplaceRegistrationSuccess = {
  success: true;
  marketplace: Marketplace;
  status: typeof MARKETPLACE_PRODUCT_STATUS.REGISTERED;
  marketplaceProductId: string;
  marketplaceItemId?: string;
  message: string;
  warnings: string[];
};

export type MarketplaceRegistrationFailure = {
  success: false;
  marketplace: Marketplace;
  status: typeof MARKETPLACE_PRODUCT_STATUS.FAILED;
  message: string;
  errorCode: string;
  warnings: string[];
};

export type MarketplaceRegistrationResult =
  | MarketplaceRegistrationSuccess
  | MarketplaceRegistrationFailure;

export type MarketplaceChannelView = {
  marketplace: Marketplace;
  label: string;
  adapterAvailable: boolean;
  selected: boolean;
  status: MarketplaceProductStatus | null;
  statusLabel: string;
  readiness: MarketplaceReadiness | null;
  readinessMessage: string;
  finalSalePrice: number | null;
  recommendedSalePrice: number | null;
  lastSentStock: number | null;
  marketplaceProductId: string | null;
  marketplaceItemId: string | null;
  canDisable: boolean;
};
