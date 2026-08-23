import type { Marketplace } from "@/app/generated/prisma/enums";
import { coupangMarketplaceAdapter } from "@/lib/coupang/marketplace-adapter";

const marketplaceAdapters = {
  COUPANG: coupangMarketplaceAdapter,
} as const;

export type RegisteredMarketplace = keyof typeof marketplaceAdapters;

export class MarketplaceAdapterNotFoundError extends Error {
  constructor(public readonly marketplace: Marketplace) {
    super(`${marketplace} 마켓 Adapter가 등록되지 않았습니다.`);
    this.name = "MarketplaceAdapterNotFoundError";
  }
}

export function hasMarketplaceAdapter(
  marketplace: Marketplace,
): marketplace is RegisteredMarketplace {
  return marketplace in marketplaceAdapters;
}

export function getMarketplaceAdapter(marketplace: Marketplace) {
  if (!hasMarketplaceAdapter(marketplace)) {
    throw new MarketplaceAdapterNotFoundError(marketplace);
  }

  return marketplaceAdapters[marketplace];
}
