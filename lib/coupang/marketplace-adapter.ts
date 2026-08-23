import { createCoupangProduct } from "@/lib/coupang/adapter";
import { buildCoupangPayload } from "@/lib/coupang/payload";
import type {
  CoupangProductPayload,
  CoupangProductSource,
} from "@/lib/coupang/types";
import { validateProductForCoupang } from "@/lib/coupang/validation";
import type { MarketplaceAdapter } from "@/lib/marketplaces/adapter";
import { MARKETPLACE_PRODUCT_STATUS } from "@/lib/marketplaces/types";

type CoupangBuildContext = {
  vendorId: string;
};

export const coupangMarketplaceAdapter = {
  marketplace: "COUPANG",
  capabilities: [],
  validateProduct: validateProductForCoupang,
  buildPayload(product, context) {
    return buildCoupangPayload(product, context.vendorId);
  },
  async createProduct(payload) {
    const result = await createCoupangProduct(payload);

    if (!result.success) {
      return {
        success: false,
        marketplace: "COUPANG",
        status: MARKETPLACE_PRODUCT_STATUS.FAILED,
        message: result.message,
        errorCode: result.code,
        warnings: [],
      };
    }

    return {
      success: true,
      marketplace: "COUPANG",
      status: MARKETPLACE_PRODUCT_STATUS.REGISTERED,
      marketplaceProductId: result.marketplaceProductId,
      message: result.message,
      warnings: [],
    };
  },
} satisfies MarketplaceAdapter<
  CoupangProductSource,
  CoupangProductPayload,
  CoupangBuildContext
>;
