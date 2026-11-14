import {
  AdditionalCharge,
  FlatPricingSection,
  PricingState,
  SizeBasedPricingSection,
  SizeTierRow,
  TieredCharge,
  ThresholdCharge,
  FixedPriceCharge,
  PercentageCharge
} from '../models/pricing.model';

export function formatTitle(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function parseAdditionalCharges(rawCharges: Record<string, any>): AdditionalCharge[] {
  if (!rawCharges || typeof rawCharges !== 'object') {
    return [];
  }

  const result: AdditionalCharge[] = [];

  for (const [key, val] of Object.entries(rawCharges)) {
    if (!val || typeof val !== 'object') continue;

    const label = formatTitle(key);

    // 1. Threshold based (has 'over')
    if ('over' in val) {
      const charge: ThresholdCharge = {
        key,
        label,
        type: 'threshold',
        over: Number(val.over) || 0,
        every: val.every !== undefined ? Number(val.every) : undefined,
        price: val.price !== undefined ? val.price : 0
      };
      result.push(charge);
    }
    // 2. Tiered (has size_tier array)
    else if (Array.isArray(val.size_tier)) {
      const isPercentage = Array.isArray(val.percentage);
      const values = isPercentage ? [...val.percentage] : Array.isArray(val.price) ? [...val.price] : [];
      const charge: TieredCharge = {
        key,
        label,
        type: 'tiered',
        size_tier: [...val.size_tier],
        values,
        valueType: isPercentage ? 'percentage' : 'price'
      };
      result.push(charge);
    }
    // 3. Percentage only
    else if ('percentage' in val && !Array.isArray(val.percentage)) {
      const charge: PercentageCharge = {
        key,
        label,
        type: 'percentage',
        percentage: val.percentage
      };
      result.push(charge);
    }
    // 4. Fixed price
    else if ('price' in val && !Array.isArray(val.price)) {
      const charge: FixedPriceCharge = {
        key,
        label,
        type: 'fixed_price',
        price: val.price
      };
      result.push(charge);
    }
    // Fallback if another structure
    else {
      const charge: FixedPriceCharge = {
        key,
        label,
        type: 'fixed_price',
        price: (val as any).price ?? 0
      };
      result.push(charge);
    }
  }

  return result;
}

export function serializeAdditionalCharges(charges: AdditionalCharge[]): Record<string, any> {
  const result: Record<string, any> = {};

  for (const charge of charges) {
    if (charge.type === 'fixed_price') {
      result[charge.key] = {
        price: parseNumberOrKeep(charge.price)
      };
    } else if (charge.type === 'percentage') {
      result[charge.key] = {
        percentage: parseNumberOrKeep(charge.percentage)
      };
    } else if (charge.type === 'threshold') {
      const obj: any = {
        over: Number(charge.over),
        price: parseNumberOrKeep(charge.price)
      };
      if (charge.every !== undefined) {
        obj.every = Number(charge.every);
      }
      result[charge.key] = obj;
    } else if (charge.type === 'tiered') {
      const obj: any = {
        size_tier: charge.size_tier.map(parseNumberOrKeep)
      };
      if (charge.valueType === 'percentage') {
        obj.percentage = charge.values.map(parseNumberOrKeep);
      } else {
        obj.price = charge.values.map(parseNumberOrKeep);
      }
      result[charge.key] = obj;
    }
  }

  return result;
}

export function parsePricingJson(rawJson: any): PricingState {
  const root = rawJson?.data || rawJson;
  const categories = Object.keys(root || {});
  const catKey = categories[0] || 'embroidered_specials';
  const subCats = Object.keys(root[catKey] || {});
  const subCatKey = subCats[0] || 'rui';

  const sectionContainer = root?.[catKey]?.[subCatKey] || {};

  const flatSections: FlatPricingSection[] = [];
  const sizeBasedSections: SizeBasedPricingSection[] = [];
  let rootAdditionalCharges: AdditionalCharge[] = [];

  for (const [key, value] of Object.entries(sectionContainer)) {
    if (key === 'additional_charge') {
      rootAdditionalCharges = parseAdditionalCharges(value as Record<string, any>);
      continue;
    }

    const secVal = value as any;
    if (!secVal || typeof secVal !== 'object') continue;

    // Check if size_tier exists (Size-based)
    if (Array.isArray(secVal.size_tier)) {
      const sizeTiers: SizeTierRow[] = secVal.size_tier.map((st: any) => ({
        size: st.size,
        price: Array.isArray(st.price) ? [...st.price] : []
      }));

      const nestedCharges = secVal.additional_charge
        ? parseAdditionalCharges(secVal.additional_charge)
        : [];

      sizeBasedSections.push({
        id: key,
        title: key.toUpperCase(),
        item_tier: Array.isArray(secVal.item_tier) ? [...secVal.item_tier] : [],
        size_tier: sizeTiers,
        discount: Number(secVal.discount) || 0,
        additional_charge: nestedCharges
      });
    } else if (Array.isArray(secVal.price) && Array.isArray(secVal.item_tier)) {
      // Flat pricing section
      flatSections.push({
        id: key,
        title: key.toUpperCase(),
        item_tier: [...secVal.item_tier],
        price: [...secVal.price],
        discount: Number(secVal.discount) || 0
      });
    }
  }

  // Sort flat sections so DEFAULT is first if it exists, matching the screenshot
  flatSections.sort((a, b) => {
    if (a.id === 'default') return -1;
    if (b.id === 'default') return 1;
    return a.title.localeCompare(b.title);
  });

  return {
    rawCategoryPath: [catKey, subCatKey],
    flatSections,
    sizeBasedSections,
    rootAdditionalCharges
  };
}

export function serializePricingState(state: PricingState, originalJson?: any): any {
  const result: any = originalJson ? JSON.parse(JSON.stringify(originalJson)) : { data: {} };
  if (!result.data) result.data = {};

  const [catKey, subCatKey] = state.rawCategoryPath.length === 2
    ? state.rawCategoryPath
    : ['embroidered_specials', 'rui'];

  if (!result.data[catKey]) result.data[catKey] = {};
  result.data[catKey][subCatKey] = {};

  const subCatObj = result.data[catKey][subCatKey];

  // 1. Serialize flat sections
  for (const flat of state.flatSections) {
    subCatObj[flat.id] = {
      price: flat.price.map(parseNumberOrKeep),
      discount: Number(flat.discount) || 0,
      item_tier: flat.item_tier.map(parseNumberOrKeep)
    };
  }

  // 2. Serialize size-based sections
  for (const sb of state.sizeBasedSections) {
    const secObj: any = {
      discount: Number(sb.discount) || 0,
      item_tier: sb.item_tier.map(parseNumberOrKeep),
      size_tier: sb.size_tier.map((row) => ({
        size: parseNumberOrKeep(row.size),
        price: row.price.map(parseNumberOrKeep)
      }))
    };

    if (sb.additional_charge && sb.additional_charge.length > 0) {
      secObj.additional_charge = serializeAdditionalCharges(sb.additional_charge);
    }

    subCatObj[sb.id] = secObj;
  }

  // 3. Serialize root additional charges
  if (state.rootAdditionalCharges.length > 0) {
    subCatObj.additional_charge = serializeAdditionalCharges(state.rootAdditionalCharges);
  }

  return result;
}

export function parseNumberOrKeep(val: any): any {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return '';
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== '') {
      return num;
    }
    return trimmed;
  }
  return val;
}
