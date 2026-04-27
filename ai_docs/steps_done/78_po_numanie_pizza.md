# 78 - Implementation: PO / POS Numanie Pizza (Admin Panel)

**Status:** COMPLETED ✅
**Date:** 2026-04-27
**Scope:** Implementation of a manual Pre-Order (PO) system for Numanie Pizza within the Admin Panel.

---

## 1. Database Layer (Supabase)

Implemented the storage layer for customers and orders specifically for Numanie Pizza:

- **Tabel `numanie_customers`**: Stores customer data (name, phone, village, last coordinates) with RLS enabled for Admin access.
- **Tabel `numanie_orders`**: Stores order history (items, finance breakdown, delivery info) linked to customers.
- **Triggers & Indexes**: Automated `updated_at` timestamps and optimized searching by phone/name.

## 2. Type Definitions

Updated the infrastructure types to support the new database schema:

- **File:** `src/lib/database.types.ts`
- **Changes:** Added `numanie_customers` and `numanie_orders` table definitions to the `Database` interface.

## 3. Business Logic (Finance)

Standardized the delivery fee calculation for Numanie Pizza using the existing zone system:

- **File:** `src/app/utils/financeCalculations.ts`
- **Logic:** Implemented `calculateNumanieFinance` which uses the standard 3-zone system (Hijau/Kuning/Merah) + `cost_per_km` from settings, without markups or admin cuts.

## 4. UI Components

Created a comprehensive POS-like interface for admins to handle manual orders:

- **File:** `src/app/components/PreOrderNumanie.tsx`
- **Features:**
    - **Step 1 (Cart):** Menu grid with 7 standard Numanie items + ability to add custom items.
    - **Step 2 (Customer):** Smart search for existing customers by phone/name with auto-fill.
    - **Step 3 (Location):** Integration with WhatsApp to request location pins and a coordinate-to-distance calculator.
    - **Step 4 (Invoice):** Visual invoice preview, automated WhatsApp message generation, and DB saving.
    - **Data Tab:** Table for managing Numanie customers.
    - **History Tab:** Filtering and cancellation of previous Numanie orders.

## 5. Admin Panel Integration

Integrated the new feature into the main admin dashboard:

- **File:** `src/app/pages/admin/AdminPanel.tsx`
- **Changes:**
    - Added `"pre-order"` to the active tab types.
    - Added "PO Numanie" to the sidebar navigation with the `Pizza` icon.
    - Implemented the conditional rendering for the `PreOrderNumanie` component.

---

**Summary of Files Created/Modified:**
- `src/lib/database.types.ts` (Modified)
- `src/app/utils/financeCalculations.ts` (Modified)
- `src/app/components/PreOrderNumanie.tsx` (Created)
- `src/app/pages/admin/AdminPanel.tsx` (Modified)
- Database: `numanie_customers`, `numanie_orders` (Created)
