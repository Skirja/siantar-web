# 03 - Deposit Driver, Ongkir Final, dan Settings Ongkir

**Tanggal:** 2026-04-01
**Scope:** Sistem deposit driver, display diskon ongkir, update ongkir matrix, settings ongkir per desa

---

## Perubahan yang Dilakukan

### 1. Sistem Deposit Saldo Driver
**Tujuan:** Driver harus punya deposit saldo agar tidak kabur dengan uang setoran. Admin potong komisi dari saldo deposit.

**Database:**
- Tambah kolom `balance integer NOT NULL DEFAULT 0` ke tabel `profiles`

**File:** `src/app/contexts/DataContext.tsx`
- Tambah fungsi `updateDriverBalance(driverId, amount)` — positive untuk top up, negative untuk potong
- Validasi saldo tidak boleh negatif
- Tambah `getDeliveryFee(fromVillage, toVillage)` — lookup fee dari distance_matrix
- Tambah `refreshDistanceMatrix` ke interface

**File:** `src/app/pages/driver/DriverPanel.tsx`
- Tampilkan kartu "Saldo Deposit" di dashboard (ganti kartu "Status")
- Jika saldo < Rp 30.000 → tampil merah dengan warning icon
- Tampilkan banner peringatan "Saldo Tidak Mencukupi" jika di bawah minimum
- Import ikon `AlertTriangle`

**File:** `src/app/components/DriverManagement.tsx`
- Tampilkan saldo driver di kartu driver (ganti kolom "Aktif")
- Tambah tombol "Top Up Saldo" per driver
- Modal Top Up: input jumlah, quick-select (50rb/100rb/200rb/500rb), preview saldo setelah top up
- Import `Wallet` icon, `formatCurrency`

**Aturan:**
- Deposit awal: Rp 100.000
- Minimum saldo: Rp 30.000
- Jika saldo < 30rb → warning di driver panel
- Admin potong komisi per delivery dari saldo deposit

### 2. Display Diskon Ongkir (> Rp 15.000)
**File:** `src/app/pages/customer/Checkout.tsx`
- Jika `deliveryFee > 15000`, tampilkan harga asli (coret) + harga diskon
- Harga asli dihitung: `Math.round(deliveryFee * 1.15 / 1000) * 1000` (dibulatkan ke ribuan terdekat, 15% lebih tinggi)

### 3. Ongkir Final Per Desa (Distance Matrix Baru)
**Database:**
- Tambah kolom `fee integer NOT NULL DEFAULT 0` ke tabel `distance_matrix`
- Hapus semua data lama (64 rows, 8 desa)
- Insert 36 rows baru (6 desa × 6 desa)

**Desa baru (6 desa):**
1. Desa Sekuningan Baru
2. Desa Bukit Sungkai
3. Desa Bangun Jaya
4. Desa Balai Riam (Pusat Kecamatan)
5. Desa Natai Kondang *(baru)*
6. Desa Lupu Peruca

*Desa yang dihapus: Air Dua, Jihing (Jihing Janga area), Pempaning*

**Matrix Ongkir Final:**
| Dari \ Ke | Sekuningan | Bukit Sungkai | Bangun Jaya | Balai Riam | Natai Kondang | Lupu Peruca |
|-----------|-----------|---------------|-------------|-----------|--------------|-------------|
| Sekuningan | 5.000 | 8.000 | 14.000 | 14.000 | 20.000 | 17.000 |
| Bukit Sungkai | 8.000 | 5.000 | 18.000 | 12.000 | 22.000 | 19.000 |
| Bangun Jaya | 14.000 | 18.000 | 5.000 | 12.000 | 13.000 | 16.000 |
| Balai Riam | 14.000 | 12.000 | 12.000 | 5.000 | 26.000 | 21.000 |
| Natai Kondang | 20.000 | 22.000 | 13.000 | 26.000 | 5.000 | 24.000 |
| Lupu Peruca | 17.000 | 19.000 | 16.000 | 21.000 | 24.000 | 5.000 |

**File yang diupdate VILLAGES constant:**
- `src/app/pages/customer/Checkout.tsx`
- `src/app/pages/customer/KirimBarang.tsx`
- `src/app/components/ManualOrderCreation.tsx`
- `src/app/pages/admin/AdminPanel.tsx`

**Logic perubahan ongkir:**
- `calculateOrderFinance()` sekarang accept parameter `directDeliveryFee` (opsional)
- Jika `directDeliveryFee` diberikan, gunakan langsung; jika tidak, hitung dari `distance × cost_per_km`
- Semua caller diupdate untuk pass `delivery_fee` dari `getDeliveryFee()` atau `order.delivery_fee`

### 4. Settings: Edit Ongkir Per Desa
**File:** `src/app/pages/admin/Settings.tsx`
- Tambah section "Ongkir Per Desa" di halaman Settings
- Tampilkan matrix ongkir dikelompokkan per desa asal
- Setiap rute bisa diedit (tombol edit → modal → input ongkir baru)
- Simpan perubahan langsung ke Supabase `distance_matrix.fee`
- Tambah import `MapPin`, `formatCurrency`

**File:** `src/lib/database.types.ts`
- Regenerate types: `profiles` punya `balance`, `distance_matrix` punya `fee`

---

## File yang Diubah

| File | Perubahan |
|------|-----------|
| `src/app/contexts/DataContext.tsx` | `getDeliveryFee`, `updateDriverBalance`, `refreshDistanceMatrix` |
| `src/app/utils/financeCalculations.ts` | `calculateOrderFinance` accept `directDeliveryFee` |
| `src/app/pages/driver/DriverPanel.tsx` | Saldo display, warning, use `getDeliveryFee` |
| `src/app/components/DriverManagement.tsx` | Saldo display, top up modal |
| `src/app/pages/customer/Checkout.tsx` | Diskon ongkir display, VILLAGES, use `getDeliveryFee` |
| `src/app/pages/customer/KirimBarang.tsx` | VILLAGES, use `getDeliveryFee` |
| `src/app/components/ManualOrderCreation.tsx` | VILLAGES, use `getDeliveryFee` |
| `src/app/pages/admin/AdminPanel.tsx` | VILLAGES |
| `src/app/pages/admin/Settings.tsx` | Section ongkir per desa dengan edit |
| `src/lib/database.types.ts` | `balance` di profiles, `fee` di distance_matrix |

## Database Migration

| Migration | Query |
|-----------|-------|
| `add_balance_to_profiles` | `ALTER TABLE profiles ADD COLUMN balance integer NOT NULL DEFAULT 0` |
| `add_fee_column_distance_matrix` | `ALTER TABLE distance_matrix ADD COLUMN fee integer NOT NULL DEFAULT 0` |
| Data update | DELETE all 64 rows, INSERT 36 rows with new fees |

## Build Status
Build berhasil tanpa error (15.40s)
