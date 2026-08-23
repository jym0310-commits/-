import type {
  CoupangAttribute,
  CoupangNotice,
  CoupangStoredAttribute,
  CoupangStoredNotice,
} from "@/lib/coupang/types";
import type {
  CoupangCategoryAttributeMetadata,
  CoupangNoticeCategoryMetadata,
} from "@/lib/coupang/category-metadata-types";

export type MetadataValidation = {
  valid: boolean;
  duplicateKeys: string[];
  missingRequiredKeys: string[];
  invalidValueKeys: string[];
};

export type AttributeMergeResult = {
  attributes: CoupangStoredAttribute[];
  removedAttributeNames: string[];
};

export type NoticeMergeResult = {
  notices: CoupangStoredNotice[];
  removedNoticeKeys: string[];
};

export function isValidDisplayCategoryCode(value: string | null | undefined) {
  return typeof value === "string" && /^[1-9]\d*$/.test(value.trim());
}

export function getStoredAttributes(value: unknown): CoupangStoredAttribute[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is CoupangStoredAttribute =>
      isObject(item) &&
      typeof item.attributeTypeName === "string" &&
      typeof item.attributeValueName === "string",
  );
}

export function getStoredNotices(value: unknown): CoupangStoredNotice[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is CoupangStoredNotice =>
      isObject(item) &&
      typeof item.noticeCategoryName === "string" &&
      typeof item.noticeCategoryDetailName === "string" &&
      typeof item.content === "string",
  );
}

export function validateStoredAttributes(value: unknown): MetadataValidation {
  const attributes = getStoredAttributes(value);
  const invalidStructure = !Array.isArray(value) || attributes.length !== value.length;
  const names = attributes.map((item) => item.attributeTypeName.trim()).filter(Boolean);

  return {
    valid:
      !invalidStructure &&
      attributes.length > 0 &&
      names.length === attributes.length &&
      hasOnlyKnownRequiredValues(attributes) &&
      hasOnlyKnownExposedValues(attributes),
    duplicateKeys: findDuplicates(names),
    missingRequiredKeys: attributes
      .filter(
        (item) =>
          item.required === "MANDATORY" && !item.attributeValueName.trim(),
      )
      .map((item) => item.attributeTypeName.trim()),
    invalidValueKeys: attributes
      .filter(
        (item) =>
          item.attributeValueName.trim() !== "" &&
          item.inputType === "SELECT" &&
          Array.isArray(item.inputValues) &&
          !item.inputValues.includes(item.attributeValueName.trim()),
      )
      .map((item) => item.attributeTypeName.trim()),
  };
}

export function validateStoredNotices(value: unknown): MetadataValidation {
  const notices = getStoredNotices(value);
  const keys = notices
    .map((item) => noticeKey(item.noticeCategoryName, item.noticeCategoryDetailName))
    .filter(Boolean);

  return {
    valid:
      Array.isArray(value) &&
      notices.length > 0 &&
      notices.length === value.length &&
      keys.length === notices.length &&
      hasOnlyKnownRequiredValues(notices),
    duplicateKeys: findDuplicates(keys),
    missingRequiredKeys: notices
      .filter((item) => item.required === "MANDATORY" && !item.content.trim())
      .map((item) => noticeKey(item.noticeCategoryName, item.noticeCategoryDetailName)),
    invalidValueKeys: [],
  };
}

export function mergeCategoryAttributes(
  metadata: CoupangCategoryAttributeMetadata[],
  existingValue: unknown,
): AttributeMergeResult {
  const existingAttributes = getStoredAttributes(existingValue);
  const existingByName = new Map(
    existingAttributes.map((item) => [item.attributeTypeName.trim(), item]),
  );
  const metadataNames = new Set(
    metadata.map((item) => item.attributeTypeName.trim()),
  );

  return {
    attributes: metadata.map((item) => {
      const name = item.attributeTypeName.trim();
      const existing = existingByName.get(name);
      const existingValueName = existing?.attributeValueName.trim() ?? "";
      const attributeValueName = canPreserveAttributeValue(item, existingValueName)
        ? existingValueName
        : "";

      return {
        ...existing,
        attributeTypeName: name,
        attributeValueName,
        required: item.required,
        dataType: item.dataType,
        basicUnit: item.basicUnit,
        inputType: item.inputType ?? "INPUT",
        inputValues: item.inputValues ?? [],
        usableUnits: item.usableUnits,
        groupNumber: item.groupNumber,
        exposed: item.exposed,
        editable: existing?.editable ?? true,
        metadataManaged: true,
      };
    }),
    removedAttributeNames: existingAttributes
      .map((item) => item.attributeTypeName.trim())
      .filter((name) => name !== "" && !metadataNames.has(name)),
  };
}

export function mergeNoticeCategory(
  metadata: CoupangNoticeCategoryMetadata,
  existingValue: unknown,
): NoticeMergeResult {
  const categoryName = metadata.noticeCategoryName.trim();
  const existingNotices = getStoredNotices(existingValue);
  const existingByKey = new Map(
    existingNotices.map((item) => [
      noticeKey(item.noticeCategoryName, item.noticeCategoryDetailName),
      item,
    ]),
  );
  const metadataKeys = new Set(
    metadata.noticeCategoryDetailNames.map((item) =>
      noticeKey(categoryName, item.noticeCategoryDetailName),
    ),
  );

  return {
    notices: metadata.noticeCategoryDetailNames.map((item) => {
      const detailName = item.noticeCategoryDetailName.trim();
      const key = noticeKey(categoryName, detailName);
      const existing = existingByKey.get(key);

      return {
        ...existing,
        noticeCategoryName: categoryName,
        noticeCategoryDetailName: detailName,
        content: existing?.content.trim() ?? "",
        required: item.required,
        editable: existing?.editable ?? true,
        metadataManaged: true,
      };
    }),
    removedNoticeKeys: existingNotices
      .map((item) => noticeKey(item.noticeCategoryName, item.noticeCategoryDetailName))
      .filter((key) => key !== "" && !metadataKeys.has(key)),
  };
}

export function toCoupangAttributes(value: unknown): CoupangAttribute[] {
  return getStoredAttributes(value)
    .filter(
      (item) =>
        item.attributeTypeName.trim() !== "" &&
        item.attributeValueName.trim() !== "",
    )
    .map((item) => ({
      attributeTypeName: item.attributeTypeName.trim(),
      attributeValueName: item.attributeValueName.trim(),
      ...(item.exposed === "NONE" ? { exposed: "NONE" as const } : {}),
    }));
}

export function toCoupangNotices(value: unknown): CoupangNotice[] {
  return getStoredNotices(value)
    .filter(
      (item) =>
        item.noticeCategoryName.trim() !== "" &&
        item.noticeCategoryDetailName.trim() !== "" &&
        item.content.trim() !== "",
    )
    .map((item) => ({
      noticeCategoryName: item.noticeCategoryName.trim(),
      noticeCategoryDetailName: item.noticeCategoryDetailName.trim(),
      content: item.content.trim(),
    }));
}

function hasOnlyKnownRequiredValues(
  items: Array<{ required?: "MANDATORY" | "OPTIONAL" }>,
) {
  return items.every(
    (item) =>
      item.required === undefined ||
      item.required === "MANDATORY" ||
      item.required === "OPTIONAL",
  );
}

function hasOnlyKnownExposedValues(items: CoupangStoredAttribute[]) {
  return items.every(
    (item) =>
      item.exposed === undefined || item.exposed === "EXPOSED" || item.exposed === "NONE",
  );
}

function canPreserveAttributeValue(
  metadata: CoupangCategoryAttributeMetadata,
  value: string,
) {
  if (!value) return false;
  if (metadata.inputType !== "SELECT") return true;
  return (metadata.inputValues ?? []).includes(value);
}

function findDuplicates(keys: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const key of keys) {
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return [...duplicates];
}

function noticeKey(categoryName: string, detailName: string) {
  const category = categoryName.trim();
  const detail = detailName.trim();
  return category && detail ? `${category} / ${detail}` : "";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
