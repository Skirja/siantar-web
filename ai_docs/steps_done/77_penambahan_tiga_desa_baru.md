# 77 - Penambahan Tiga Desa Baru (Air Dua, Jihing, Semantun)

**Tanggal:** 2026-04-22
**Scope:** Perluasan cakupan desa pengantaran dengan menambahkan 3 desa baru ke sistem
**Status:** **COMPLETED** ✅

---

## Masalah yang Diselesaikan

Sistem SiAntar sebelumnya hanya memiliki 7 desa dalam area pengantaran Balai Riam. Diperlukan penambahan 3 desa baru:
- Desa Air Dua
- Desa Jihing
- Desa Semantun

Ketiga desa ini dimasukkan ke **WILAYAH 2 (JAUH)** berdasarkan jarak operasional.

---

## Perubahan yang Dilakukan

### 1. Analisis Kodebase & Database
Melakukan investigasi menyeluruh menggunakan grep dan SQL queries untuk mengidentifikasi semua titik referensi:

**File Frontend dengan VILLAGE_GROUPS Hardcoded (4 file):**
- `src/app/pages/customer/Checkout.tsx` — L19-27
- `src/app/pages/customer/KirimBarang.tsx` — L32-40
- `src/app/components/ManualOrderCreation.tsx` — L33-41
- `src/app/pages/admin/AdminPanel.tsx` — L65-73 + WILAYAH_1/WILAYAH_2 (L75-83)

**Database Check:**
- Tabel `orders.customer_village` & `outlets.village` — tipe TEXT (bebas, no constraint)
- Tabel `app_settings.inactive_villages` — JSONB array (auto compatible)
- Tidak ada migration database yang diperlukan ✅

### 2. Update Frontend (4 File)

#### File 1: `src/app/pages/customer/Checkout.tsx`
```diff
const VILLAGE_GROUPS = [
  "Desa Bukit Sungkai",
  "Desa Sekuningan Baru",
  "Desa Balai Riam (Pusat Kecamatan)",
  "Desa Bangun Jaya",
  "Desa Lupu Peruca",
  "Desa Natai Kondang",
- "Desa Ajang"
+ "Desa Ajang",
+ "Desa Air Dua",
+ "Desa Jihing",
+ "Desa Semantun",
];
```

#### File 2: `src/app/pages/customer/KirimBarang.tsx`
```diff
const VILLAGE_GROUPS = [
  "Desa Bukit Sungkai",
  "Desa Sekuningan Baru",
  "Desa Balai Riam (Pusat Kecamatan)",
  "Desa Bangun Jaya",
  "Desa Lupu Peruca",
  "Desa Natai Kondang",
- "Desa Ajang"
+ "Desa Ajang",
+ "Desa Air Dua",
+ "Desa Jihing",
+ "Desa Semantun",
];
```
**Catatan:** Dropdown digunakan di dua tempat (Penjemputan & Pengantaran)

#### File 3: `src/app/components/ManualOrderCreation.tsx`
```diff
const VILLAGE_GROUPS = [
  "Desa Bukit Sungkai",
  "Desa Sekuningan Baru",
  "Desa Balai Riam (Pusat Kecamatan)",
  "Desa Bangun Jaya",
  "Desa Lupu Peruca",
  "Desa Natai Kondang",
- "Desa Ajang"
+ "Desa Ajang",
+ "Desa Air Dua",
+ "Desa Jihing",
+ "Desa Semantun",
];
```

#### File 4: `src/app/pages/admin/AdminPanel.tsx`
```diff
const VILLAGE_GROUPS = [
  "Desa Bukit Sungkai",
  "Desa Sekuningan Baru",
  "Desa Balai Riam (Pusat Kecamatan)",
  "Desa Bangun Jaya",
  "Desa Lupu Peruca",
  "Desa Natai Kondang",
- "Desa Ajang",
+ "Desa Ajang",
+ "Desa Air Dua",
+ "Desa Jihing",
+ "Desa Semantun",
];

const WILAYAH_1 = [
  "Desa Bukit Sungkai",
  "Desa Sekuningan Baru",
  "Desa Balai Riam (Pusat Kecamatan)",
  "Desa Bangun Jaya",
];
-const WILAYAH_2 = ["Desa Lupu Peruca", "Desa Natai Kondang", "Desa Ajang"];
+const WILAYAH_2 = [
+  "Desa Lupu Peruca",
+  "Desa Natai Kondang",
+  "Desa Ajang",
+  "Desa Air Dua",
+  "Desa Jihing",
+  "Desa Semantun",
+];
```

**Catatan:** Ketiga desa baru masuk ke **WILAYAH 2 (JAUH)** untuk toggle ketersediaan di Admin Panel.

---

## File yang Dimodifikasi

| File | Baris | Perubahan |
|------|-------|-----------|
| `src/app/pages/customer/Checkout.tsx` | L19-27 | Tambah 3 desa ke `VILLAGE_GROUPS` |
| `src/app/pages/customer/KirimBarang.tsx` | L32-40 | Tambah 3 desa ke `VILLAGE_GROUPS` |
| `src/app/components/ManualOrderCreation.tsx` | L33-41 | Tambah 3 desa ke `VILLAGE_GROUPS` |
| `src/app/pages/admin/AdminPanel.tsx` | L65-73, L81-90 | Tambah 3 desa ke `VILLAGE_GROUPS` & `WILAYAH_2` |

---

## Desa Sekarang (Total 10)

**WILAYAH 1 (DEKAT)** - 4 desa:
1. Desa Bukit Sungkai
2. Desa Sekuningan Baru
3. Desa Balai Riam (Pusat Kecamatan)
4. Desa Bangun Jaya

**WILAYAH 2 (JAUH)** - 6 desa:
5. Desa Lupu Peruca
6. Desa Natai Kondang
7. Desa Ajang
8. Desa Air Dua (NEW)
9. Desa Jihing (NEW)
10. Desa Semantun (NEW)

---

## Fitur yang Terdampak ✅

| Fitur | Status |
|-------|--------|
| Dropdown Desa di Checkout (Customer) | ✅ Langsung tersedia |
| Dropdown Desa di Kirim Barang (Customer) | ✅ Langsung tersedia (2 dropdown) |
| Dropdown Desa di Manual Order Creation (Admin) | ✅ Langsung tersedia |
| Filter Desa di Order Dashboard (Admin) | ✅ Langsung tersedia |
| Dropdown Desa saat Tambah/Edit Outlet (Admin) | ✅ Langsung tersedia |
| Toggle Ketersediaan Wilayah (Admin) | ✅ Langsung tersedia di WILAYAH 2 |
| Data Orders Historis | ✅ Backward compatible (text field bebas) |

---

## Testing & Validasi

✅ **TypeScript Compilation:** 0 errors  
✅ **Frontend Backward Compatibility:** Existing orders tetap valid (text field)  
✅ **Admin Panel:** Ketiga desa bisa di-toggle ON/OFF di WILAYAH 2  
✅ **Customer Checkout:** Ketiga desa muncul di dropdown desa  
✅ **Kirim Barang:** Ketiga desa muncul di dropdown Penjemputan & Pengantaran  
✅ **Manual Order Creation:** Ketiga desa muncul di dropdown pelanggan  

---

## Database Status

❌ **Migration Database:** Tidak diperlukan
- Kolom `customer_village` dan `village` tipe TEXT (bebas nilai)
- Tidak ada CHECK constraint untuk validasi nama desa
- `app_settings.inactive_villages` JSONB array otomatis kompatibel

---

## Catatan Teknis

1. **No Breaking Changes:** Ketiga desa langsung terintegrasi tanpa perubahan logika bisnis
2. **Naming Convention:** Mengikuti format "Desa [Nama]" sesuai standar step #69
3. **Wilayah Mapping:** Berdasarkan jarak operasional (WILAYAH 2 = zona lebih jauh)
4. **Code Style:** Formatting otomatis mengikuti prettier rules yang ada

---

## Build Status

✅ **TypeScript:** 0 errors, 0 warnings  
✅ **Vite Build:** Ready to deploy  
✅ **UI:** Verified semua 4 file sudah terupdate  

**Deployment:** Siap langsung ke production tanpa perlu inisialisasi tambahan. 🚀