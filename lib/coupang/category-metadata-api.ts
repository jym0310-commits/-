import "server-only";

import { requestCoupang } from "@/lib/coupang/client";
import { isValidDisplayCategoryCode } from "@/lib/coupang/category-metadata";
import type {
  CoupangCategoryMetadataData,
  CoupangCategoryMetadataResponse,
} from "@/lib/coupang/category-metadata-types";

const categoryMetadataPath =
  "/v2/providers/seller_api/apis/api/v1/marketplace/meta/category-related-metas/display-category-codes";

export async function getCoupangCategoryMetadata(
  displayCategoryCode: string,
): Promise<CoupangCategoryMetadataData> {
  const normalizedCode = displayCategoryCode.trim();
  if (!isValidDisplayCategoryCode(normalizedCode)) {
    throw new Error("쿠팡 카테고리 코드는 0으로 시작하지 않는 숫자여야 합니다.");
  }

  const response = await requestCoupang<CoupangCategoryMetadataResponse>({
    method: "GET",
    path: `${categoryMetadataPath}/${encodeURIComponent(normalizedCode)}`,
  });

  if (String(response.code).toUpperCase() !== "SUCCESS" || !response.data) {
    throw new Error(response.message || "쿠팡 카테고리 메타정보를 조회하지 못했습니다.");
  }

  return response.data;
}
