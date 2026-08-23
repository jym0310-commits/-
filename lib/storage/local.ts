import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { ImageStorage, SaveProductImageInput } from "@/lib/storage/types";

const maxImageSize = 5 * 1024 * 1024;
const supportedImageTypes = {
  "image/jpeg": { extension: "jpg", signature: [0xff, 0xd8, 0xff] },
  "image/png": {
    extension: "png",
    signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  "image/webp": { extension: "webp", signature: [0x52, 0x49, 0x46, 0x46] },
} as const;

export class LocalStorageAdapter implements ImageStorage {
  async save({ productId, file }: SaveProductImageInput) {
    const imageType = supportedImageTypes[file.type as keyof typeof supportedImageTypes];

    if (!imageType) {
      throw new Error("JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.");
    }

    if (file.size === 0 || file.size > maxImageSize) {
      throw new Error("이미지 파일은 5MB 이하이어야 합니다.");
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    if (!hasSignature(fileBuffer, imageType.signature)) {
      throw new Error("실제 이미지 파일만 업로드할 수 있습니다.");
    }

    const relativeDirectory = path.join("uploads", "products", String(productId));
    const absoluteDirectory = path.join(process.cwd(), "public", relativeDirectory);
    await mkdir(absoluteDirectory, { recursive: true });

    const fileName = `${randomUUID()}.${imageType.extension}`;
    const absolutePath = path.join(absoluteDirectory, fileName);
    await writeFile(absolutePath, fileBuffer, { flag: "wx" });

    return `/${relativeDirectory}/${fileName}`.replaceAll(path.sep, "/");
  }

  async delete(imageUrl: string) {
    if (!imageUrl.startsWith("/uploads/products/")) {
      return;
    }

    const uploadsRoot = path.resolve(process.cwd(), "public", "uploads", "products");
    const absolutePath = path.resolve(process.cwd(), "public", imageUrl.slice(1));

    if (!absolutePath.startsWith(`${uploadsRoot}${path.sep}`)) {
      return;
    }

    await unlink(absolutePath).catch(() => undefined);
  }

  isPubliclyAccessible(imageUrl: string) {
    try {
      const url = new URL(imageUrl);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }
}

function hasSignature(buffer: Buffer, signature: readonly number[]) {
  return signature.every((byte, index) => buffer[index] === byte);
}
