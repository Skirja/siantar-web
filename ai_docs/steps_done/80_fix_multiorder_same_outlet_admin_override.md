# Step 80: Fix Multi-Order 1 Resto + Admin Status Override

**Tanggal:** 2026-05-06
**Status:** COMPLETED ✅

## Masalah yang Diselesaikan

### Root Cause
Bug kritis di `DriverPanel.tsx` — route view pickup grouping hanya menggunakan `task.orders[0].status` untuk menentukan tombol yang tampil. Jika beberapa order dari outlet yang sama memiliki **status yang berbeda** (mix `processing` dan `going-to-store`), maka **tidak ada tombol yang tepat muncul** → driver tidak bisa update status → order stuck.

### Data Aktual yang Bermasalah (saat ditemukan)
- Driver "Achmada": 3 order dari `Balai Resto & Cafe` stuck di status `processing`
- Driver "Anshari": 2 order dari `Nava Food & Drink` dengan mix status

---

## Perubahan yang Dilakukan

### 1. `src/app/pages/driver/DriverPanel.tsx`
**Fix core bug: pickup grouping logic**
- Kalkulasi `processingOrders` dan `goingToStoreOrders` per outlet group di awal render
- Setiap order dalam grup kini tampil sebagai **card individual** dengan:
  - ID, nama customer, badge status (`🏪 Di Kedai` / `🚗 Menuju`)
  - Catatan customer (jika ada)
  - Tombol WhatsApp per order
  - Tombol **`✓ Ambil`** per order (hanya muncul jika order itu `going-to-store`)
- **Batch buttons** tetap tersedia:
  - `🚗 Menuju Toko (N)` — update semua order yang masih `processing` sekaligus
  - `✓ Ambil Semua (N)` — hanya muncul jika SEMUA order sudah `going-to-store`

### 2. `src/app/pages/admin/AdminPanel.tsx`
**A. Hapus batasan maks order per driver:**
- Hapus warning `"Maks 2 order aktif"` dari logika assign driver — driver kini bebas tanpa batas

**B. Tambah fitur "Update Status Manual" (Admin Override):**
- Import `OrderStatus` dan `updateOrderStatus` dari DataContext
- State baru: `adminOverrideOrderId`, `adminOverrideLoading`
- Handler `handleAdminStatusOverride()` menggunakan RPC `update_order_status` yang ada
- UI tombol ungu **`🛠️ Update Status Manual`** muncul di kartu order untuk semua status aktif dengan driver assigned (`driver_assigned`, `processing`, `going-to-store`, `picked-up`, `on-delivery`)
- Klik tombol → expand grid 2×2 dengan pilihan status: Ke Toko / Diambil / Diantar / Selesai
- Status saat ini di-disabled (tidak bisa diklik sendiri)
- Setelah update berhasil: toast notifikasi + panel collapse otomatis

---

## Verifikasi
- [x] **TypeScript:** 0 errors (`tsc --noEmit`)
- [x] **ESLint:** Clean (tidak ada warning/error)
- [x] **Build:** Berhasil dalam 11.24s (exit code 0)
