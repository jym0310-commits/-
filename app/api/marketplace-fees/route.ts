import { NextResponse } from "next/server";
import { Marketplace } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const supportedMarketplaces = Object.values(Marketplace);

type FeeSettingInput = {
  marketplace: Marketplace;
  feeRate: number;
  additionalCost: number;
  enabled: boolean;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMarketplace(value: unknown): value is Marketplace {
  return (
    typeof value === "string" &&
    supportedMarketplaces.includes(value as Marketplace)
  );
}

function isValidPercentage(value: unknown): value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return false;
  }

  return (
    value >= 0 &&
    value < 100 &&
    Math.abs(value * 100 - Math.round(value * 100)) < 1e-9
  );
}

function isNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
  );
}

function parseFeeSetting(body: unknown):
  | { value: FeeSettingInput }
  | { error: string } {
  if (!isObject(body)) {
    return { error: "요청 본문은 마켓 수수료 설정 객체여야 합니다." };
  }

  if (!isMarketplace(body.marketplace)) {
    return { error: "지원하지 않는 마켓입니다." };
  }

  if (!isValidPercentage(body.feeRate)) {
    return { error: "수수료율은 0 이상 100 미만의 숫자여야 합니다." };
  }

  if (!isNonNegativeInteger(body.additionalCost)) {
    return { error: "추가비용은 0 이상의 정수여야 합니다." };
  }

  if (typeof body.enabled !== "boolean") {
    return { error: "enabled는 true 또는 false여야 합니다." };
  }

  return {
    value: {
      marketplace: body.marketplace,
      feeRate: body.feeRate,
      additionalCost: body.additionalCost,
      enabled: body.enabled,
    },
  };
}

export async function GET() {
  try {
    const settings = await prisma.marketplaceFeeSetting.findMany({
      orderBy: { marketplace: "asc" },
    });

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error("마켓 수수료 설정 조회에 실패했습니다.", error);

    return NextResponse.json(
      { error: "마켓 수수료 설정을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 본문은 올바른 JSON 형식이어야 합니다." },
      { status: 400 },
    );
  }

  const parsed = parseFeeSetting(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { marketplace, feeRate, additionalCost, enabled } = parsed.value;

  try {
    const setting = await prisma.marketplaceFeeSetting.upsert({
      where: { marketplace },
      update: { feeRate, additionalCost, enabled },
      create: { marketplace, feeRate, additionalCost, enabled },
    });

    return NextResponse.json(setting, { status: 200 });
  } catch (error) {
    console.error("마켓 수수료 설정 저장에 실패했습니다.", error);

    return NextResponse.json(
      { error: "마켓 수수료 설정을 저장하지 못했습니다." },
      { status: 500 },
    );
  }
}
