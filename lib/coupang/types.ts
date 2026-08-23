import type { MarketplaceReadiness } from "@/lib/marketplaces/types";

export type CoupangAttribute = {
  attributeTypeName: string;
  attributeValueName: string;
  exposed?: "NONE";
};

export type CoupangStoredAttribute = Record<string, unknown> & {
  attributeTypeName: string;
  attributeValueName: string;
  required?: "MANDATORY" | "OPTIONAL";
  exposed?: "EXPOSED" | "NONE";
  editable?: boolean;
  metadataManaged?: boolean;
  dataType?: "STRING" | "NUMBER" | "DATE";
  basicUnit?: string;
  inputType?: "INPUT" | "SELECT";
  inputValues?: string[];
  usableUnits?: string[];
  groupNumber?: string;
};

export type CoupangNotice = {
  noticeCategoryName: string;
  noticeCategoryDetailName: string;
  content: string;
};

export type CoupangStoredNotice = Record<string, unknown> & {
  noticeCategoryName: string;
  noticeCategoryDetailName: string;
  content: string;
  required?: "MANDATORY" | "OPTIONAL";
  editable?: boolean;
  metadataManaged?: boolean;
};

export type CoupangCertification = {
  certificationType: string;
  certificationCode: string;
};

export type CoupangRequiredDocument = {
  templateName: string;
  documentPath?: string;
  vendorDocumentPath?: string;
};

export type CoupangProductSource = {
  id: number;
  name: string;
  sku: string | null;
  brand: string | null;
  manufacturer: string | null;
  modelNo: string | null;
  barcode: string | null;
  origin: string | null;
  description: string | null;
  salePrice: number | null;
  stock: number;
  images: Array<{
    imageUrl: string;
    sortOrder: number;
    isPrimary: boolean;
  }>;
  coupangSetting: CoupangSettingSource | null;
  marketplaceProducts: Array<{
    marketplace: string;
    status: string;
    marketplaceProductId: string | null;
  }>;
};

export type CoupangSettingSource = {
  displayCategoryCode: string | null;
  brandId: string | null;
  vendorUserId: string | null;
  deliveryMethod: string;
  deliveryCompanyCode: string | null;
  deliveryChargeType: string;
  deliveryCharge: number;
  freeShipOverAmount: number;
  deliveryChargeOnReturn: number | null;
  remoteAreaDeliverable: string;
  unionDeliveryType: string;
  returnCenterCode: string | null;
  returnChargeName: string | null;
  companyContactNumber: string | null;
  returnZipCode: string | null;
  returnAddress: string | null;
  returnAddressDetail: string | null;
  returnCharge: number | null;
  outboundShippingPlaceCode: string | null;
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
  attributes: unknown;
  notices: unknown;
  certifications: unknown;
  requiredDocuments: unknown;
};

export type CoupangProductPayload = {
  displayCategoryCode: number;
  sellerProductName: string;
  vendorId: string;
  saleStartedAt: string;
  saleEndedAt: string;
  displayProductName: string;
  brand: string;
  brandId?: string;
  generalProductName: string;
  deliveryMethod: string;
  deliveryCompanyCode: string;
  deliveryChargeType: string;
  deliveryCharge: number;
  freeShipOverAmount: number;
  deliveryChargeOnReturn: number;
  remoteAreaDeliverable: string;
  unionDeliveryType: string;
  returnCenterCode: string;
  returnChargeName: string;
  companyContactNumber: string;
  returnZipCode: string;
  returnAddress: string;
  returnAddressDetail: string;
  returnCharge: number;
  outboundShippingPlaceCode: number;
  vendorUserId: string;
  requested: false;
  items: Array<{
    itemName: string;
    originalPrice: number;
    salePrice: number;
    maximumBuyCount: number;
    maximumBuyForPerson: number;
    maximumBuyForPersonPeriod: number;
    outboundShippingTimeDay: number;
    unitCount: number;
    adultOnly: string;
    taxType: string;
    parallelImported: string;
    overseasPurchased: string;
    pccNeeded: boolean;
    externalVendorSku?: string;
    barcode?: string;
    emptyBarcode?: true;
    emptyBarcodeReason?: string;
    modelNo?: string;
    images: Array<{
      imageOrder: number;
      imageType: "REPRESENTATION" | "DETAIL";
      vendorPath: string;
    }>;
    notices: CoupangNotice[];
    attributes: CoupangAttribute[];
    certifications?: CoupangCertification[];
    contents: Array<{
      contentsType: "TEXT";
      contentDetails: Array<{ content: string; detailType: "TEXT" }>;
    }>;
  }>;
  requiredDocuments?: CoupangRequiredDocument[];
};

export type CoupangReadiness = MarketplaceReadiness & {
  liveEnabled: boolean;
  payloadSummary: {
    displayCategoryCode: string | null;
    itemCount: number;
    salePrice: number | null;
    stock: number;
    imageCount: number;
  };
};
