# UI Design System: Professional Financial ERP
## Document Path: `docs/ui/design-system.md`

This document establishes the UI design system tokens, typography scales, spacing units, and layout rules for the Cooperative Society ERP system, optimized for bilingual interfaces (Bangla/English).

---

## 1. Color Palette (HSL Tokens)

The system leverages a professional financial color palette, utilizing emerald-green accents (signifying growth, trust, and co-operative values) alongside clean greys.

### 1.1 Light Mode
*   **Background**: `hsl(210, 20%, 98%)` (Soft grey-blue canvas)
*   **Foreground (Text)**: `hsl(222.2, 84%, 4.9%)` (Deep navy-black)
*   **Primary (Brand Emerald)**: `hsl(142.1, 76.2%, 36.3%)`
*   **Primary Foreground**: `hsl(355.7, 100%, 97.3%)`
*   **Secondary (Subtle accents)**: `hsl(210, 40%, 96.1%)`
*   **Destructive (Warning/Error)**: `hsl(0, 84.2%, 60.2%)`
*   **Success (Deposit/Active)**: `hsl(142.1, 76.2%, 36.3%)`
*   **Warning (Suspended/Pending)**: `hsl(38, 92%, 50%)` (Amber)

### 1.2 Dark Mode
*   **Background**: `hsl(222.2, 84%, 4.9%)` (Deep slate)
*   **Foreground (Text)**: `hsl(210, 40%, 98%)` (Off-white)
*   **Primary (Brand Emerald)**: `hsl(142.1, 70%, 45%)`
*   **Border**: `hsl(217.2, 32.6%, 17.5%)`

---

## 2. Typography & Multilingual Setup

The ERP supports dual languages (**English** and **Bangla**). The styling variables map distinct font weights and line heights to ensure readability.

### 2.1 Font Families
*   **English Sans-Serif**: `Inter`, `system-ui`, `-apple-system` (High legibility for numeric tables).
*   **Bangla Unicode**: `Hind Siliguri`, `SolaimanLipi` (Ensures correct rendering of complex ligatures without overlaps).
*   **Monospace (Numbers)**: `JetBrains Mono`, `Courier New` (Enforces tabular alignment in financial logs).

### 2.2 Typography Scale

| Token Class | Font Size | Line Height | Font Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `h1` | `2.25rem (36px)` | `2.5rem` | Bold (700) | Dashboard Title, Main Headers |
| `h2` | `1.5rem (24px)` | `2.0rem` | SemiBold (600)| Module Sections, Card Titles |
| `body` | `0.875rem (14px)`| `1.25rem` | Regular (400)| Data fields, descriptions |
| `caption` | `0.75rem (12px)` | `1.0rem` | Medium (500) | Table Column Headers, Form Hints|
| `number` | `0.875rem (14px)`| `1.25rem` | Monospace (500)| Financial sums, transaction logs|

---

## 3. Spacing System (Tailwind Scale)

The spacing guidelines regulate padding and margins to maintain uniform density across ERP pages.
*   **Base Unit**: `4px` (`0.25rem` = `1 space unit` / `w-1` / `h-1`).
*   **Standard Padding Values**:
    *   Container Margin: `p-6 (24px)` or `p-8 (32px)` on desktop viewports.
    *   Card Inner Padding: `p-5 (20px)` or `p-6 (24px)`.
    *   Form Grid Gap: `gap-4 (16px)` vertically and `gap-6 (24px)` horizontally.

---

## 4. UI Primitives Specs

### 4.1 Tables (Data Grids)
*   **Header Style**: Background `hsl(210, 40%, 96.1%)` (Light grey), text `uppercase`, `tracking-wider`, font size `caption (12px)`.
*   **Row Spacing**: Height `48px`, border-bottom `1px solid border`. Hover state transitions to background `secondary` for better scannability.
*   **Financial Alignments**: Text columns containing names or codes align `Left`. Currency amounts align `Right` to make comparing figures easy.
*   **Status Badges**: Rounded pills with light-tint background matching status states (e.g. Suspended matches light amber, Active matches light emerald).

### 4.2 Forms
*   **Input Fields**: Height `40px` (2.5rem), border-radius `0.375rem (md)`, border `1px solid border`. On focus state, render `outline-none ring-2 ring-primary`.
*   **Labels**: Font size `caption`, color `muted-foreground`. Mandatory fields append a red asterisk (`*`).
*   **Bilingual Toggle**: Form layouts allow input fields in both languages or toggle input displays between English and Bangla character encodings.

### 4.3 Cards & Dashboard Widgets
*   **Shadow**: Box shadow `shadow-sm` in dashboard containers, using `shadow-md` for interactive dialog models.
*   **Border Radius**: Main containers use `rounded-lg (8px)` or `rounded-xl (12px)`.
*   **Metrics Widgets**:
    *   Grid: 3-column or 4-column cards containing a top title (e.g., "মোট সদস্য"), a prominent large number metric, and an icon badge.
    *   Trend Indicator: Bottom margin showing green/red text indicating changes (e.g., "+২.৫% গত মাস").
