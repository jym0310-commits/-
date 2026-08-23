import { requestCoupang } from "@/lib/coupang/client";
import type { CoupangProductPayload } from "@/lib/coupang/types";
import { isCoupangLiveEnabled } from "@/lib/coupang/validation";

const createProductPath =
  "/v2/providers/seller_api/apis/api/v1/marketplace/seller-products";

type CreateProductResponse = {
  code: string;
  message?: string;
  data?: number | string;
};

export async function createCoupangProduct(payload: CoupangProductPayload) {
  if (!isCoupangLiveEnabled()) {
    return {
      success: false as const,
      code: "COUPANG_LIVE_DISABLED",
      message: "실제 쿠팡 상품등록이 비활성화되어 있습니다.",
    };
  }

  const response = await requestCoupang<CreateProductResponse>({
    method: "POST",
    path: createProductPath,
    body: payload,
  });

  if (response.code !== "SUCCESS" || response.data === undefined) {
    return {
      success: false as const,
      code: response.code || "COUPANG_CREATE_FAILED",
      message: response.message || "쿠팡 상품등록에 실패했습니다.",
    };
  }

  return {
    success: true as const,
    code: response.code,
    message: response.message || "쿠팡 상품이 생성되었습니다.",
    marketplaceProductId: String(response.data),
  };
}
