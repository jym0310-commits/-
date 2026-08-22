import { createHmac } from "node:crypto";

export type CoupangCredentials = {
  accessKey: string;
  secretKey: string;
  vendorId: string;
};

function getSignedDate() {
  const now = new Date();
  const year = now.getUTCFullYear().toString().slice(-2);
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds = String(now.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

export function getCoupangCredentials(): CoupangCredentials {
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;
  const vendorId = process.env.COUPANG_VENDOR_ID;

  if (!accessKey || !secretKey || !vendorId) {
    throw new Error(
      "COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY, COUPANG_VENDOR_ID 환경 변수를 모두 설정해주세요.",
    );
  }

  return { accessKey, secretKey, vendorId };
}

export function createCoupangAuthorization(
  method: string,
  path: string,
  query: string,
  credentials: CoupangCredentials,
) {
  const signedDate = getSignedDate();
  const message = `${signedDate}${method.toUpperCase()}${path}${query}`;
  const signature = createHmac("sha256", credentials.secretKey)
    .update(message)
    .digest("hex");

  return `CEA algorithm=HmacSHA256, access-key=${credentials.accessKey}, signed-date=${signedDate}, signature=${signature}`;
}
