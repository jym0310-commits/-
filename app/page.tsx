"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  calculateMarketplaceProfitability,
  PricingResult,
} from "@/lib/pricing/calculator";
import { CoupangRegistrationPanel } from "@/components/coupang/CoupangRegistrationPanel";
import { MarketplaceChannelPanel } from "@/components/marketplaces/MarketplaceChannelPanel";

const marketplaces = [
  { code: "COUPANG", label: "쿠팡" },
  { code: "NAVER", label: "네이버" },
  { code: "ELEVENST", label: "11번가" },
  { code: "GMARKET", label: "G마켓" },
  { code: "AUCTION", label: "옥션" },
] as const;

type MarketplaceCode = (typeof marketplaces)[number]["code"];

type FeeSetting = {
  id: number;
  marketplace: MarketplaceCode;
  feeRate: string | number;
  additionalCost: number;
  enabled: boolean;
};

type Product = {
  id: number;
  name: string;
  costPrice: number;
  shippingCost: number;
  stock: number;
  sku: string | null;
  brand: string | null;
  barcode: string | null;
  modelNo: string | null;
  description: string | null;
  salePrice: number | null;
  manufacturer: string | null;
  origin: string | null;
  category: string | null;
  supplierName: string | null;
  supplierUrl: string | null;
  supplierProductCode: string | null;
  weight: number | null;
  width: number | null;
  height: number | null;
  depth: number | null;
  createdAt: string;
  updatedAt: string;
  autoPricingEnabled: boolean;
  targetMarginRate: string | number | null;
  images: ProductImage[];
};

type ProductImage = {
  id: number;
  productId: number;
  imageUrl: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
};

type ProductForm = {
  name: string;
  costPrice: string;
  shippingCost: string;
  stock: string;
  sku: string;
  salePrice: string;
  brand: string;
  barcode: string;
  modelNo: string;
  description: string;
  manufacturer: string;
  origin: string;
  category: string;
  supplierName: string;
  supplierUrl: string;
  supplierProductCode: string;
  weight: string;
  width: string;
  height: string;
  depth: string;
  autoPricingEnabled: boolean;
  targetMarginRate: string;
};

const emptyForm: ProductForm = {
  name: "",
  costPrice: "",
  shippingCost: "",
  stock: "",
  sku: "",
  salePrice: "",
  brand: "",
  barcode: "",
  modelNo: "",
  description: "",
  manufacturer: "",
  origin: "",
  category: "",
  supplierName: "",
  supplierUrl: "",
  supplierProductCode: "",
  weight: "",
  width: "",
  height: "",
  depth: "",
  autoPricingEnabled: false,
  targetMarginRate: "",
};

function productToForm(product: Product): ProductForm {
  return {
    name: product.name,
    costPrice: String(product.costPrice),
    shippingCost: String(product.shippingCost),
    stock: String(product.stock),
    sku: product.sku ?? "",
    salePrice: product.salePrice === null ? "" : String(product.salePrice),
    brand: product.brand ?? "",
    barcode: product.barcode ?? "",
    modelNo: product.modelNo ?? "",
    description: product.description ?? "",
    manufacturer: product.manufacturer ?? "",
    origin: product.origin ?? "",
    category: product.category ?? "",
    supplierName: product.supplierName ?? "",
    supplierUrl: product.supplierUrl ?? "",
    supplierProductCode: product.supplierProductCode ?? "",
    weight: product.weight === null ? "" : String(product.weight),
    width: product.width === null ? "" : String(product.width),
    height: product.height === null ? "" : String(product.height),
    depth: product.depth === null ? "" : String(product.depth),
    autoPricingEnabled: product.autoPricingEnabled,
    targetMarginRate:
      product.targetMarginRate === null
        ? ""
        : String(product.targetMarginRate),
  };
}

function isNonNegativeInteger(value: string) {
  return /^\d+$/.test(value);
}

function formatNumber(value: number | null) {
  if (value === null) {
    return "-";
  }

  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [feeSettings, setFeeSettings] = useState<FeeSetting[]>([]);
  const [isFeeLoading, setIsFeeLoading] = useState(true);
  const [isFeeSaving, setIsFeeSaving] = useState(false);
  const [feeErrorMessage, setFeeErrorMessage] = useState("");
  const [images, setImages] = useState<ProductImage[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [imageErrorMessage, setImageErrorMessage] = useState("");
  const [isImageSaving, setIsImageSaving] = useState(false);

  async function loadProducts() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/products");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "상품 목록을 불러오지 못했습니다.");
      }

      setProducts(data);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "상품 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFeeSettings() {
    setIsFeeLoading(true);

    try {
      const response = await fetch("/api/marketplace-fees");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "마켓 수수료 설정을 불러오지 못했습니다.");
      }

      setFeeSettings(data);
      setFeeErrorMessage("");
    } catch (error) {
      setFeeErrorMessage(
        error instanceof Error
          ? error.message
          : "마켓 수수료 설정을 불러오지 못했습니다.",
      );
    } finally {
      setIsFeeLoading(false);
    }
  }

  useEffect(() => {
    let isCancelled = false;

    async function fetchInitialProducts() {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "상품 목록을 불러오지 못했습니다.");
        }

        if (!isCancelled) {
          setProducts(data);
          setErrorMessage("");
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "상품 목록을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchInitialProducts();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function fetchInitialFeeSettings() {
      try {
        const response = await fetch("/api/marketplace-fees");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "마켓 수수료 설정을 불러오지 못했습니다.");
        }

        if (!isCancelled) {
          setFeeSettings(data);
          setFeeErrorMessage("");
        }
      } catch (error) {
        if (!isCancelled) {
          setFeeErrorMessage(
            error instanceof Error
              ? error.message
              : "마켓 수수료 설정을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsFeeLoading(false);
        }
      }
    }

    void fetchInitialFeeSettings();

    return () => {
      isCancelled = true;
    };
  }, []);

  function updateForm(field: keyof ProductForm, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  async function handleEdit(productId: number) {
    setIsLoadingProduct(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "상품을 불러오지 못했습니다.");
      }

      setForm(productToForm(data));
      setImages(data.images ?? []);
      setEditingProductId(productId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "상품을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoadingProduct(false);
    }
  }

  function handleCancelEdit() {
    setEditingProductId(null);
    setForm(emptyForm);
    setImages([]);
    setImageUrl("");
    setImageErrorMessage("");
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function addImageUrl() {
    if (editingProductId === null) {
      setImageErrorMessage("상품을 먼저 저장한 후 이미지를 추가해주세요.");
      return;
    }

    if (!imageUrl.trim()) {
      setImageErrorMessage("이미지 URL을 입력해주세요.");
      return;
    }

    await addImage({ imageUrl: imageUrl.trim() });
    setImageUrl("");
  }

  async function uploadImage(file: File) {
    if (editingProductId === null) {
      setImageErrorMessage("상품을 먼저 저장한 후 이미지를 추가해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    await addImage(formData);
  }

  async function addImage(body: FormData | { imageUrl: string }) {
    if (editingProductId === null) {
      return;
    }

    setIsImageSaving(true);
    setImageErrorMessage("");

    try {
      const response = await fetch(`/api/products/${editingProductId}/images`, {
        method: "POST",
        headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
        body: body instanceof FormData ? body : JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "이미지를 추가하지 못했습니다.");
      }

      setImages((currentImages) => [...currentImages, data]);
    } catch (error) {
      setImageErrorMessage(
        error instanceof Error ? error.message : "이미지를 추가하지 못했습니다.",
      );
    } finally {
      setIsImageSaving(false);
    }
  }

  async function updateImage(imageId: number, body: { isPrimary: true } | { direction: "up" | "down" }) {
    if (editingProductId === null) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${editingProductId}/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "이미지를 변경하지 못했습니다.");
      }

      const refreshedResponse = await fetch(`/api/products/${editingProductId}/images`);
      setImages(await refreshedResponse.json());
    } catch (error) {
      setImageErrorMessage(
        error instanceof Error ? error.message : "이미지를 변경하지 못했습니다.",
      );
    }
  }

  async function deleteImage(imageId: number) {
    if (editingProductId === null) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${editingProductId}/images/${imageId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "이미지를 삭제하지 못했습니다.");
      }

      setImages((currentImages) => currentImages.filter((image) => image.id !== imageId));
      if (data.deleted) {
        const refreshedResponse = await fetch(`/api/products/${editingProductId}/images`);
        setImages(await refreshedResponse.json());
      }
    } catch (error) {
      setImageErrorMessage(
        error instanceof Error ? error.message : "이미지를 삭제하지 못했습니다.",
      );
    }
  }

  function validateForm() {
    if (!form.name.trim()) {
      return "상품명을 입력해주세요.";
    }

    const requiredNumberFields = [
      [form.costPrice, "매입가"],
      [form.shippingCost, "배송비"],
      [form.stock, "재고"],
    ] as const;

    for (const [value, label] of requiredNumberFields) {
      if (!isNonNegativeInteger(value)) {
        return `${label}는 0 이상의 정수로 입력해주세요.`;
      }
    }

    if (form.salePrice && !isNonNegativeInteger(form.salePrice)) {
      return "판매가는 0 이상의 정수로 입력해주세요.";
    }

    if (
      form.autoPricingEnabled &&
      (!form.targetMarginRate ||
        !/^\d+(\.\d{1,2})?$/.test(form.targetMarginRate) ||
        Number(form.targetMarginRate) >= 100)
    ) {
      return "자동계산 시 목표 마진율을 0 이상 100 미만으로 입력해주세요.";
    }

    return "";
  }

  function getFeeSetting(marketplace: MarketplaceCode) {
    return feeSettings.find((setting) => setting.marketplace === marketplace);
  }

  function getPricingResult(setting: FeeSetting): PricingResult | null {
    const costPrice = Number(form.costPrice);
    const shippingCost = Number(form.shippingCost);

    if (
      !isNonNegativeInteger(form.costPrice) ||
      !isNonNegativeInteger(form.shippingCost)
    ) {
      return null;
    }

    const targetMarginRate = form.targetMarginRate
      ? Number(form.targetMarginRate)
      : 0;
    const feeRate = Number(setting.feeRate);

    return calculateMarketplaceProfitability({
      costPrice,
      shippingCost,
      additionalCost: setting.additionalCost,
      feeRate,
      targetMarginRate,
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      autoPricingEnabled: form.autoPricingEnabled,
    });
  }

  function getRecommendedSalePrice() {
    const minimumPrices = feeSettings
      .filter((setting) => setting.enabled)
      .map((setting) => getPricingResult(setting)?.minimumSalePrice)
      .filter((price): price is number => price !== null && price !== undefined);

    return minimumPrices.length > 0 ? Math.max(...minimumPrices) : null;
  }

  function updateFeeSetting(
    marketplace: MarketplaceCode,
    field: "feeRate" | "additionalCost" | "enabled",
    value: string | boolean,
  ) {
    setFeeSettings((currentSettings) => {
      const existingSetting = currentSettings.find(
        (setting) => setting.marketplace === marketplace,
      );

      if (!existingSetting) {
        const newSetting: FeeSetting = {
          id: 0,
          marketplace,
          feeRate: "",
          additionalCost: 0,
          enabled: false,
        };

        if (field === "feeRate") {
          newSetting.feeRate = String(value);
        } else if (field === "additionalCost") {
          newSetting.additionalCost = Number(value);
        } else {
          newSetting.enabled = Boolean(value);
        }

        return [
          ...currentSettings,
          newSetting,
        ];
      }

      return currentSettings.map((setting) =>
        setting.marketplace === marketplace
          ? { ...setting, [field]: value }
          : setting,
      );
    });
  }

  async function handleSaveFeeSettings() {
    setIsFeeSaving(true);
    setFeeErrorMessage("");

    try {
      const settingsToSave = feeSettings.filter(
        (setting) => String(setting.feeRate).trim() !== "",
      );

      await Promise.all(
        settingsToSave.map(async (setting) => {
          const response = await fetch("/api/marketplace-fees", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              marketplace: setting.marketplace,
              feeRate: Number(setting.feeRate),
              additionalCost: Number(setting.additionalCost),
              enabled: setting.enabled,
            }),
          });
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error ?? "수수료 설정을 저장하지 못했습니다.");
          }
        }),
      );

      await loadFeeSettings();
    } catch (error) {
      setFeeErrorMessage(
        error instanceof Error ? error.message : "수수료 설정을 저장하지 못했습니다.",
      );
    } finally {
      setIsFeeSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validationMessage = validateForm();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        editingProductId === null
          ? "/api/products"
          : `/api/products/${editingProductId}`,
        {
        method: editingProductId === null ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          costPrice: Number(form.costPrice),
          shippingCost: Number(form.shippingCost),
          stock: Number(form.stock),
          sku: form.sku.trim() || null,
          salePrice: form.autoPricingEnabled
            ? getRecommendedSalePrice()
            : form.salePrice
              ? Number(form.salePrice)
              : null,
          autoPricingEnabled: form.autoPricingEnabled,
          targetMarginRate: form.targetMarginRate
            ? Number(form.targetMarginRate)
            : null,
          brand: form.brand.trim() || null,
          manufacturer: form.manufacturer.trim() || null,
          origin: form.origin.trim() || null,
          category: form.category.trim() || null,
          barcode: form.barcode.trim() || null,
          modelNo: form.modelNo.trim() || null,
          description: form.description.trim() || null,
          supplierName: form.supplierName.trim() || null,
          supplierUrl: form.supplierUrl.trim() || null,
          supplierProductCode: form.supplierProductCode.trim() || null,
          weight: form.weight ? Number(form.weight) : null,
          width: form.width ? Number(form.width) : null,
          height: form.height ? Number(form.height) : null,
          depth: form.depth ? Number(form.depth) : null,
        }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "상품을 등록하지 못했습니다.");
      }

      const wasEditing = editingProductId !== null;
      setForm(emptyForm);
      setEditingProductId(null);
      setSuccessMessage(wasEditing ? "상품이 수정되었습니다." : "상품이 등록되었습니다.");
      await loadProducts();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "상품을 등록하지 못했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-sm font-semibold tracking-wide text-blue-700">
            상품 관리
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            멀티마켓 판매 자동화
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            상품을 등록하고 저장된 상품을 확인할 수 있습니다.
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-950">
              {editingProductId === null ? "상품 등록" : "상품 상세 / 수정"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {editingProductId === null
                ? "필수 항목을 입력한 후 저장해주세요."
                : `상품 ID ${editingProductId}의 정보를 확인하고 수정해주세요.`}
            </p>
          </div>

          <div className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-base font-semibold text-slate-950">상품 이미지</h3>
            {editingProductId === null ? (
              <p className="mt-2 text-sm text-slate-500">
                상품을 먼저 저장한 후 이미지를 추가할 수 있습니다.
              </p>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap gap-3">
                  {images.length === 0 ? (
                    <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-xs text-slate-400">
                      이미지 없음
                    </div>
                  ) : (
                    images.map((image, index) => (
                      <div key={image.id} className="relative w-32 rounded-lg border border-slate-200 bg-white p-2">
                        <img src={image.imageUrl} alt={`${form.name} 이미지 ${index + 1}`} className="h-28 w-full rounded object-cover" />
                        {image.isPrimary && (
                          <span className="absolute left-3 top-3 rounded bg-blue-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            대표
                          </span>
                        )}
                        <div className="mt-2 grid grid-cols-2 gap-1">
                          <button type="button" onClick={() => void updateImage(image.id, { direction: "up" })} className="rounded border border-slate-200 py-1 text-xs text-slate-600 hover:bg-slate-50" aria-label="이미지 위로 이동">↑</button>
                          <button type="button" onClick={() => void updateImage(image.id, { direction: "down" })} className="rounded border border-slate-200 py-1 text-xs text-slate-600 hover:bg-slate-50" aria-label="이미지 아래로 이동">↓</button>
                          <button type="button" onClick={() => void updateImage(image.id, { isPrimary: true })} className="col-span-2 rounded border border-blue-200 py-1 text-xs text-blue-700 hover:bg-blue-50">대표 지정</button>
                          <button type="button" onClick={() => void deleteImage(image.id)} className="col-span-2 rounded border border-red-200 py-1 text-xs text-red-700 hover:bg-red-50">삭제</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="flex-1 space-y-1">
                    <span className="text-xs font-medium text-slate-600">이미지 URL 추가</span>
                    <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
                  </label>
                  <button type="button" onClick={() => void addImageUrl()} disabled={isImageSaving} className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50">URL 추가</button>
                  <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    파일 선택
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.target.value = ""; }} />
                  </label>
                </div>
                {imageErrorMessage && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{imageErrorMessage}</p>}
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <FormSection title="기본정보" description="상품을 구분하는 기본 정보를 입력하세요.">
              <TextField
                label="상품명"
                required
                value={form.name}
                onChange={(value) => updateForm("name", value)}
                placeholder="상품명을 입력하세요"
              />
              <TextField
                label="SKU"
                value={form.sku}
                onChange={(value) => updateForm("sku", value)}
              />
              <TextField
                label="브랜드"
                value={form.brand}
                onChange={(value) => updateForm("brand", value)}
              />
              <TextField
                label="제조사"
                value={form.manufacturer}
                onChange={(value) => updateForm("manufacturer", value)}
              />
              <TextField
                label="모델번호"
                value={form.modelNo}
                onChange={(value) => updateForm("modelNo", value)}
              />
              <TextField
                label="바코드 / GTIN"
                value={form.barcode}
                onChange={(value) => updateForm("barcode", value)}
              />
              <TextField
                label="원산지"
                value={form.origin}
                onChange={(value) => updateForm("origin", value)}
              />
              <TextField
                label="카테고리"
                value={form.category}
                onChange={(value) => updateForm("category", value)}
              />
            </FormSection>

            <FormSection title="가격 / 재고" description="금액은 원 단위, 재고는 개 단위입니다.">
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.autoPricingEnabled}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      autoPricingEnabled: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-blue-700"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-800">
                    판매가 자동계산
                  </span>
                  <span className="block text-xs text-slate-500">
                    {form.autoPricingEnabled
                      ? "활성화된 마켓의 최저 판매가를 기준으로 계산합니다."
                      : "판매가를 직접 입력합니다."}
                  </span>
                </span>
              </label>
              <NumberField
                label="목표 마진율"
                value={form.targetMarginRate}
                onChange={(value) => updateForm("targetMarginRate", value)}
                suffix="%"
              />
              <NumberField
                label="매입가"
                required
                value={form.costPrice}
                onChange={(value) => updateForm("costPrice", value)}
                suffix="원"
              />
              <NumberField
                label="배송비"
                required
                value={form.shippingCost}
                onChange={(value) => updateForm("shippingCost", value)}
                suffix="원"
              />
              <NumberField
                label="판매가"
                value={form.salePrice}
                onChange={(value) => updateForm("salePrice", value)}
                suffix="원"
              />
              <NumberField
                label="재고"
                required
                value={form.stock}
                onChange={(value) => updateForm("stock", value)}
                suffix="개"
              />
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 md:col-span-2">
                <span className="block text-xs font-medium text-blue-700">추천 판매가</span>
                <strong className="mt-1 block text-xl text-blue-950">
                  {formatNumber(getRecommendedSalePrice())}
                </strong>
                <span className="mt-1 block text-xs text-blue-700">
                  활성화된 마켓 중 가장 높은 최저 판매가를 사용합니다.
                </span>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-base font-semibold text-slate-950">마켓별 수익성</h3>
                <p className="mt-1 text-sm text-slate-500">
                  현재 수수료 설정을 기준으로 계산한 예상값입니다.
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-[900px] w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">마켓</th>
                        <th className="px-4 py-3 font-semibold">수수료율</th>
                        <th className="px-4 py-3 font-semibold">추가비용</th>
                        <th className="px-4 py-3 font-semibold">최저 판매가</th>
                        <th className="px-4 py-3 font-semibold">현재/추천 판매가</th>
                        <th className="px-4 py-3 font-semibold">예상 수수료</th>
                        <th className="px-4 py-3 font-semibold">예상 순이익</th>
                        <th className="px-4 py-3 font-semibold">마진율</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {marketplaces.map((marketplace) => {
                        const setting = getFeeSetting(marketplace.code);
                        const result = setting ? getPricingResult(setting) : null;
                        const usedSalePrice = result?.salePrice ?? null;
                        const estimatedFee =
                          usedSalePrice !== null && setting
                            ? Math.round(usedSalePrice * (Number(setting.feeRate) / 100))
                            : null;

                        return (
                          <tr key={marketplace.code}>
                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                              {marketplace.label}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              {setting ? `${setting.feeRate}%` : "미설정"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              {setting ? formatNumber(setting.additionalCost) : "-"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              {!setting ? "-" : !setting.enabled ? "사용 안 함" : formatNumber(result?.minimumSalePrice ?? null)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              {!setting ? "-" : !setting.enabled ? "사용 안 함" : formatNumber(usedSalePrice)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              {!setting || !setting.enabled ? "-" : formatNumber(estimatedFee)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              {!setting || !setting.enabled ? "-" : formatNumber(result?.netProfit ?? null)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              {!setting || !setting.enabled
                                ? "-"
                                : result?.marginRate === null || result?.marginRate === undefined
                                  ? "계산 불가"
                                  : `${result.marginRate.toFixed(2)}%`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </FormSection>

            <FormSection title="공급처 정보" description="상품을 공급받는 곳의 정보를 입력하세요.">
              <TextField
                label="공급처명"
                value={form.supplierName}
                onChange={(value) => updateForm("supplierName", value)}
              />
              <TextField
                label="공급처 URL"
                type="url"
                value={form.supplierUrl}
                onChange={(value) => updateForm("supplierUrl", value)}
                placeholder="https://"
              />
              <TextField
                label="공급처 상품코드"
                value={form.supplierProductCode}
                onChange={(value) => updateForm("supplierProductCode", value)}
              />
            </FormSection>

            <FormSection title="물류 정보" description="무게는 g, 크기는 mm 단위입니다.">
              <NumberField
                label="무게"
                value={form.weight}
                onChange={(value) => updateForm("weight", value)}
                suffix="g"
              />
              <NumberField
                label="가로"
                value={form.width}
                onChange={(value) => updateForm("width", value)}
                suffix="mm"
              />
              <NumberField
                label="세로"
                value={form.height}
                onChange={(value) => updateForm("height", value)}
                suffix="mm"
              />
              <NumberField
                label="높이"
                value={form.depth}
                onChange={(value) => updateForm("depth", value)}
                suffix="mm"
              />
            </FormSection>

            <FormSection title="상품 설명">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">설명</span>
                <textarea
                  value={form.description}
                  onChange={(event) => updateForm("description", event.target.value)}
                  className="min-h-28 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  placeholder="상품 설명을 입력하세요"
                />
              </label>
            </FormSection>

            {errorMessage && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p
                role="status"
                className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSaving || isLoadingProduct}
              className="w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto sm:min-w-32"
            >
              {isSaving
                ? "저장 중..."
                : editingProductId === null
                  ? "상품 저장"
                  : "상품 수정 저장"}
            </button>
            {editingProductId !== null && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="ml-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                수정 취소
              </button>
            )}
          </form>

          {editingProductId !== null && (
            <>
              <MarketplaceChannelPanel productId={editingProductId} />
              <div id="coupang-registration" className="scroll-mt-6">
                <CoupangRegistrationPanel productId={editingProductId} />
              </div>
            </>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">등록 상품 목록</h2>
              <p className="mt-1 text-sm text-slate-500">
                최신 등록 상품부터 표시됩니다.
              </p>
            </div>
            <span className="text-sm font-medium text-slate-600">
              총 {products.length}개
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">ID</th>
                  <th className="px-5 py-3 font-semibold">대표 이미지</th>
                  <th className="px-5 py-3 font-semibold">상품명</th>
                  <th className="px-5 py-3 font-semibold">SKU</th>
                  <th className="px-5 py-3 font-semibold">브랜드</th>
                  <th className="px-5 py-3 font-semibold">매입가</th>
                  <th className="px-5 py-3 font-semibold">판매가</th>
                  <th className="px-5 py-3 font-semibold">재고</th>
                  <th className="px-5 py-3 font-semibold">공급처</th>
                  <th className="px-5 py-3 font-semibold">등록일</th>
                  <th className="px-5 py-3 font-semibold">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-5 py-10 text-center text-slate-500">
                      상품 목록을 불러오는 중입니다.
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-5 py-10 text-center text-slate-500">
                      등록된 상품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="text-slate-700">
                      <td className="whitespace-nowrap px-5 py-4">{product.id}</td>
                      <td className="px-5 py-4">
                        {product.images?.[0] ? (
                          <img src={product.images[0].imageUrl} alt={`${product.name} 대표 이미지`} className="h-12 w-12 rounded object-cover" />
                        ) : (
                          <span className="text-xs text-slate-400">이미지 없음</span>
                        )}
                      </td>
                      <td className="max-w-56 px-5 py-4 font-medium text-slate-950">
                        <span className="block truncate">{product.name}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">{product.sku ?? "-"}</td>
                      <td className="whitespace-nowrap px-5 py-4">{product.brand ?? "-"}</td>
                      <td className="whitespace-nowrap px-5 py-4">{formatNumber(product.costPrice)}</td>
                      <td className="whitespace-nowrap px-5 py-4">{formatNumber(product.salePrice)}</td>
                      <td className="whitespace-nowrap px-5 py-4">{product.stock.toLocaleString("ko-KR")}개</td>
                      <td className="whitespace-nowrap px-5 py-4">{product.supplierName ?? "-"}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">{formatDate(product.createdAt)}</td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <button
                          type="button"
                          onClick={() => void handleEdit(product.id)}
                          disabled={isLoadingProduct}
                          className="rounded-md border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          상세/수정
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-950">마켓 수수료 설정</h2>
            <p className="mt-1 text-sm text-slate-500">
              수익성 계산에 사용할 마켓별 수수료와 추가비용을 입력하세요.
            </p>
            <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              현재 저장된 수수료율은 테스트용 입력값일 수 있습니다. 공식 수수료율로 간주하지 말고 실제 마켓 정책을 확인해주세요.
            </p>
          </div>

          {feeErrorMessage && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {feeErrorMessage}
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-[680px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">마켓</th>
                  <th className="px-4 py-3 font-semibold">활성화</th>
                  <th className="px-4 py-3 font-semibold">수수료율 (%)</th>
                  <th className="px-4 py-3 font-semibold">추가비용 (원)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isFeeLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      수수료 설정을 불러오는 중입니다.
                    </td>
                  </tr>
                ) : (
                  marketplaces.map((marketplace) => {
                    const setting = getFeeSetting(marketplace.code);

                    return (
                      <tr key={marketplace.code}>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                          {marketplace.label}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={setting?.enabled ?? false}
                            onChange={(event) =>
                              updateFeeSetting(marketplace.code, "enabled", event.target.checked)
                            }
                            className="h-4 w-4 accent-blue-700"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max="99.99"
                            step="0.01"
                            value={setting?.feeRate ?? ""}
                            onChange={(event) =>
                              updateFeeSetting(marketplace.code, "feeRate", event.target.value)
                            }
                            className="w-32 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            placeholder="예: 10.50"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={setting?.additionalCost ?? 0}
                            onChange={(event) =>
                              updateFeeSetting(marketplace.code, "additionalCost", event.target.value)
                            }
                            className="w-32 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleSaveFeeSettings}
            disabled={isFeeSaving || isFeeLoading}
            className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
          >
            {isFeeSaving ? "수수료 저장 중..." : "수수료 설정 저장"}
          </button>
        </section>
      </div>
    </main>
  );
}

type NumberFieldProps = {
  label: string;
  value: string;
  required?: boolean;
  suffix?: string;
  onChange: (value: string) => void;
};

type FormSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <fieldset className="border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
      <legend className="text-base font-semibold text-slate-950">{title}</legend>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      <div className="mt-4 grid gap-5 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function NumberField({ label, value, required, suffix, onChange }: NumberFieldProps) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="1"
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          placeholder="0"
        />
        {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
      </span>
    </label>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  required?: boolean;
  type?: "text" | "url";
  placeholder?: string;
  onChange: (value: string) => void;
};

function TextField({ label, value, required, type = "text", placeholder, onChange }: TextFieldProps) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        placeholder={placeholder}
      />
    </label>
  );
}
