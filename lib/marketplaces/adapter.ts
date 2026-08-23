import type { Marketplace } from "@/app/generated/prisma/enums";
import type {
  MarketplaceCapability,
  MarketplaceReadiness,
  MarketplaceRegistrationResult,
} from "@/lib/marketplaces/types";

export interface MarketplaceAdapter<
  TProduct,
  TPayload,
  TBuildContext = undefined,
> {
  readonly marketplace: Marketplace;
  readonly capabilities: readonly MarketplaceCapability[];
  validateProduct(product: TProduct): MarketplaceReadiness;
  buildPayload(product: TProduct, context: TBuildContext): TPayload;
  createProduct(payload: TPayload): Promise<MarketplaceRegistrationResult>;
}

export function hasMarketplaceCapability(
  adapter: Pick<MarketplaceAdapter<unknown, unknown>, "capabilities">,
  capability: MarketplaceCapability,
) {
  return adapter.capabilities.includes(capability);
}
