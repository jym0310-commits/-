import {
  createCoupangAuthorization,
  getCoupangCredentials,
} from "@/lib/coupang/auth";

const COUPANG_API_BASE_URL = "https://api-gateway.coupang.com";

type CoupangRequestOptions = {
  method: "GET";
  path: string;
  query?: string;
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

export async function requestCoupang<T>({
  method,
  path,
  query = "",
}: CoupangRequestOptions): Promise<T> {
  const credentials = getCoupangCredentials();
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
