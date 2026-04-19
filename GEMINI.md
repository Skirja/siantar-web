# SiAntar Web - Project Overview

SiAntar Web is a localized delivery platform designed for food and goods delivery, primarily serving the Balai Riam area. It features a multi-role system supporting Customers, Admins, and Drivers, integrated with Supabase for real-time data and authentication.

## Tech Stack

- **Frontend:** React 18 (Vite), TypeScript, React Router 7.
- **State Management:** React Context (Auth, Data, Cart, Notification).
- **Styling:** Tailwind CSS, Radix UI, Material UI (MUI), Lucide Icons.
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **Utilities:** `date-fns`, `recharts`, `jspdf` (for invoices), `xlsx` (for finance exports).

## Architecture

- **Routing:** Uses `createHashRouter` for SPA navigation.
- **Authentication:**
  - **Admin/Driver:** Supabase Auth (Email/Password).
  - **Customer:** Simple Auth (Name/Phone) stored in `localStorage`.
- **Data Layer:** Centralized in `DataContext.tsx` which handles CRUD operations for outlets, products, orders, and settings.
- **Database Schema:** 10+ core tables including `outlets`, `products`, `orders`, `profiles`, `distance_matrix`, and `fee_settings`.
- **Real-time:** Primarily relies on periodic polling (e.g., 3s refresh in Order Tracking) and Supabase Realtime for specific updates.

## Key Directories

- `src/app/pages/`: Contains role-specific dashboards (customer, admin, driver).
- `src/app/contexts/`: Core state providers (Auth, Data, Cart, Notification).
- `src/app/components/`: Reusable UI components and complex modules (FinanceDashboard, InvoiceModal, etc.).
- `src/app/utils/`: Business logic, specifically `financeCalculations.ts` for delivery fees and commissions.
- `src/lib/`: Infrastructure setup (Supabase client, TypeScript types).
- `supabase/migrations/`: Database schema evolution and RPC functions.

## Building and Running

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```

### Code Quality
```bash
npm run typecheck # Run TypeScript compiler checks
npm run lint      # Run ESLint
```

## Development Conventions

- **Surgical Edits:** Prefer targeted changes to existing components.
- **Type Safety:** Always use types from `src/lib/database.types.ts` when interacting with the database.
- **Styling:** Use Tailwind CSS utility classes. For complex UI patterns, refer to existing Radix UI implementations in `src/app/components/ui/`.
- **Finance Logic:** Any changes to pricing, fees, or commissions must be implemented in `src/app/utils/financeCalculations.ts` to ensure consistency.
- **Notifications:** Use `NotificationContext` for in-app alerts and `sonner` for toast notifications.
- **Error Handling:** Wrap critical UI sections with `ErrorBoundary` and use `ErrorBoundaryUi`.

## Infrastructure Notes

- **Supabase:** The project uses a hardcoded anon key in `src/lib/supabase.ts` (Project Ref: `fstkhagjevbmobliuevo`).
- **Storage:** Proof of payments and profile photos are stored in Supabase Storage buckets.
- **RPC Functions:** Complex database operations (like completing orders or rejecting them) are handled via Supabase RPCs defined in `src/lib/database.types.ts`.
