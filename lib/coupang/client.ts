import {
  createCoupangAuthorization,
  getCoupangApiCredentials,
} from "@/lib/coupang/auth";
import { isCoupangRequestAllowed } from "@/lib/coupang/validation";

const COUPANG_API_BASE_URL = "https://api-gateway.coupang.com";

type CoupangRequestOptions = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: string;
  body?: unknown;
};

export class CoupangApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "CoupangApiError";
  }
}

export class CoupangLiveDisabledError extends Error {
  readonly code = "COUPANG_LIVE_DISABLED";

  constructor() {
    super("실제 쿠팡 쓰기 요청이 비활성화되어 있습니다.");
    this.name = "CoupangLiveDisabledError";
  }
}

export async function requestCoupang<T>({
  method,
  path,
  query = "",
  body,
}: CoupangRequestOptions): Promise<T> {
  if (!isCoupangRequestAllowed(method)) {
    throw new CoupangLiveDisabledError();
  }

  const credentials = getCoupangApiCredentials();
  const authorization = createCoupangAuthorization(
    method,
    path,
    query,
    credentials,
  );
  const queryString = query ? `?${query}` : "";

  const response = await fetch(`${COUPANG_API_BASE_URL}${path}${queryString}`, {
    method,
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json;charset=UTF-8",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const responseText = await response.text();
  let responseBody: unknown;

  try {
    responseBody = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    throw new CoupangApiError(
      getCoupangErrorMessage(responseBody, response.status),
      response.status,
    );
  }

  return responseBody as T;
}

function getCoupangErrorMessage(body: unknown, status: number) {
  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }

  return `쿠팡 API 요청에 실패했습니다. (HTTP ${status})`;
}
