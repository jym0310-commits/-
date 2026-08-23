export type CoupangCategoryMetadataResponse = {
  code: string | number;
  message: string;
  data: CoupangCategoryMetadataData | null;
};

export type CoupangCategoryMetadataData = {
  isAllowSingleItem: boolean;
  attributes: CoupangCategoryAttributeMetadata[];
  noticeCategories: CoupangNoticeCategoryMetadata[] | null;
  requiredDocumentNames: CoupangRequiredDocumentMetadata[] | null;
  certifications: CoupangCertificationMetadata[] | null;
  allowedOfferConditions: string[] | null;
};

export type CoupangCategoryAttributeMetadata = {
  attributeTypeName: string;
  required: "MANDATORY" | "OPTIONAL";
  dataType: "STRING" | "NUMBER" | "DATE";
  basicUnit: string;
  inputType?: "INPUT" | "SELECT";
  inputValues?: string[];
  usableUnits: string[];
  groupNumber: string;
  exposed: "EXPOSED" | "NONE";
};

export type CoupangNoticeCategoryMetadata = {
  noticeCategoryName: string;
  noticeCategoryDetailNames: Array<{
    noticeCategoryDetailName: string;
    required: "MANDATORY" | "OPTIONAL";
  }>;
};

export type CoupangCertificationMetadata = {
  certificationType: string;
  name: string;
  dataType: "CODE" | "NONE";
  required: "MANDATORY" | "RECOMMEND" | "OPTIONAL";
};

export type CoupangRequiredDocumentMetadata = {
  templateName: string;
  required:
    | "MANDATORY"
    | "OPTIONAL"
    | "MANDATORY_PARALLEL_IMPORTED"
    | "MANDATORY_OVERSEAS_PURCHASED";
};
