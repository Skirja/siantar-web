# 69 - Penyesuaian Nama Desa dan Pengelompokan Wilayah

**Tanggal:** 2026-04-18  
**Scope:** Perbaikan inkonsistensi nama desa dan UI Ketersediaan Lokasi di Admin Panel

---

## Yang Dilakukan

### 1. Penyeragaman Daftar Desa (VILLAGE_GROUPS)
- Mengubah konstanta `VILLAGE_GROUPS` di seluruh komponen untuk mencerminkan daftar desa terbaru sesuai referensi Gambar 2.
- Menambahkan awalan "Desa" dan keterangan lokasi pada nama desa.
- Daftar desa terbaru:
  1. Desa Bukit Sungkai
  2. Desa Sekuningan Baru
  3. Desa Balai Riam (Pusat Kecamatan)
  4. Desa Bangun Jaya
  5. Desa Lupu Peruca
  6. Desa Natai Kondang
  7. Desa Ajang

### 2. Implementasi Pengelompokan Wilayah (Admin Panel)
- Menambahkan konstanta `WILAYAH_1` (Dekat) dan `WILAYAH_2` (Jauh) di `AdminPanel.tsx`.
- Memperbarui UI pada bagian **Ketersediaan Lokasi Pengantaran** agar menampilkan header "WILAYAH 1 (DEKAT)" dan "WILAYAH 2 (JAUH)".
- Mengubah grid rendering dari list tunggal menjadi dua kolom kategori untuk kemudahan manajemen operasional.

### 3. Verifikasi Sinkronisasi Database
- Melakukan pengecekan via Supabase MCP untuk memastikan data di tabel `orders`, `outlets`, dan `app_settings` (key: `inactive_villages`) sudah menggunakan format nama desa yang baru.
- Memastikan status *toggle* (ON/OFF) di UI Admin sesuai dengan data `inactive_villages` di database.

---

## File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `src/app/pages/customer/Checkout.tsx` | Update `VILLAGE_GROUPS` |
| `src/app/pages/customer/KirimBarang.tsx` | Update `VILLAGE_GROUPS` |
| `src/app/pages/admin/AdminPanel.tsx` | Update `VILLAGE_GROUPS`, tambah `WILAYAH_1` & `WILAYAH_2`, update UI rendering |
| `src/app/components/ManualOrderCreation.tsx` | Update `VILLAGE_GROUPS` |

---

## Hasil Akhir
- Nama desa di dropdown Customer (Checkout & Kirim Barang) kini lebih formal dan informatif.
- Admin dapat melihat dan mengelola desa berdasarkan zona jarak (Wilayah 1 & 2).
- Sinkronisasi antara kode frontend dan data riwayat di database tetap terjaga.
