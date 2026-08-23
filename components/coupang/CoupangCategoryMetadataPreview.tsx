"use client";

import type { CoupangCategoryMetadataPreview } from "@/lib/coupang/category-metadata-preview-types";

type Props = {
  preview: CoupangCategoryMetadataPreview;
  selectedNoticeCategoryName: string;
  isApplying: boolean;
  onSelectNoticeCategory: (value: string) => void;
  onApply: () => void;
  onCancel: () => void;
};

export function CoupangCategoryMetadataPreviewPanel({
  preview,
  selectedNoticeCategoryName,
  isApplying,
  onSelectNoticeCategory,
  onApply,
  onCancel,
}: Props) {
  const selectedNotice = preview.noticeCategories.find(
    (item) => item.noticeCategoryName === selectedNoticeCategoryName,
  );
  const needsNoticeSelection =
    preview.noticeCategories.length > 0 && !selectedNotice;

  return (
    <section className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-blue-950">병합 미리보기</h4>
          <p className="mt-1 text-xs text-blue-800">
            아직 저장되지 않았습니다. 내용을 확인한 후 적용해 주세요.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-800">
          카테고리 {preview.displayCategoryCode}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <PreviewList title="새로 추가되는 속성" items={preview.attributes.addedNames} />
        <PreviewList
          title="기존값 유지"
          items={preview.attributes.preservedValues.map(
            (item) => `${item.attributeTypeName}: ${item.attributeValueName}`,
          )}
        />
        <PreviewList
          title="허용값 변경으로 초기화"
          items={preview.attributes.clearedInvalidValues.map(
            (item) => `${item.attributeTypeName}: ${item.previousValue}`,
          )}
        />
        <PreviewList
          title="제거 예정 속성"
          items={preview.attributes.removedAttributeNames}
          tone="danger"
        />
      </div>

      {preview.noticeCategories.length > 0 ? (
        <div className="mt-5 border-t border-blue-200 pt-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-blue-950">
              적용할 상품고시 카테고리
            </span>
            <select
              value={selectedNoticeCategoryName}
              onChange={(event) => onSelectNoticeCategory(event.target.value)}
              className="w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">상품고시 카테고리를 선택해 주세요</option>
              {preview.noticeCategories.map((item) => (
                <option key={item.noticeCategoryName} value={item.noticeCategoryName}>
                  {item.noticeCategoryName}
                </option>
              ))}
            </select>
          </label>

          {selectedNotice && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <PreviewList
                title="새 필수 고시"
                items={selectedNotice.addedRequiredDetailNames}
              />
              <PreviewList
                title="기존 내용 유지"
                items={selectedNotice.preservedContents.map(
                  (item) => `${item.noticeCategoryDetailName}: ${item.content}`,
                )}
              />
              <PreviewList
                title="제거 예정 고시"
                items={selectedNotice.removedNoticeKeys}
                tone="danger"
              />
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 text-xs text-blue-800">
          이 카테고리에서 제공된 상품고시 메타정보가 없습니다. 기존 상품고시는 유지됩니다.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApply}
          disabled={isApplying || needsNoticeSelection}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isApplying ? "적용 중..." : "적용하고 저장"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isApplying}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </section>
  );
}

function PreviewList({
  title,
  items,
  tone = "normal",
}: {
  title: string;
  items: string[];
  tone?: "normal" | "danger";
}) {
  return (
    <div className="rounded-md bg-white p-3">
      <h5 className={tone === "danger" ? "text-sm font-semibold text-red-700" : "text-sm font-semibold text-slate-800"}>
        {title} <span className="font-normal">({items.length})</span>
      </h5>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs text-slate-700">
          {items.map((item) => <li key={item}>- {item}</li>)}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-slate-400">없음</p>
      )}
    </div>
  );
}
