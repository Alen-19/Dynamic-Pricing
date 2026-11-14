import { Injectable, computed, signal } from '@angular/core';
import { DEFAULT_PRICING_JSON } from '../data/default-pricing.data';
import {
  AdditionalCharge,
  FlatPricingSection,
  PricingState,
  SizeBasedPricingSection,
  TieredCharge
} from '../models/pricing.model';
import {
  parsePricingJson,
  serializePricingState
} from '../utils/pricing-transformer.util';

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  private rawOriginalJson: any = JSON.parse(JSON.stringify(DEFAULT_PRICING_JSON));

  // Main signal state
  readonly state = signal<PricingState>(parsePricingJson(this.rawOriginalJson));

  // Expanded accordion sections signal: DEFAULT and ADDITIONAL CHARGE open by default, as in screenshot
  readonly expandedSections = signal<Set<string>>(
    new Set<string>(['default', 'additional_charge'])
  );

  // Search filter query
  readonly searchQuery = signal<string>('');

  // Undo / Redo history
  private readonly history = signal<PricingState[]>([]);
  private readonly historyIndex = signal<number>(-1);

  // Computed signals
  readonly flatSections = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sections = this.state().flatSections;
    if (!q) return sections;
    return sections.filter((s) =>
      s.title.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  });

  readonly sizeBasedSections = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sections = this.state().sizeBasedSections;
    if (!q) return sections;
    return sections.filter((s) =>
      s.title.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  });

  readonly rootAdditionalCharges = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const charges = this.state().rootAdditionalCharges;
    if (!q) return charges;
    return charges.filter(
      (c) =>
        c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q)
    );
  });

  readonly serializedJson = computed(() => {
    return serializePricingState(this.state(), this.rawOriginalJson);
  });

  readonly jsonString = computed(() => {
    return JSON.stringify(this.serializedJson(), null, 2);
  });

  readonly stats = computed(() => {
    const s = this.state();
    let totalCols = 0;
    let totalPriceCells = 0;

    for (const f of s.flatSections) {
      totalCols += f.item_tier.length;
      totalPriceCells += f.price.length;
    }

    for (const sb of s.sizeBasedSections) {
      totalCols += sb.item_tier.length;
      for (const row of sb.size_tier) {
        totalPriceCells += row.price.length;
      }
    }

    const totalCharges = s.rootAdditionalCharges.length;

    return {
      flatSectionsCount: s.flatSections.length,
      sizeBasedSectionsCount: s.sizeBasedSections.length,
      totalColumns: totalCols,
      totalPricePoints: totalPriceCells,
      totalAdditionalCharges: totalCharges
    };
  });

  readonly canUndo = computed(() => this.historyIndex() > 0);
  readonly canRedo = computed(
    () => this.historyIndex() < this.history().length - 1
  );

  constructor() {
    this.pushHistory(this.state());
  }

  // --- Accordion Controls ---
  isSectionExpanded(id: string): boolean {
    return this.expandedSections().has(id);
  }

  toggleSection(id: string): void {
    this.expandedSections.update((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  expandAll(): void {
    const all = new Set<string>();
    for (const f of this.state().flatSections) all.add(f.id);
    for (const s of this.state().sizeBasedSections) all.add(s.id);
    all.add('additional_charge');
    this.expandedSections.set(all);
  }

  collapseAll(): void {
    this.expandedSections.set(new Set<string>());
  }

  // --- History (Undo/Redo) ---
  private pushHistory(state: PricingState): void {
    const currentHist = this.history().slice(0, this.historyIndex() + 1);
    const cloned = JSON.parse(JSON.stringify(state));
    const nextHist = [...currentHist, cloned];
    // Keep max 30 items
    if (nextHist.length > 30) nextHist.shift();
    this.history.set(nextHist);
    this.historyIndex.set(nextHist.length - 1);
  }

  undo(): void {
    if (this.canUndo()) {
      const nextIdx = this.historyIndex() - 1;
      this.historyIndex.set(nextIdx);
      const snapshot = JSON.parse(JSON.stringify(this.history()[nextIdx]));
      this.state.set(snapshot);
    }
  }

  redo(): void {
    if (this.canRedo()) {
      const nextIdx = this.historyIndex() + 1;
      this.historyIndex.set(nextIdx);
      const snapshot = JSON.parse(JSON.stringify(this.history()[nextIdx]));
      this.state.set(snapshot);
    }
  }

  // --- Flat Pricing Operations ---
  updateFlatTier(sectionId: string, colIndex: number, newTierVal: any): void {
    this.state.update((s) => {
      const nextFlat = s.flatSections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const nextItemTier = [...sec.item_tier];
        nextItemTier[colIndex] = newTierVal;
        return { ...sec, item_tier: nextItemTier };
      });
      const nextState = { ...s, flatSections: nextFlat };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  updateFlatPrice(sectionId: string, colIndex: number, newPriceVal: any): void {
    this.state.update((s) => {
      const nextFlat = s.flatSections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const nextPrices = [...sec.price];
        nextPrices[colIndex] = newPriceVal;
        return { ...sec, price: nextPrices };
      });
      const nextState = { ...s, flatSections: nextFlat };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  updateFlatDiscount(sectionId: string, newDiscount: number): void {
    this.state.update((s) => {
      const nextFlat = s.flatSections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return { ...sec, discount: newDiscount };
      });
      const nextState = { ...s, flatSections: nextFlat };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  addFlatColumn(sectionId: string): void {
    this.state.update((s) => {
      const nextFlat = s.flatSections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const lastTier = Number(sec.item_tier[sec.item_tier.length - 1]) || 0;
        const nextTier = lastTier > 0 ? (lastTier >= 1000 ? lastTier + 1000 : lastTier * 2) : 10;
        const lastPrice = sec.price.length > 0 ? sec.price[sec.price.length - 1] : 1.0;
        return {
          ...sec,
          item_tier: [...sec.item_tier, nextTier],
          price: [...sec.price, lastPrice]
        };
      });
      const nextState = { ...s, flatSections: nextFlat };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  removeFlatColumn(sectionId: string, colIndex: number): void {
    this.state.update((s) => {
      const nextFlat = s.flatSections.map((sec) => {
        if (sec.id !== sectionId || sec.item_tier.length <= 1) return sec;
        const nextItemTier = sec.item_tier.filter((_, idx) => idx !== colIndex);
        const nextPrices = sec.price.filter((_, idx) => idx !== colIndex);
        return {
          ...sec,
          item_tier: nextItemTier,
          price: nextPrices
        };
      });
      const nextState = { ...s, flatSections: nextFlat };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  // --- Size-Based (FR) Operations ---
  updateSizeBasedTier(sectionId: string, colIndex: number, newTierVal: any): void {
    this.state.update((s) => {
      const nextSb = s.sizeBasedSections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const nextItemTier = [...sec.item_tier];
        nextItemTier[colIndex] = newTierVal;
        return { ...sec, item_tier: nextItemTier };
      });
      const nextState = { ...s, sizeBasedSections: nextSb };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  updateSizeBasedPrice(
    sectionId: string,
    rowIndex: number,
    colIndex: number,
    newPriceVal: any
  ): void {
    this.state.update((s) => {
      const nextSb = s.sizeBasedSections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const nextSizeTier = sec.size_tier.map((row, rIdx) => {
          if (rIdx !== rowIndex) return row;
          const nextRowPrices = [...row.price];
          nextRowPrices[colIndex] = newPriceVal;
          return { ...row, price: nextRowPrices };
        });
        return { ...sec, size_tier: nextSizeTier };
      });
      const nextState = { ...s, sizeBasedSections: nextSb };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  updateSizeValue(sectionId: string, rowIndex: number, newSize: any): void {
    this.state.update((s) => {
      const nextSb = s.sizeBasedSections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const nextSizeTier = sec.size_tier.map((row, rIdx) => {
          if (rIdx !== rowIndex) return row;
          return { ...row, size: newSize };
        });
        return { ...sec, size_tier: nextSizeTier };
      });
      const nextState = { ...s, sizeBasedSections: nextSb };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  updateSizeBasedDiscount(sectionId: string, newDiscount: number): void {
    this.state.update((s) => {
      const nextSb = s.sizeBasedSections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return { ...sec, discount: newDiscount };
      });
      const nextState = { ...s, sizeBasedSections: nextSb };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  addSizeBasedColumn(sectionId: string): void {
    this.state.update((s) => {
      const nextSb = s.sizeBasedSections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const lastTier = Number(sec.item_tier[sec.item_tier.length - 1]) || 0;
        const nextTier = lastTier > 0 ? lastTier + 1000 : 10;

        // Add a price to every size tier row to maintain strict column alignment
        const nextSizeTier = sec.size_tier.map((row) => {
          const lastPrice = row.price.length > 0 ? row.price[row.price.length - 1] : 1.0;
          return {
            ...row,
            price: [...row.price, lastPrice]
          };
        });

        return {
          ...sec,
          item_tier: [...sec.item_tier, nextTier],
          size_tier: nextSizeTier
        };
      });
      const nextState = { ...s, sizeBasedSections: nextSb };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  removeSizeBasedColumn(sectionId: string, colIndex: number): void {
    this.state.update((s) => {
      const nextSb = s.sizeBasedSections.map((sec) => {
        if (sec.id !== sectionId || sec.item_tier.length <= 1) return sec;
        const nextItemTier = sec.item_tier.filter((_, idx) => idx !== colIndex);

        // Remove the price from every size tier row to maintain alignment
        const nextSizeTier = sec.size_tier.map((row) => ({
          ...row,
          price: row.price.filter((_, idx) => idx !== colIndex)
        }));

        return {
          ...sec,
          item_tier: nextItemTier,
          size_tier: nextSizeTier
        };
      });
      const nextState = { ...s, sizeBasedSections: nextSb };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  addSizeRow(sectionId: string): void {
    this.state.update((s) => {
      const nextSb = s.sizeBasedSections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const lastRow = sec.size_tier[sec.size_tier.length - 1];
        const nextSize = lastRow ? Number(lastRow.size) + 0.5 : 1.0;
        // Price array initialized to exact length of item_tier
        const defaultPrices = lastRow
          ? [...lastRow.price]
          : new Array(sec.item_tier.length).fill(1.0);

        return {
          ...sec,
          size_tier: [
            ...sec.size_tier,
            { size: nextSize, price: defaultPrices }
          ]
        };
      });
      const nextState = { ...s, sizeBasedSections: nextSb };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  removeSizeRow(sectionId: string, rowIndex: number): void {
    this.state.update((s) => {
      const nextSb = s.sizeBasedSections.map((sec) => {
        if (sec.id !== sectionId || sec.size_tier.length <= 1) return sec;
        return {
          ...sec,
          size_tier: sec.size_tier.filter((_, idx) => idx !== rowIndex)
        };
      });
      const nextState = { ...s, sizeBasedSections: nextSb };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  // --- Root Additional Charges Operations ---
  updateRootAdditionalCharge(key: string, field: string, value: any): void {
    this.state.update((s) => {
      const nextCharges = s.rootAdditionalCharges.map((ch) => {
        if (ch.key !== key) return ch;
        return { ...ch, [field]: value } as AdditionalCharge;
      });
      const nextState = { ...s, rootAdditionalCharges: nextCharges };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  updateRootTieredCharge(
    key: string,
    tierIndex: number,
    tierVal: any,
    valVal: any
  ): void {
    this.state.update((s) => {
      const nextCharges = s.rootAdditionalCharges.map((ch) => {
        if (ch.key !== key || ch.type !== 'tiered') return ch;
        const tiered = ch as TieredCharge;
        const nextTiers = [...tiered.size_tier];
        const nextValues = [...tiered.values];
        nextTiers[tierIndex] = tierVal;
        nextValues[tierIndex] = valVal;
        return {
          ...tiered,
          size_tier: nextTiers,
          values: nextValues
        };
      });
      const nextState = { ...s, rootAdditionalCharges: nextCharges };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  addTierToRootCharge(key: string): void {
    this.state.update((s) => {
      const nextCharges = s.rootAdditionalCharges.map((ch) => {
        if (ch.key !== key || ch.type !== 'tiered') return ch;
        const tiered = ch as TieredCharge;
        const lastTier = Number(tiered.size_tier[tiered.size_tier.length - 1]) || 10;
        const nextTier = lastTier + 10;
        const lastVal = tiered.values.length > 0 ? tiered.values[tiered.values.length - 1] : 0;
        return {
          ...tiered,
          size_tier: [...tiered.size_tier, nextTier],
          values: [...tiered.values, lastVal]
        };
      });
      const nextState = { ...s, rootAdditionalCharges: nextCharges };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  removeTierFromRootCharge(key: string, tierIndex: number): void {
    this.state.update((s) => {
      const nextCharges = s.rootAdditionalCharges.map((ch) => {
        if (ch.key !== key || ch.type !== 'tiered' || ch.size_tier.length <= 1) return ch;
        const tiered = ch as TieredCharge;
        return {
          ...tiered,
          size_tier: tiered.size_tier.filter((_, idx) => idx !== tierIndex),
          values: tiered.values.filter((_, idx) => idx !== tierIndex)
        };
      });
      const nextState = { ...s, rootAdditionalCharges: nextCharges };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  // --- Nested (inside FR) Additional Charges Operations ---
  updateNestedAdditionalCharge(
    sectionId: string,
    key: string,
    field: string,
    value: any
  ): void {
    this.state.update((s) => {
      const nextSb = s.sizeBasedSections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const nextCharges = sec.additional_charge.map((ch) => {
          if (ch.key !== key) return ch;
          return { ...ch, [field]: value } as AdditionalCharge;
        });
        return { ...sec, additional_charge: nextCharges };
      });
      const nextState = { ...s, sizeBasedSections: nextSb };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  updateNestedTieredCharge(
    sectionId: string,
    key: string,
    tierIndex: number,
    tierVal: any,
    valVal: any
  ): void {
    this.state.update((s) => {
      const nextSb = s.sizeBasedSections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const nextCharges = sec.additional_charge.map((ch) => {
          if (ch.key !== key || ch.type !== 'tiered') return ch;
          const tiered = ch as TieredCharge;
          const nextTiers = [...tiered.size_tier];
          const nextValues = [...tiered.values];
          nextTiers[tierIndex] = tierVal;
          nextValues[tierIndex] = valVal;
          return {
            ...tiered,
            size_tier: nextTiers,
            values: nextValues
          };
        });
        return { ...sec, additional_charge: nextCharges };
      });
      const nextState = { ...s, sizeBasedSections: nextSb };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  addTierToNestedCharge(sectionId: string, key: string): void {
    this.state.update((s) => {
      const nextSb = s.sizeBasedSections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const nextCharges = sec.additional_charge.map((ch) => {
          if (ch.key !== key || ch.type !== 'tiered') return ch;
          const tiered = ch as TieredCharge;
          const lastTier = Number(tiered.size_tier[tiered.size_tier.length - 1]) || 10;
          const nextTier = lastTier + 10;
          const lastVal = tiered.values.length > 0 ? tiered.values[tiered.values.length - 1] : 0;
          return {
            ...tiered,
            size_tier: [...tiered.size_tier, nextTier],
            values: [...tiered.values, lastVal]
          };
        });
        return { ...sec, additional_charge: nextCharges };
      });
      const nextState = { ...s, sizeBasedSections: nextSb };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  removeTierFromNestedCharge(
    sectionId: string,
    key: string,
    tierIndex: number
  ): void {
    this.state.update((s) => {
      const nextSb = s.sizeBasedSections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const nextCharges = sec.additional_charge.map((ch) => {
          if (ch.key !== key || ch.type !== 'tiered' || ch.size_tier.length <= 1) return ch;
          const tiered = ch as TieredCharge;
          return {
            ...tiered,
            size_tier: tiered.size_tier.filter((_, idx) => idx !== tierIndex),
            values: tiered.values.filter((_, idx) => idx !== tierIndex)
          };
        });
        return { ...sec, additional_charge: nextCharges };
      });
      const nextState = { ...s, sizeBasedSections: nextSb };
      this.pushHistory(nextState);
      return nextState;
    });
  }

  // --- Reset & Import/Export ---
  resetToDefault(): void {
    this.rawOriginalJson = JSON.parse(JSON.stringify(DEFAULT_PRICING_JSON));
    const defaultState = parsePricingJson(this.rawOriginalJson);
    this.state.set(defaultState);
    this.history.set([JSON.parse(JSON.stringify(defaultState))]);
    this.historyIndex.set(0);
  }

  loadFromJson(newJson: any): boolean {
    try {
      this.rawOriginalJson = JSON.parse(JSON.stringify(newJson));
      const parsedState = parsePricingJson(this.rawOriginalJson);
      this.state.set(parsedState);
      this.pushHistory(parsedState);
      return true;
    } catch (err) {
      console.error('Failed to parse and load JSON', err);
      return false;
    }
  }
}
