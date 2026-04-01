# 02 - Revisi dan Penambahan Fitur (Bug Fix & Enhancement)

**Tanggal:** 2026-03-31
**Scope:** 9 perbaikan dan penambahan fitur berdasarkan feedback

---

## Perubahan yang Dilakukan

### 1. Fix: Harga input dimulai dari 0
**File:** `src/app/pages/admin/OutletMenuManagement.tsx`
- Masalah: `type="number"` dengan `value={0}` menyebabkan input menampilkan "0" dan user mengetik setelahnya jadi "01500"
- Fix: Semua input harga (`price`, `discount_price`, `variantForm.price_adjustment`, `extraForm.price`) diubah agar menampilkan string kosong saat value = 0

### 2. Tambah: Fitur hapus Driver
**File:** `src/app/contexts/DataContext.tsx`
- Tambah fungsi `deleteDriver(id)` yang menghapus data driver dari tabel `profiles`
- Tambah `deleteDriver` ke interface `DataContextType` dan Provider value

**File:** `src/app/components/DriverManagement.tsx`
- Tambah tombol hapus (ikon tong sampah) di kartu driver
- Tambah handler `handleDeleteDriver` dengan konfirmasi sebelum hapus
- Tambah state `deleting` untuk loading indicator

### 3. Fix: Tombol Extra tidak berfungsi saat tambah menu
**File:** `src/app/pages/admin/OutletMenuManagement.tsx`
- Masalah: `handleAddExtra` validasi `!extraForm.name || !extraForm.price` — karena `extraForm.price` dimulai dari 0 (falsy), fungsi langsung return tanpa menambah extra
- Fix: Hapus validasi `!extraForm.price`, cukup validasi `!extraForm.name`

### 4. Tambah: Tampilkan kredensial/akun driver
**Database:** Tambah kolom `email` ke tabel `profiles` via migration

**File:** `src/lib/database.types.ts`
- Regenerate types untuk include kolom `email: string | null` di profiles

**File:** `src/app/contexts/DataContext.tsx`
- Update `addDriver` untuk menyimpan email ke tabel `profiles` setelah user dibuat
- Return `{ email, password }` dari fungsi `addDriver`

**File:** `src/app/components/DriverManagement.tsx`
- Tampilkan email driver di kartu driver (dengan tombol copy)
- Tambah toggle show/hide password untuk kredensial yang baru dibuat
- Import ikon `Mail`, `Eye`, `EyeOff`

### 5. Fix: Ongkir Rp 5000 untuk sesama desa
**File:** `src/app/pages/customer/Checkout.tsx`
- Jika `village === outlet.village`, set `distance = 2.5` (2.5 × 2000 = 5000)
- Update info box untuk tampilkan "Ongkir sesama desa: Rp 5.000"

**File:** `src/app/pages/customer/KirimBarang.tsx`
- Hapus validasi yang mencegah pengiriman sesama desa
- Jika `fromVillage === toVillage`, set `distance = 2.5`
- Update display jarak untuk tampilkan "Sesama Desa"

### 6. Fix: Invoice outlet kurangi admin fee
**Status:** Sudah benar di kode existing
- Invoice outlet sudah menampilkan `subtotal - admin_fee` sebagai total
- Invoice customer menampilkan `total` (subtotal + service_fee + delivery_fee) tanpa pengurangan admin_fee

### 7. Tambah: Quantity counter pada tombol +
**File:** `src/app/pages/customer/StoreDetail.tsx`
- Tambah fungsi `getProductCartQuantity()` untuk hitung jumlah item per produk di keranjang (berdasarkan productId + variant + extras yang sama)
- Tampilkan badge merah dengan angka di pojok kanan atas tombol +
- Tampilkan text "Nx" di bawah tombol jika quantity > 0

### 8. Ubah: Kategori jadi 20 kategori spesifik
**Database Migration:**
- Update CHECK constraint pada `products.category` untuk izinkan 20 kategori baru (tetap backward compatible dengan 'Makanan' dan 'Minuman' lama)
- Update CHECK constraint pada `outlets.category` untuk izinkan 20 kategori baru
- Update data existing outlets: 'food' → 'Bakso & Mie Ayam', 'drink' → 'Minuman Dingin', 'package' → 'Catering / Nasi Box'

**Daftar 20 Kategori:**
| Kelompok | Kategori |
|----------|----------|
| Makanan Utama | Bakso & Mie Ayam, Nasi Goreng & Mie Goreng, Ayam Bakar & Ayam Goreng, Bebek & Ikan, Seafood, Soto & Sop, Pecel Lele / Lalapan, Rice Bowl & Nasi Kotak, Sate & Grill, Martabak & Terang Bulan |
| Snack & Jajanan | Snack & Camilan, Gorengan, Cilok Bakso Bakar & Jajanan, Kue & Dessert, Roti & Bakery |
| Minuman | Minuman Dingin, Kopi & Teh, Jus & Minuman Buah, Es Campur / Es Tradisional |
| Lainnya | Frozen Food, Catering / Nasi Box |

**File:** `src/app/pages/admin/OutletMenuManagement.tsx`
- Update dropdown kategori produk dengan 20 opsi yang dikelompokkan (`optgroup`)

**File:** `src/app/pages/admin/AdminPanel.tsx`
- Update dropdown kategori outlet dengan 20 opsi yang dikelompokkan
- Update default category dari "food" ke "Bakso & Mie Ayam"
- Hapus type cast `as "food" | "drink" | "package"` → gunakan `string`

**File:** `src/app/components/ManualOrderCreation.tsx`
- Update display kategori outlet dari switch-case ke langsung tampilkan nama kategori

### 9. Tambah: Produk dikelompokkan per kategori sebagai tab
**File:** `src/app/pages/customer/StoreDetail.tsx`
- Tambah state `activeCategory` untuk filter kategori
- Hitung `categories` (unique categories dari produk outlet)
- Filter produk berdasarkan `activeCategory`
- Tampilkan tab horizontal: "Semua" + satu tab per kategori yang ada
- Tab menggunakan pill/badge style (rounded-full) dengan scroll horizontal
- Update empty state untuk tampilkan pesan yang sesuai saat filter kosong

---

## File yang Diubah

| File | Perubahan |
|------|-----------|
| `src/app/pages/admin/OutletMenuManagement.tsx` | Fix 1, 3, 8 |
| `src/app/contexts/DataContext.tsx` | Fix 2, 4 |
| `src/app/components/DriverManagement.tsx` | Fix 2, 4 |
| `src/app/pages/customer/Checkout.tsx` | Fix 5 |
| `src/app/pages/customer/KirimBarang.tsx` | Fix 5 |
| `src/app/pages/customer/StoreDetail.tsx` | Fix 7, 9 |
| `src/app/pages/admin/AdminPanel.tsx` | Fix 8 |
| `src/app/components/ManualOrderCreation.tsx` | Fix 8 |
| `src/lib/database.types.ts` | Fix 4 |

## Database Migration

| Migration | Query |
|-----------|-------|
| `add_email_to_profiles` | `ALTER TABLE profiles ADD COLUMN email text` |
| `update_product_categories_constraint_v2` | Update CHECK constraint `products_category_check` |
| `update_outlet_categories_constraint` | Drop old + add new `outlets_category_check` |

## Build Status
Build berhasil tanpa error (18.98s)
