"use client";

import { useCallback, useEffect, useState } from "react";
import { CoupangCategoryMetadataPreviewPanel } from "@/components/coupang/CoupangCategoryMetadataPreview";
import type { CoupangCategoryMetadataPreview } from "@/lib/coupang/category-metadata-preview-types";
import type {
  CoupangReadiness,
  CoupangStoredAttribute,
  CoupangStoredNotice,
} from "@/lib/coupang/types";

type Props = { productId: number };

type PreservedSettingState = {
  deliveryMethod: string;
  deliveryChargeType: string;
  remoteAreaDeliverable: string;
  unionDeliveryType: string;
  outboundShippingTimeDay: number;
  maximumBuyForPerson: number;
  maximumBuyForPersonPeriod: number;
  unitCount: number;
  adultOnly: string;
  taxType: string;
  parallelImported: string;
  overseasPurchased: string;
  pccNeeded: boolean;
  emptyBarcodeReason: string | null;
  certifications: Record<string, unknown>[];
  requiredDocuments: Record<string, unknown>[];
};

type FormState = {
  displayCategoryCode: string;
  brandId: string;
  vendorUserId: string;
  deliveryCompanyCode: string;
  deliveryCharge: string;
  freeShipOverAmount: string;
  deliveryChargeOnReturn: string;
  returnCenterCode: string;
  returnChargeName: string;
  companyContactNumber: string;
  returnZipCode: string;
  returnAddress: string;
  returnAddressDetail: string;
  returnCharge: string;
  outboundShippingPlaceCode: string;
  attributes: CoupangStoredAttribute[];
  notices: CoupangStoredNotice[];
};

const emptyForm: FormState = {
  displayCategoryCode: "",
  brandId: "",
  vendorUserId: "",
  deliveryCompanyCode: "",
  deliveryCharge: "0",
  freeShipOverAmount: "0",
  deliveryChargeOnReturn: "",
  returnCenterCode: "",
  returnChargeName: "",
  companyContactNumber: "",
  returnZipCode: "",
  returnAddress: "",
  returnAddressDetail: "",
  returnCharge: "",
  outboundShippingPlaceCode: "",
  attributes: [],
  notices: [],
};

const defaultPreservedSetting: PreservedSettingState = {
  deliveryMethod: "SEQUENCIAL",
  deliveryChargeType: "FREE",
  remoteAreaDeliverable: "N",
  unionDeliveryType: "UNION_DELIVERY",
  outboundShippingTimeDay: 1,
  maximumBuyForPerson: 0,
  maximumBuyForPersonPeriod: 1,
  unitCount: 1,
  adultOnly: "EVERYONE",
  taxType: "TAX",
  parallelImported: "NOT_PARALLEL_IMPORTED",
  overseasPurchased: "NOT_OVERSEAS_PURCHASED",
  pccNeeded: false,
  emptyBarcodeReason: "바코드 없음",
  certifications: [],
  requiredDocuments: [],
};

export function CoupangRegistrationPanel({ productId }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [readiness, setReadiness] = useState<CoupangReadiness | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataPreview, setMetadataPreview] =
    useState<CoupangCategoryMetadataPreview | null>(null);
  const [selectedNoticeCategoryName, setSelectedNoticeCategoryName] = useState("");
  const [preservedSetting, setPreservedSetting] = useState(defaultPreservedSetting);
  const [savedMetadataFingerprint, setSavedMetadataFingerprint] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadReadiness = useCallback(async () => {
    const response = await fetch(
      `/api/products/${productId}/marketplaces/coupang/readiness`,
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "쿠팡 등록 준비상태를 불러오지 못했습니다.");
    }
    setReadiness(data);
  }, [productId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const [productResponse] = await Promise.all([
          fetch(`/api/products/${productId}`),
          loadReadiness(),
        ]);
        const product = await productResponse.json();
        if (!productResponse.ok) {
          throw new Error(product.error ?? "상품 정보를 불러오지 못했습니다.");
        }
        if (!cancelled && product.coupangSetting) {
          const setting = product.coupangSetting;
          const nextForm = {
            displayCategoryCode: setting.displayCategoryCode ?? "",
            brandId: setting.brandId ?? "",
            vendorUserId: setting.vendorUserId ?? "",
            deliveryCompanyCode: setting.deliveryCompanyCode ?? "",
            deliveryCharge: String(setting.deliveryCharge),
            freeShipOverAmount: String(setting.freeShipOverAmount),
            deliveryChargeOnReturn:
              setting.deliveryChargeOnReturn === null
                ? ""
                : String(setting.deliveryChargeOnReturn),
            returnCenterCode: setting.returnCenterCode ?? "",
            returnChargeName: setting.returnChargeName ?? "",
            companyContactNumber: setting.companyContactNumber ?? "",
            returnZipCode: setting.returnZipCode ?? "",
            returnAddress: setting.returnAddress ?? "",
            returnAddressDetail: setting.returnAddressDetail ?? "",
            returnCharge:
              setting.returnCharge === null ? "" : String(setting.returnCharge),
            outboundShippingPlaceCode:
              setting.outboundShippingPlaceCode ?? "",
            attributes: toEditableAttributes(setting.attributes),
            notices: toEditableNotices(setting.notices),
          };
          setForm(nextForm);
          setSavedMetadataFingerprint(getMetadataFingerprint(nextForm));
          setPreservedSetting({
            deliveryMethod: setting.deliveryMethod,
            deliveryChargeType: setting.deliveryChargeType,
            remoteAreaDeliverable: setting.remoteAreaDeliverable,
            unionDeliveryType: setting.unionDeliveryType,
            outboundShippingTimeDay: setting.outboundShippingTimeDay,
            maximumBuyForPerson: setting.maximumBuyForPerson,
            maximumBuyForPersonPeriod: setting.maximumBuyForPersonPeriod,
            unitCount: setting.unitCount,
            adultOnly: setting.adultOnly,
            taxType: setting.taxType,
            parallelImported: setting.parallelImported,
            overseasPurchased: setting.overseasPurchased,
            pccNeeded: setting.pccNeeded,
            emptyBarcodeReason: setting.emptyBarcodeReason,
            certifications: toObjectArray(setting.certifications),
            requiredDocuments: toObjectArray(setting.requiredDocuments),
          });
        } else if (!cancelled) {
          setSavedMetadataFingerprint(getMetadataFingerprint(emptyForm));
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "정보를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [loadReadiness, productId]);

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateAttribute(
    index: number,
    field: "attributeTypeName" | "attributeValueName" | "required" | "exposed",
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      attributes: current.attributes.map((attribute, attributeIndex) =>
        attributeIndex === index ? { ...attribute, [field]: value } : attribute,
      ),
    }));
  }

  function updateNotice(
    index: number,
    field: "noticeCategoryName" | "noticeCategoryDetailName" | "content" | "required",
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      notices: current.notices.map((notice, noticeIndex) =>
        noticeIndex === index ? { ...notice, [field]: value } : notice,
      ),
    }));
  }

  async function saveSettings(overrides?: {
    attributes: CoupangStoredAttribute[];
    notices: CoupangStoredNotice[];
    successMessage: string;
  }) {
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const nextAttributes = overrides?.attributes ?? form.attributes;
      const nextNotices = overrides?.notices ?? form.notices;
      const response = await fetch(
        `/api/products/${productId}/marketplaces/coupang/settings`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayCategoryCode: form.displayCategoryCode,
            brandId: form.brandId,
            vendorUserId: form.vendorUserId,
            deliveryMethod: preservedSetting.deliveryMethod,
            deliveryCompanyCode: form.deliveryCompanyCode,
            deliveryChargeType: preservedSetting.deliveryChargeType,
            deliveryCharge: toInteger(form.deliveryCharge),
            freeShipOverAmount: toInteger(form.freeShipOverAmount),
            deliveryChargeOnReturn: toNullableInteger(form.deliveryChargeOnReturn),
            remoteAreaDeliverable: preservedSetting.remoteAreaDeliverable,
            unionDeliveryType: preservedSetting.unionDeliveryType,
            returnCenterCode: form.returnCenterCode,
            returnChargeName: form.returnChargeName,
            companyContactNumber: form.companyContactNumber,
            returnZipCode: form.returnZipCode,
            returnAddress: form.returnAddress,
            returnAddressDetail: form.returnAddressDetail,
            returnCharge: toNullableInteger(form.returnCharge),
            outboundShippingPlaceCode: form.outboundShippingPlaceCode,
            outboundShippingTimeDay: preservedSetting.outboundShippingTimeDay,
            maximumBuyForPerson: preservedSetting.maximumBuyForPerson,
            maximumBuyForPersonPeriod: preservedSetting.maximumBuyForPersonPeriod,
            unitCount: preservedSetting.unitCount,
            adultOnly: preservedSetting.adultOnly,
            taxType: preservedSetting.taxType,
            parallelImported: preservedSetting.parallelImported,
            overseasPurchased: preservedSetting.overseasPurchased,
            pccNeeded: preservedSetting.pccNeeded,
            emptyBarcodeReason: preservedSetting.emptyBarcodeReason,
            attributes: nextAttributes,
            notices: nextNotices,
            certifications: preservedSetting.certifications,
            requiredDocuments: preservedSetting.requiredDocuments,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "쿠팡 설정을 저장하지 못했습니다.");
      }
      const nextForm = {
        ...form,
        attributes: nextAttributes,
        notices: nextNotices,
      };
      setForm(nextForm);
      setSavedMetadataFingerprint(getMetadataFingerprint(nextForm));
      await loadReadiness();
      setMessage(overrides?.successMessage ?? "쿠팡 상품 설정이 저장되었습니다.");
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "쿠팡 설정을 저장하지 못했습니다.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function loadMetadataPreview() {
    setError("");
    setMessage("");
    setMetadataPreview(null);

    if (getMetadataFingerprint(form) !== savedMetadataFingerprint) {
      setError("카테고리 코드와 현재 속성/상품고시를 먼저 저장해 주세요.");
      return;
    }

    setIsLoadingMetadata(true);
    try {
      const response = await fetch(
        `/api/products/${productId}/marketplaces/coupang/category-metadata`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? data.error ?? "카테고리 메타정보를 불러오지 못했습니다.");
      }
      const preview = data as CoupangCategoryMetadataPreview;
      setMetadataPreview(preview);
      setSelectedNoticeCategoryName(preview.selectedNoticeCategoryName ?? "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "카테고리 메타정보를 불러오지 못했습니다.");
    } finally {
      setIsLoadingMetadata(false);
    }
  }

  async function applyMetadataPreview() {
    if (!metadataPreview) return;
    const selectedNotice = metadataPreview.noticeCategories.find(
      (item) => item.noticeCategoryName === selectedNoticeCategoryName,
    );
    if (metadataPreview.noticeCategories.length > 0 && !selectedNotice) {
      setError("적용할 상품고시 카테고리를 선택해 주세요.");
      return;
    }

    const saved = await saveSettings({
      attributes: metadataPreview.attributes.merged,
      notices: selectedNotice?.merged ?? form.notices,
      successMessage: "카테고리 메타정보를 적용하고 저장했습니다.",
    });
    if (saved) {
      setMetadataPreview(null);
      setSelectedNoticeCategoryName("");
    }
  }

  async function registerProduct() {
    setIsRegistering(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/products/${productId}/marketplaces/coupang`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        const details = Array.isArray(data.missingFields)
          ? `\n- ${data.missingFields.join("\n- ")}`
          : "";
        throw new Error(`${data.message ?? "쿠팡 상품등록에 실패했습니다."}${details}`);
      }
      setMessage(data.message ?? "쿠팡 상품이 등록되었습니다.");
      await loadReadiness();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "쿠팡 상품등록에 실패했습니다.");
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <section className="mt-8 border-t border-slate-200 pt-8">
      <h2 className="text-xl font-semibold text-slate-950">쿠팡 등록</h2>
      <p className="mt-1 text-sm text-slate-500">
        현재 단계에서는 단일 옵션 상품만 지원하며 자동 승인 요청은 하지 않습니다.
      </p>

      {isLoading ? (
        <p className="mt-4 text-sm text-slate-500">쿠팡 설정을 불러오는 중입니다.</p>
      ) : (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <SettingField label="쿠팡 카테고리 코드" value={form.displayCategoryCode} onChange={(value) => update("displayCategoryCode", value)} />
            <SettingField label="쿠팡 브랜드 ID (선택)" value={form.brandId} onChange={(value) => update("brandId", value)} />
            <SettingField label="Wing 사용자 ID" value={form.vendorUserId} onChange={(value) => update("vendorUserId", value)} />
            <SettingField label="택배사 코드" value={form.deliveryCompanyCode} onChange={(value) => update("deliveryCompanyCode", value)} placeholder="예: KDEXP" />
            <SettingField label="기본 배송비" type="number" value={form.deliveryCharge} onChange={(value) => update("deliveryCharge", value)} />
            <SettingField label="무료배송 기준금액" type="number" value={form.freeShipOverAmount} onChange={(value) => update("freeShipOverAmount", value)} />
            <SettingField label="초도반품배송비" type="number" value={form.deliveryChargeOnReturn} onChange={(value) => update("deliveryChargeOnReturn", value)} />
            <SettingField label="반품배송비" type="number" value={form.returnCharge} onChange={(value) => update("returnCharge", value)} />
            <SettingField label="출고지 코드" value={form.outboundShippingPlaceCode} onChange={(value) => update("outboundShippingPlaceCode", value)} />
            <SettingField label="반품지 코드" value={form.returnCenterCode} onChange={(value) => update("returnCenterCode", value)} />
            <SettingField label="반품지명" value={form.returnChargeName} onChange={(value) => update("returnChargeName", value)} />
            <SettingField label="반품지 연락처" value={form.companyContactNumber} onChange={(value) => update("companyContactNumber", value)} />
            <SettingField label="반품지 우편번호" value={form.returnZipCode} onChange={(value) => update("returnZipCode", value)} />
            <SettingField label="반품지 주소" value={form.returnAddress} onChange={(value) => update("returnAddress", value)} />
            <SettingField label="반품지 상세주소" value={form.returnAddressDetail} onChange={(value) => update("returnAddressDetail", value)} />
          </div>

          <section className="mt-6 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-950">카테고리 메타정보</h3>
                <p className="mt-1 text-sm text-slate-600">
                  현재 카테고리 코드: {form.displayCategoryCode.trim() || "미입력"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadMetadataPreview()}
                disabled={isLoadingMetadata || isSaving}
                className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
              >
                {isLoadingMetadata ? "메타정보 확인 중..." : "메타정보 불러오기"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              인증정보가 없으면 외부 요청 없이 안내만 표시합니다. 미리보기는 적용 전까지 저장되지 않습니다.
            </p>
          </section>

          {metadataPreview && (
            <CoupangCategoryMetadataPreviewPanel
              preview={metadataPreview}
              selectedNoticeCategoryName={selectedNoticeCategoryName}
              isApplying={isSaving}
              onSelectNoticeCategory={setSelectedNoticeCategoryName}
              onApply={() => void applyMetadataPreview()}
              onCancel={() => {
                setMetadataPreview(null);
                setSelectedNoticeCategoryName("");
              }}
            />
          )}

          <AttributeEditor
            attributes={form.attributes}
            onAdd={() =>
              setForm((current) => ({
                ...current,
                attributes: [
                  ...current.attributes,
                  {
                    attributeTypeName: "",
                    attributeValueName: "",
                    required: "MANDATORY",
                    exposed: "NONE",
                    editable: true,
                  },
                ],
              }))
            }
            onChange={updateAttribute}
            onRemove={(index) =>
              setForm((current) => ({
                ...current,
                attributes: current.attributes.filter((_, itemIndex) => itemIndex !== index),
              }))
            }
          />
          <NoticeEditor
            notices={form.notices}
            onAdd={() =>
              setForm((current) => ({
                ...current,
                notices: [
                  ...current.notices,
                  {
                    noticeCategoryName: "",
                    noticeCategoryDetailName: "",
                    content: "",
                    required: "MANDATORY",
                    editable: true,
                  },
                ],
              }))
            }
            onChange={updateNotice}
            onRemove={(index) =>
              setForm((current) => ({
                ...current,
                notices: current.notices.filter((_, itemIndex) => itemIndex !== index),
              }))
            }
          />

          <button type="button" onClick={() => void saveSettings()} disabled={isSaving} className="mt-4 rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
            {isSaving ? "쿠팡 설정 저장 중..." : "쿠팡 설정 저장"}
          </button>

          {readiness && (
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-950">등록 준비 상태</h3>
              <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {readiness.checks.map((check) => (
                  <li key={check.key} className={check.passed ? "text-emerald-700" : "text-red-700"}>
                    {check.passed ? "✅" : "❌"} {check.label}
                  </li>
                ))}
              </ul>
              {readiness.warnings.length > 0 && (
                <ul className="mt-4 space-y-1 text-sm text-amber-800">
                  {readiness.warnings.map((warning) => <li key={warning}>⚠ {warning}</li>)}
                </ul>
              )}
              <p className="mt-4 text-xs text-slate-500">
                예상 payload: 옵션 {readiness.payloadSummary.itemCount}개 · 이미지 {readiness.payloadSummary.imageCount}개 · 판매가 {readiness.payloadSummary.salePrice?.toLocaleString("ko-KR") ?? "-"}원
              </p>
            </div>
          )}

          {error && <p role="alert" className="mt-4 whitespace-pre-line rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {message && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}

          <button type="button" onClick={() => void registerProduct()} disabled={!readiness?.ready || !readiness.liveEnabled || isRegistering} className="mt-5 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400">
            {isRegistering ? "쿠팡 등록 중..." : "쿠팡 등록"}
          </button>
          {!readiness?.liveEnabled && <p className="mt-2 text-xs text-slate-500">COUPANG_LIVE_ENABLED=false이므로 외부 등록 요청이 차단되어 있습니다.</p>}
        </>
      )}
    </section>
  );
}

function SettingField({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: "text" | "number"; placeholder?: string }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input type={type} min={type === "number" ? 0 : undefined} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
    </label>
  );
}

function AttributeEditor({
  attributes,
  onAdd,
  onChange,
  onRemove,
}: {
  attributes: CoupangStoredAttribute[];
  onAdd: () => void;
  onChange: (
    index: number,
    field: "attributeTypeName" | "attributeValueName" | "required" | "exposed",
    value: string,
  ) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <fieldset className="mt-6 rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <legend className="text-sm font-semibold text-slate-800">속성</legend>
        <button type="button" onClick={onAdd} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">속성 추가</button>
      </div>
      {attributes.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">등록된 속성이 없습니다.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {attributes.map((attribute, index) => (
            <div key={index} className="grid gap-2 rounded-md bg-slate-50 p-3 md:grid-cols-2">
              {attribute.metadataManaged ? (
                <MetadataLabel label="속성명" value={attribute.attributeTypeName} />
              ) : (
                <EditorInput label="속성명" value={attribute.attributeTypeName} onChange={(value) => onChange(index, "attributeTypeName", value)} />
              )}
              {attribute.inputType === "SELECT" ? (
                <AttributeValueSelect
                  attribute={attribute}
                  onChange={(value) => onChange(index, "attributeValueName", value)}
                />
              ) : (
                <EditorInput label="속성값" value={attribute.attributeValueName} onChange={(value) => onChange(index, "attributeValueName", value)} />
              )}
              {attribute.metadataManaged ? (
                <MetadataLabel label="필수 여부" value={attribute.required === "MANDATORY" ? "필수" : "선택"} required={attribute.required === "MANDATORY"} />
              ) : (
                <EditorSelect label="필수 여부" value={attribute.required ?? "OPTIONAL"} options={[{ value: "MANDATORY", label: "필수" }, { value: "OPTIONAL", label: "선택" }]} onChange={(value) => onChange(index, "required", value)} />
              )}
              {attribute.metadataManaged ? (
                <MetadataLabel label="입력 방식 / 구분" value={`${attribute.inputType ?? "INPUT"} · ${attribute.exposed === "NONE" ? "검색옵션" : "구매옵션"}`} />
              ) : (
                <EditorSelect label="속성 구분" value={attribute.exposed ?? "EXPOSED"} options={[{ value: "EXPOSED", label: "구매옵션" }, { value: "NONE", label: "검색옵션" }]} onChange={(value) => onChange(index, "exposed", value)} />
              )}
              {attribute.metadataManaged && (
                <p className="text-xs text-slate-500 md:col-span-2">
                  형식: {attribute.dataType ?? "STRING"}
                  {attribute.usableUnits?.length ? ` · 허용 단위: ${attribute.usableUnits.join(", ")}` : ""}
                  {attribute.inputType === "SELECT" && attribute.inputValues?.length ? ` · 허용값: ${attribute.inputValues.join(", ")}` : ""}
                </p>
              )}
              <button type="button" onClick={() => onRemove(index)} className="justify-self-start text-xs font-semibold text-red-600 hover:text-red-700">속성 삭제</button>
            </div>
          ))}
        </div>
      )}
    </fieldset>
  );
}

function NoticeEditor({
  notices,
  onAdd,
  onChange,
  onRemove,
}: {
  notices: CoupangStoredNotice[];
  onAdd: () => void;
  onChange: (
    index: number,
    field: "noticeCategoryName" | "noticeCategoryDetailName" | "content" | "required",
    value: string,
  ) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <fieldset className="mt-6 rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <legend className="text-sm font-semibold text-slate-800">상품고시정보</legend>
        <button type="button" onClick={onAdd} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">고시 항목 추가</button>
      </div>
      {notices.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">등록된 상품고시정보가 없습니다.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {notices.map((notice, index) => (
            <div key={index} className="grid gap-2 rounded-md bg-slate-50 p-3 md:grid-cols-2">
              {notice.metadataManaged ? <MetadataLabel label="고시 카테고리" value={notice.noticeCategoryName} /> : <EditorInput label="고시 카테고리" value={notice.noticeCategoryName} onChange={(value) => onChange(index, "noticeCategoryName", value)} />}
              {notice.metadataManaged ? <MetadataLabel label="상세 항목" value={notice.noticeCategoryDetailName} /> : <EditorInput label="상세 항목" value={notice.noticeCategoryDetailName} onChange={(value) => onChange(index, "noticeCategoryDetailName", value)} />}
              <div className="md:col-span-2"><EditorInput label="내용" value={notice.content} onChange={(value) => onChange(index, "content", value)} /></div>
              {notice.metadataManaged ? <MetadataLabel label="필수 여부" value={notice.required === "MANDATORY" ? "필수" : "선택"} required={notice.required === "MANDATORY"} /> : <EditorSelect label="필수 여부" value={notice.required ?? "OPTIONAL"} options={[{ value: "MANDATORY", label: "필수" }, { value: "OPTIONAL", label: "선택" }]} onChange={(value) => onChange(index, "required", value)} />}
              <button type="button" onClick={() => onRemove(index)} className="self-end justify-self-start pb-2 text-xs font-semibold text-red-600 hover:text-red-700">고시 항목 삭제</button>
            </div>
          ))}
        </div>
      )}
    </fieldset>
  );
}

function EditorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>;
}

function EditorSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function AttributeValueSelect({
  attribute,
  onChange,
}: {
  attribute: CoupangStoredAttribute;
  onChange: (value: string) => void;
}) {
  const inputValues = attribute.inputValues ?? [];
  const currentValue = attribute.attributeValueName;
  const hasInvalidCurrentValue =
    currentValue !== "" && !inputValues.includes(currentValue);

  return (
    <label className="space-y-1">
      <span className="text-xs font-medium text-slate-600">속성값</span>
      <select
        value={currentValue}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">선택해 주세요</option>
        {hasInvalidCurrentValue && (
          <option value={currentValue} disabled>
            허용되지 않는 기존 값: {currentValue}
          </option>
        )}
        {inputValues.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
      {hasInvalidCurrentValue && (
        <span className="block text-xs text-red-600">현재 허용 목록에 없는 값입니다.</span>
      )}
    </label>
  );
}

function MetadataLabel({
  label,
  value,
  required = false,
}: {
  label: string;
  value: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
        <span>{value || "-"}</span>
        {required && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold text-red-700">필수</span>}
      </div>
    </div>
  );
}

function toEditableAttributes(value: unknown): CoupangStoredAttribute[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isObject).map((item) => ({
    ...item,
    attributeTypeName: typeof item.attributeTypeName === "string" ? item.attributeTypeName : "",
    attributeValueName: typeof item.attributeValueName === "string" ? item.attributeValueName : "",
  }));
}

function toEditableNotices(value: unknown): CoupangStoredNotice[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isObject).map((item) => ({
    ...item,
    noticeCategoryName: typeof item.noticeCategoryName === "string" ? item.noticeCategoryName : "",
    noticeCategoryDetailName: typeof item.noticeCategoryDetailName === "string" ? item.noticeCategoryDetailName : "",
    content: typeof item.content === "string" ? item.content : "",
  }));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toObjectArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

function getMetadataFingerprint(form: FormState) {
  return JSON.stringify({
    displayCategoryCode: form.displayCategoryCode.trim(),
    attributes: form.attributes,
    notices: form.notices,
  });
}

function toInteger(value: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) throw new Error("금액은 0 이상의 정수여야 합니다.");
  return number;
}

function toNullableInteger(value: string) {
  return value.trim() === "" ? null : toInteger(value);
}
