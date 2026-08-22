export type PricingInput = {
  costPrice: number;
  shippingCost: number;
  additionalCost: number;
  feeRate: number;
  targetMarginRate: number;
  salePrice: number | null;
  autoPricingEnabled: boolean;
};

export type PricingResult = {
  canCalculate: boolean;
  salePrice: number | null;
  minimumSalePrice: number | null;
  netProfit: number | null;
  marginRate: number | null;
  error?: string;
};

export function roundPriceUp(price: number) {
  if (!Number.isFinite(price) || price < 0) {
    return null;
  }

  return Math.ceil(price / 100) * 100;
}

export function calculateMarketplaceProfitability(
  input: PricingInput,
): PricingResult {
  if (!isValidNonNegativeInteger(input.costPrice)) {
    return calculationError("매입가는 0 이상의 정수여야 합니다.");
  }

  if (!isValidNonNegativeInteger(input.shippingCost)) {
    return calculationError("배송비는 0 이상의 정수여야 합니다.");
  }

  if (!isValidNonNegativeInteger(input.additionalCost)) {
    return calculationError("추가비용은 0 이상의 정수여야 합니다.");
  }

  if (!isValidPercentage(input.feeRate)) {
    return calculationError("수수료율은 0 이상 100 미만이어야 합니다.");
  }

  if (!isValidPercentage(input.targetMarginRate)) {
    return calculationError("목표 마진율은 0 이상 100 미만이어야 합니다.");
  }

  if (input.autoPricingEnabled) {
    const denominator =
      1 - input.feeRate / 100 - input.targetMarginRate / 100;

    if (denominator <= 0) {
      return calculationError(
        "현재 수수료율과 목표 마진율 조합으로는 최저 판매가를 계산할 수 없습니다.",
      );
    }

    const calculatedMinimumPrice = roundPriceUp(
      (input.costPrice + input.shippingCost + input.additionalCost) /
        denominator,
    );

    if (calculatedMinimumPrice === null) {
      return calculationError("판매가 계산 결과가 올바르지 않습니다.");
    }

    return createProfitabilityResult(calculatedMinimumPrice, calculatedMinimumPrice, input);
  }

  if (
    input.salePrice === null ||
    !isValidNonNegativeInteger(input.salePrice) ||
    input.salePrice === 0
  ) {
    return calculationError(
      "자동계산을 사용하지 않을 때는 0보다 큰 판매가가 필요합니다.",
    );
  }

  return createProfitabilityResult(input.salePrice, null, input);
}

function createProfitabilityResult(
  salePrice: number,
  minimumSalePrice: number | null,
  input: PricingInput,
): PricingResult {
  const netProfit =
    salePrice -
    input.costPrice -
    input.shippingCost -
    input.additionalCost -
    salePrice * (input.feeRate / 100);
  const marginRate = (netProfit / salePrice) * 100;

  if (!Number.isFinite(netProfit) || !Number.isFinite(marginRate)) {
    return calculationError("수익성 계산 결과가 올바르지 않습니다.");
  }

  return {
    canCalculate: true,
    salePrice,
    minimumSalePrice,
    netProfit: Math.round(netProfit),
    marginRate,
  };
}

function isValidNonNegativeInteger(value: number | null) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
  );
}

function isValidPercentage(value: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value < 100;
}

function calculationError(error: string): PricingResult {
  return {
    canCalculate: false,
    salePrice: null,
    minimumSalePrice: null,
    netProfit: null,
    marginRate: null,
    error,
  };
}
