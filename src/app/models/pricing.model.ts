export type AdditionalChargeType = 'fixed_price' | 'percentage' | 'tiered' | 'threshold';

export interface BaseAdditionalCharge {
  key: string;
  label: string;
  type: AdditionalChargeType;
}

export interface FixedPriceCharge extends BaseAdditionalCharge {
  type: 'fixed_price';
  price: number | string;
}

export interface PercentageCharge extends BaseAdditionalCharge {
  type: 'percentage';
  percentage: number | string;
}

export interface TieredCharge extends BaseAdditionalCharge {
  type: 'tiered';
  size_tier: (number | string)[];
  values: (number | string)[];
  valueType: 'price' | 'percentage';
}

export interface ThresholdCharge extends BaseAdditionalCharge {
  type: 'threshold';
  over: number;
  every?: number;
  price: number | string;
}

export type AdditionalCharge =
  | FixedPriceCharge
  | PercentageCharge
  | TieredCharge
  | ThresholdCharge;

export interface FlatPricingSection {
  id: string;
  title: string;
  item_tier: (number | string)[];
  price: (number | string)[];
  discount: number;
}

export interface SizeTierRow {
  size: number | string;
  price: (number | string)[];
}

export interface SizeBasedPricingSection {
  id: string;
  title: string;
  item_tier: (number | string)[];
  size_tier: SizeTierRow[];
  discount: number;
  additional_charge: AdditionalCharge[];
}

export interface PricingState {
  rawCategoryPath: string[]; // ['embroidered_specials', 'rui']
  flatSections: FlatPricingSection[];
  sizeBasedSections: SizeBasedPricingSection[];
  rootAdditionalCharges: AdditionalCharge[];
}

export interface PricingRawJson {
  data: {
    [category: string]: {
      [subCategory: string]: {
        [sectionKey: string]: any;
      };
    };
  };
}
