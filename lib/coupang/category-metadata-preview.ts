import {
  getStoredAttributes,
  getStoredNotices,
  mergeCategoryAttributes,
  mergeNoticeCategory,
} from "@/lib/coupang/category-metadata";
import type { CoupangCategoryMetadataData } from "@/lib/coupang/category-metadata-types";
import type { CoupangCategoryMetadataPreview } from "@/lib/coupang/category-metadata-preview-types";

export function buildCoupangCategoryMetadataPreview({
  displayCategoryCode,
  metadata,
  existingAttributes,
  existingNotices,
}: {
  displayCategoryCode: string;
  metadata: CoupangCategoryMetadataData;
  existingAttributes: unknown;
  existingNotices: unknown;
}): CoupangCategoryMetadataPreview {
  const currentAttributes = getStoredAttributes(existingAttributes);
  const currentNotices = getStoredNotices(existingNotices);
  const currentAttributeByName = new Map(
    currentAttributes.map((item) => [item.attributeTypeName.trim(), item]),
  );
  const attributeMerge = mergeCategoryAttributes(
    metadata.attributes,
    currentAttributes,
  );

  const noticeCategories = (metadata.noticeCategories ?? []).map((category) => {
    const noticeMerge = mergeNoticeCategory(category, currentNotices);
    const existingByKey = new Map(
      currentNotices.map((item) => [noticeKey(item.noticeCategoryName, item.noticeCategoryDetailName), item]),
    );
    const addedDetailNames = noticeMerge.notices
      .filter(
        (item) =>
          !existingByKey.has(
            noticeKey(item.noticeCategoryName, item.noticeCategoryDetailName),
          ),
      )
      .map((item) => item.noticeCategoryDetailName);

    return {
      noticeCategoryName: category.noticeCategoryName,
      merged: noticeMerge.notices,
      addedDetailNames,
      addedRequiredDetailNames: noticeMerge.notices
        .filter(
          (item) =>
            item.required === "MANDATORY" &&
            addedDetailNames.includes(item.noticeCategoryDetailName),
        )
        .map((item) => item.noticeCategoryDetailName),
      preservedContents: noticeMerge.notices
        .filter((item) => {
          const previous = existingByKey.get(
            noticeKey(item.noticeCategoryName, item.noticeCategoryDetailName),
          );
          return Boolean(previous?.content.trim() && previous.content.trim() === item.content);
        })
        .map((item) => ({
          noticeCategoryDetailName: item.noticeCategoryDetailName,
          content: item.content,
        })),
      removedNoticeKeys: noticeMerge.removedNoticeKeys,
    };
  });

  return {
    displayCategoryCode,
    isAllowSingleItem: metadata.isAllowSingleItem,
    selectedNoticeCategoryName: getInitialNoticeCategory(
      noticeCategories.map((item) => item.noticeCategoryName),
      currentNotices,
    ),
    attributes: {
      merged: attributeMerge.attributes,
      addedNames: attributeMerge.attributes
        .filter((item) => !currentAttributeByName.has(item.attributeTypeName.trim()))
        .map((item) => item.attributeTypeName),
      preservedValues: attributeMerge.attributes
        .filter((item) => {
          const previous = currentAttributeByName.get(item.attributeTypeName.trim());
          return Boolean(
            previous?.attributeValueName.trim() &&
              previous.attributeValueName.trim() === item.attributeValueName,
          );
        })
        .map((item) => ({
          attributeTypeName: item.attributeTypeName,
          attributeValueName: item.attributeValueName,
        })),
      clearedInvalidValues: attributeMerge.attributes
        .flatMap((item) => {
          const previous = currentAttributeByName.get(item.attributeTypeName.trim());
          return previous?.attributeValueName.trim() && !item.attributeValueName
            ? [{
                attributeTypeName: item.attributeTypeName,
                previousValue: previous.attributeValueName.trim(),
              }]
            : [];
        }),
      removedAttributeNames: attributeMerge.removedAttributeNames,
    },
    noticeCategories,
    certifications: metadata.certifications ?? [],
    requiredDocuments: metadata.requiredDocumentNames ?? [],
  };
}

function getInitialNoticeCategory(
  availableNames: string[],
  existingNotices: ReturnType<typeof getStoredNotices>,
) {
  const existingNames = new Set(
    existingNotices.map((item) => item.noticeCategoryName.trim()).filter(Boolean),
  );
  if (existingNames.size === 1) {
    const [existingName] = existingNames;
    if (availableNames.includes(existingName)) return existingName;
  }
  return availableNames.length === 1 ? availableNames[0] : null;
}

function noticeKey(categoryName: string, detailName: string) {
  return `${categoryName.trim()} / ${detailName.trim()}`;
}
