import type {
  CoupangCertificationMetadata,
  CoupangRequiredDocumentMetadata,
} from "@/lib/coupang/category-metadata-types";
import type {
  CoupangStoredAttribute,
  CoupangStoredNotice,
} from "@/lib/coupang/types";

export type CoupangCategoryMetadataPreview = {
  displayCategoryCode: string;
  isAllowSingleItem: boolean;
  selectedNoticeCategoryName: string | null;
  attributes: {
    merged: CoupangStoredAttribute[];
    addedNames: string[];
    preservedValues: Array<{
      attributeTypeName: string;
      attributeValueName: string;
    }>;
    clearedInvalidValues: Array<{
      attributeTypeName: string;
      previousValue: string;
    }>;
    removedAttributeNames: string[];
  };
  noticeCategories: Array<{
    noticeCategoryName: string;
    merged: CoupangStoredNotice[];
    addedDetailNames: string[];
    addedRequiredDetailNames: string[];
    preservedContents: Array<{
      noticeCategoryDetailName: string;
      content: string;
    }>;
    removedNoticeKeys: string[];
  }>;
  certifications: CoupangCertificationMetadata[];
  requiredDocuments: CoupangRequiredDocumentMetadata[];
};
