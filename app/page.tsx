"use client";

import { FormEvent, useEffect, useState } from "react";

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
};

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

  function updateForm(field: keyof ProductForm, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
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

    return "";
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
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          costPrice: Number(form.costPrice),
          shippingCost: Number(form.shippingCost),
          stock: Number(form.stock),
          sku: form.sku.trim() || null,
          salePrice: form.salePrice ? Number(form.salePrice) : null,
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
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "상품을 등록하지 못했습니다.");
      }

      setForm(emptyForm);
      setSuccessMessage("상품이 등록되었습니다.");
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
            <h2 className="text-xl font-semibold text-slate-950">상품 등록</h2>
            <p className="mt-1 text-sm text-slate-500">
              필수 항목을 입력한 후 저장해주세요.
            </p>
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
              disabled={isSaving}
              className="w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto sm:min-w-32"
            >
              {isSaving ? "저장 중..." : "상품 저장"}
            </button>
          </form>
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
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">ID</th>
                  <th className="px-5 py-3 font-semibold">상품명</th>
                  <th className="px-5 py-3 font-semibold">SKU</th>
                  <th className="px-5 py-3 font-semibold">브랜드</th>
                  <th className="px-5 py-3 font-semibold">매입가</th>
                  <th className="px-5 py-3 font-semibold">판매가</th>
                  <th className="px-5 py-3 font-semibold">재고</th>
                  <th className="px-5 py-3 font-semibold">공급처</th>
                  <th className="px-5 py-3 font-semibold">등록일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-slate-500">
                      상품 목록을 불러오는 중입니다.
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-slate-500">
                      등록된 상품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="text-slate-700">
                      <td className="whitespace-nowrap px-5 py-4">{product.id}</td>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
