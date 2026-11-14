import { DEFAULT_PRICING_JSON } from '../data/default-pricing.data';
import { parsePricingJson, serializePricingState } from './pricing-transformer.util';

console.log('--- RUNNING PRICING INTEGRATION TESTS ---');

// 1. Parse JSON
const state = parsePricingJson(DEFAULT_PRICING_JSON);
console.log('Flat sections count:', state.flatSections.length);
console.log('Size-based sections count:', state.sizeBasedSections.length);
console.log('Root additional charges count:', state.rootAdditionalCharges.length);

if (state.flatSections.length !== 6) {
  throw new Error(`Expected 6 flat sections, got ${state.flatSections.length}`);
}
if (state.sizeBasedSections.length !== 1) {
  throw new Error(`Expected 1 size-based section (FR), got ${state.sizeBasedSections.length}`);
}
if (state.rootAdditionalCharges.length !== 13) {
  throw new Error(`Expected 13 root additional charges, got ${state.rootAdditionalCharges.length}`);
}

// 2. Test FR alignment
const fr = state.sizeBasedSections[0];
const initialColCount = fr.item_tier.length;
console.log('FR initial item_tier count:', initialColCount);
for (const row of fr.size_tier) {
  if (row.price.length !== initialColCount) {
    throw new Error(`Row size ${row.size} has price length ${row.price.length}, expected ${initialColCount}`);
  }
}
console.log('✓ All FR size rows perfectly aligned with item_tier columns');

// 3. Test roundtrip serialization
const serialized = serializePricingState(state, DEFAULT_PRICING_JSON);
const subCat = serialized.data.embroidered_specials.rui;
if (!subCat.default || !subCat.fr || !subCat.additional_charge) {
  throw new Error('Roundtrip serialization missing core keys');
}
console.log('✓ Roundtrip serialization validated');

// 4. Test Mixed data types
const reflective = state.flatSections.find(s => s.id === 'reflective');
if (!reflective || reflective.price[0] !== 'n/a' || reflective.price[reflective.price.length - 1] !== 'dropout') {
  throw new Error('Mixed string data types ("n/a", "dropout") in reflective section failed');
}
console.log('✓ Mixed string data types preserved correctly ("n/a", "dropout")');

// 5. Test Tiered additional charges with strings
const sizeCharge = state.rootAdditionalCharges.find(c => c.key === 'size') as any;
if (!sizeCharge || sizeCharge.values[sizeCharge.values.length - 1] !== 'quote') {
  throw new Error('Tiered charge string value ("quote") failed');
}
console.log('✓ Tiered additional charge string ("quote") preserved correctly');

console.log('--- ALL INTEGRATION TESTS PASSED ---');
