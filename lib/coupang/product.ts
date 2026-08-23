import { prisma } from "@/lib/prisma";

export async function findProductForCoupang(productId: number) {
  return prisma.product.findUnique({
    where: { id: productId },
    include: {
      coupangSetting: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
      },
      marketplaceProducts: {
        where: { marketplace: "COUPANG" },
      },
    },
  });
}

export async function getProductId(context: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await context.params;
  const productId = Number(id);
  return Number.isInteger(productId) && productId > 0 ? productId : null;
}
