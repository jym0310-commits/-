import { NextResponse } from "next/server";
import { createCoupangProduct } from "@/lib/coupang/adapter";
import {
  CoupangApiError,
  CoupangLiveDisabledError,
} from "@/lib/coupang/client";
import { getCoupangCredentials } from "@/lib/coupang/auth";
import { buildCoupangPayload } from "@/lib/coupang/payload";
import { findProductForCoupang, getProductId } from "@/lib/coupang/product";
import { isCoupangLiveEnabled, validateProductForCoupang } from "@/lib/coupang/validation";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const productId = await getProductId(context);
  if (productId === null) {
    return NextResponse.json({ error: "상품 ID가 올바르지 않습니다." }, { status: 400 });
  }

  const product = await findProductForCoupang(productId);
  if (!product) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }

  const readiness = validateProductForCoupang(product);
  if (!readiness.ready) {
    return NextResponse.json(
      {
        success: false,
        code: "COUPANG_NOT_READY",
        message: "쿠팡 등록 준비가 완료되지 않았습니다.",
        missingFields: readiness.missingFields,
      },
      { status: 400 },
    );
  }

  if (!isCoupangLiveEnabled()) {
    return NextResponse.json(
      {
        success: false,
        code: "COUPANG_LIVE_DISABLED",
        message: "실제 쿠팡 상품등록이 비활성화되어 있습니다.",
      },
      { status: 503 },
    );
  }

  const claimed = await claimRegistration(productId);
  if (!claimed) {
    return NextResponse.json(
      {
        success: false,
        code: "COUPANG_DUPLICATE_REGISTRATION",
        message: "이미 쿠팡에 등록 중이거나 등록된 상품입니다.",
      },
      { status: 409 },
    );
  }

  let result: Awaited<ReturnType<typeof createCoupangProduct>>;

  try {
    const { vendorId } = getCoupangCredentials();
    const payload = buildCoupangPayload(product, vendorId);
    result = await createCoupangProduct(payload);
  } catch (error) {
    const failure = getCreateFailure(error);
    await trySaveFailure(productId, failure.code, failure.message);
    console.error("쿠팡 상품등록 요청에 실패했습니다.", {
      productId,
      code: failure.code,
      error: getSafeErrorMessage(error),
    });
    return NextResponse.json(
      { success: false, code: failure.code, message: failure.message },
      { status: failure.status },
    );
  }

  if (!result.success) {
    await trySaveFailure(productId, result.code, result.message);
    return NextResponse.json(result, { status: 502 });
  }

  try {
    await prisma.marketplaceProduct.update({
      where: { productId_marketplace: { productId, marketplace: "COUPANG" } },
      data: {
        marketplaceProductId: result.marketplaceProductId,
        salePrice: product.salePrice,
        stock: product.stock,
        status: "REGISTERED",
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (localSaveError) {
    const recoveryStateSaved = await trySaveRemoteCreatedLocalSaveFailure({
      productId,
      marketplaceProductId: result.marketplaceProductId,
      salePrice: product.salePrice,
      stock: product.stock,
    });

    console.error("쿠팡 상품 생성 후 로컬 저장에 실패했습니다.", {
      productId,
      marketplaceProductId: result.marketplaceProductId,
      recoveryStateSaved,
      error: getSafeErrorMessage(localSaveError),
    });

    return NextResponse.json(
      {
        success: true,
        localSaved: false,
        code: "COUPANG_CREATED_LOCAL_SAVE_FAILED",
        message:
          "쿠팡 상품은 생성되었지만 로컬 저장에 실패했습니다. 재등록하지 말고 관리자 확인이 필요합니다.",
        marketplaceProductId: result.marketplaceProductId,
        recoveryStateSaved,
      },
      { status: 202 },
    );
  }
}

async function claimRegistration(productId: number) {
  const existing = await prisma.marketplaceProduct.findUnique({
    where: { productId_marketplace: { productId, marketplace: "COUPANG" } },
  });

  if (!existing) {
    try {
      await prisma.marketplaceProduct.create({
        data: { productId, marketplace: "COUPANG", status: "REGISTERING" },
      });
      return true;
    } catch {
      return false;
    }
  }

  if (!["DRAFT", "READY", "FAILED"].includes(existing.status)) {
    return false;
  }

  const updated = await prisma.marketplaceProduct.updateMany({
    where: { id: existing.id, status: existing.status },
    data: { status: "REGISTERING", lastErrorCode: null, lastErrorMessage: null },
  });
  return updated.count === 1;
}

async function trySaveFailure(productId: number, code: string, message: string) {
  try {
    await prisma.marketplaceProduct.update({
      where: { productId_marketplace: { productId, marketplace: "COUPANG" } },
      data: { status: "FAILED", lastErrorCode: code, lastErrorMessage: message },
    });
    return true;
  } catch (persistenceError) {
    console.error("쿠팡 실패 상태를 로컬 DB에 저장하지 못했습니다.", {
      productId,
      originalErrorCode: code,
      error: getSafeErrorMessage(persistenceError),
    });
    return false;
  }
}

async function trySaveRemoteCreatedLocalSaveFailure({
  productId,
  marketplaceProductId,
  salePrice,
  stock,
}: {
  productId: number;
  marketplaceProductId: string;
  salePrice: number | null;
  stock: number;
}) {
  try {
    await prisma.marketplaceProduct.update({
      where: { productId_marketplace: { productId, marketplace: "COUPANG" } },
      data: {
        marketplaceProductId,
        salePrice,
        stock,
        status: "REMOTE_CREATED_LOCAL_SAVE_FAILED",
        lastErrorCode: "LOCAL_SAVE_FAILED_AFTER_REMOTE_SUCCESS",
        lastErrorMessage:
          "쿠팡 상품은 생성되었지만 로컬 등록 완료 상태 저장에 실패했습니다.",
      },
    });
    return true;
  } catch (persistenceError) {
    console.error("쿠팡 원격 생성 성공 상태를 로컬 DB에 저장하지 못했습니다.", {
      productId,
      marketplaceProductId,
      error: getSafeErrorMessage(persistenceError),
    });
    return false;
  }
}

function getCreateFailure(error: unknown) {
  if (error instanceof CoupangLiveDisabledError) {
    return {
      code: error.code,
      message: "실제 쿠팡 상품등록이 비활성화되어 있습니다.",
      status: 503,
    };
  }

  if (error instanceof CoupangApiError) {
    return {
      code: "COUPANG_CREATE_ERROR",
      message: `쿠팡 API 요청이 거부되었습니다. (HTTP ${error.status})`,
      status: 502,
    };
  }

  return {
    code: "COUPANG_CREATE_ERROR",
    message: "쿠팡 상품등록 중 오류가 발생했습니다.",
    status: 502,
  };
}

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류";
}
