import { NextResponse } from "next/server";
import { CoupangApiError, requestCoupang } from "@/lib/coupang/client";
import { getCoupangCredentials } from "@/lib/coupang/auth";

export async function GET() {
  try {
    const { vendorId } = getCoupangCredentials();

    await requestCoupang({
      method: "GET",
      path: `/v2/providers/openapi/apis/api/v4/vendors/${encodeURIComponent(vendorId)}/products`,
      query: "maxPerPage=1",
    });

    return NextResponse.json({
      connected: true,
      message: "쿠팡 API 연결에 성공했습니다.",
    });
  } catch (error) {
    if (error instanceof CoupangApiError) {
      console.error("쿠팡 API 요청이 거부되었습니다.", {
        status: error.status,
      });

      return NextResponse.json(
        {
          connected: false,
          error: `쿠팡 API 연결에 실패했습니다. (HTTP ${error.status})`,
        },
        { status: 502 },
      );
    }

    if (error instanceof Error) {
      console.error("쿠팡 API 연결에 실패했습니다.", error.message);
    }

    return NextResponse.json(
      {
        connected: false,
        error: "쿠팡 API 환경 변수 또는 네트워크 연결을 확인해주세요.",
      },
      { status: 500 },
    );
  }
}
