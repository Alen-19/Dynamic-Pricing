# Dynamic Pricing Management UI (Angular 19)

A dynamic, scalable, and responsive **Pricing Management System** built with **Angular 19 (latest version)**, showcasing modern Angular features including **Angular Signals**, **Signal-driven form state management**, standalone components, and modern control flow (`@if`, `@for`).

Designed to faithfully match the layout, colors, and behavior shown in **`Dynamic Page ui.png`** while handling the rich, complex nested dataset in **`pricing.json`**.

---

## 🚀 Key Features & Implementation Highlights

### 1. 📊 Renders Real-World Structured Pricing Data
- Parses and transforms the nested JSON structure (`data.embroidered_specials.rui`).
- Renders **Flat Pricing Sections** (`DEFAULT`, `INSERTS`, `FANCY`, `HI_VIS`, `REFLECTIVE`, `FANCY_INSERTS`).
- Renders **Size-Based Pricing Tiers** (`FR` matrix of size rows vs item tier columns).
- Renders **Additional Charges** (Fixed prices, percentages, tiered surcharges, and threshold overcharges).
- Matches the initial collapsed/expanded state from the reference design:
  - `DEFAULT`: Expanded with `+ Add Column`, tier inputs, price inputs, and discount.
  - `INSERTS`: Collapsed (`+`).
  - `FR`: Collapsed (`+`).
  - `ADDITIONAL CHARGE`: Expanded with `Blunt Corners`, `Square Corners`, `Irregular Shape`, etc.

### 2. ⚡ Signal-Based Reactive State Management & Forms
- **Signal Store (`PricingService`)**:
  - `state = signal<PricingState>(...)`: Central reactive signal store for the complete pricing state.
  - `expandedSections = signal<Set<string>>(...)`: Reactive accordion expansion management.
  - `searchQuery = signal<string>('')`: Live search filter across sections and charges.
  - `computed()` signals for:
    - `flatSections`: Filtered flat pricing sections.
    - `sizeBasedSections`: Filtered size-based pricing sections.
    - `rootAdditionalCharges`: Filtered additional charges.
    - `stats`: Real-time aggregated stats (total columns, price points, active sections).
    - `serializedJson`: Real-time bidirectional serialization back to the exact original JSON schema.
    - `jsonString`: Formatted live JSON string.
    - `canUndo` / `canRedo`: State history status.
- **Instant Reactivity**: Every input change updates the signal state immediately using immutable `.update()` calls. No dirty polling or delayed change detection.
- **Undo / Redo Stack**: Built-in 30-step history stack powered by signals.

### 3. 🔄 Dynamic Table Functionality & Row Alignment
- **Dynamic Columns**:
  - Add new tier columns dynamically via `+ Add Column`.
  - Remove existing columns with the `×` button.
  - Guard ensures at least 1 column is preserved.
- **Strict Row Alignment (Size-Based Tiers)**:
  - In `FR`, every size row (Size 2.0, 2.5, 3.0, etc.) maintains an exact 1:1 price cell for each item tier column.
  - Adding a column automatically adds a corresponding price cell to **every single size row**.
  - Removing a column automatically removes that corresponding price from **every single size row**.
  - Consistent data alignment is guaranteed across all dimensions.
  - Supports adding/removing size rows (`+ Add Size Row`).

### 4. 🧩 Nested Pricing Structures & Edge Case Handling
- **Flat Pricing Arrays**: Array of tier thresholds paired with array of prices (`item_tier` + `price`).
- **Size-Based Pricing**: Array of sizes, each holding an array of prices corresponding to `item_tier`.
- **Additional Charges**:
  - **Fixed Price**: e.g., `Blunt Corners` ($0.14), `Square Corners` ($0.14), `Metallic Merrow` ($0.15).
  - **Percentage**: e.g., `Irregular Shape` (20%).
  - **Tier-Based Surcharges**: e.g., `Size Surcharge`, `Velcro One Side`, `Velcro Two Side`, `Pressure Sensitive` (supporting dynamic tier addition/removal).
  - **Threshold / Overcharges**: e.g., `Stitch Overcharge` (Over: 10,000, Every: 1,000, Price: 0.06), `Color Overcharge` (Over: 6, Price: 0.12).
- **Mixed Data Types**:
  - Transparently handles non-numeric string values found in production pricing data, such as `"dropout"`, `"n/a"`, and `"quote"`.

### 5. 🛠 Developer Experience & Tools
- **Live JSON Drawer**: Slide-over panel showing real-time serialized JSON, complete with:
  - Live syntax-highlighted code viewer.
  - **Copy JSON** to clipboard.
  - **Download JSON** (`pricing.json` / `pricing-updated.json`).
  - **Edit / Paste JSON**: Paste raw JSON and apply it directly into the reactive state.
- **Global Search & Filter**: Quickly filter sections or specific charges.
- **Category Filter Tabs**: View "All", "Flat Pricing", "Size-Based (FR)", or "Additional Charges".
- **Toast Notifications**: Signal-based unobtrusive feedback notifications.

---

## 📁 Project Structure

```
src/app/
├── components/
│   ├── header/                        # App header, search, actions, stats bar
│   ├── flat-pricing-table/             # Table for flat pricing (DEFAULT, INSERTS, etc.)
│   ├── size-based-pricing-table/       # 2D matrix for FR (sizes × item tiers)
│   ├── additional-charges/            # Charges (fixed, percentage, tiered, threshold)
│   ├── json-drawer/                   # Live JSON viewer, copy, download, import
│   └── toast/                         # Signal-driven notification toasts
├── data/
│   └── default-pricing.data.ts        # Embedded initial pricing dataset
├── models/
│   └── pricing.model.ts               # Clean TypeScript interfaces & union types
├── services/
│   ├── pricing.service.ts             # Signal-based centralized store & operations
│   └── toast.service.ts               # Notification service
├── utils/
│   ├── pricing-transformer.util.ts    # JSON ↔ Signal State bidirectional transforms
│   └── pricing.test.ts                # Integration test suite for validation
├── app.component.ts                   # Root orchestrator component
├── app.component.html                 # Main layout template
└── app.component.css                  # Layout styling
```

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Server
Run the local dev server:
```bash
npm start
```
Navigate to `http://localhost:4200/`.

### 3. Production Build
Compile the application with Angular CLI:
```bash
npm run build
```
Production output will be generated in `dist/dynamic-pricing-app/browser`.
