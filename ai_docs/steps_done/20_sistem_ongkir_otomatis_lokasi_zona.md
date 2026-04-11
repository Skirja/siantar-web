# 20 - Sistem Ongkir Otomatis Berbasis Lokasi & Zona

**Tanggal:** 2026-04-11  
**Scope:** Fitur #52 (GPS-based automated delivery fee with zones)  
**Build:** ✅ TypeScript 0 errors  

---

## Ringkasan Perubahan

Sesi ini mengimplementasikan sistem perhitungan ongkir otomatis berdasarkan koordinat GPS untuk meningkatkan akurasi dan keadilan tarif tanpa bergantung pada API peta berbayar.

### 1. Database & Tipe Data
- Menambahkan kolom `latitude` dan `longitude` pada tabel `outlets`.
- Menambahkan kolom `customer_latitude`, `customer_longitude`, dan `zone` pada tabel `orders`.
- Memperbarui fungsi RPC `create_order` untuk mendukung field koordinat dan zona baru.
- Regenerasi `database.types.ts` dan pembaruan `DataContext.tsx`.

### 2. Manajemen Lokasi Outlet (Admin)
- Menambahkan input manual Koordinat (Lat/Lng) di form Outlet.
- Menambahkan tombol **📍 Ambil Lokasi Saya** untuk memudahkan Admin menyimpan lokasi kedai menggunakan GPS browser saat berada di lokasi.

### 3. Logika Perhitungan Jarak & Tarif
- Menggunakan **Haversine Formula** untuk menghitung jarak garis lurus (udara) antar koordinat dalam KM.
- **Sistem Zona Tarif:**
  - **🟢 Zona Hijau (0-5 KM):** Biaya Zona Rp5.000 + (Jarak × Rp2.000)
  - **🟡 Zona Kuning (6-10 KM):** Biaya Zona Rp10.000 + (Jarak × Rp2.000)
  - **🔴 Zona Merah (11+ KM):** Biaya Zona Rp15.000 + (Jarak × Rp2.000)
- Mendukung **Fallback** otomatis ke tarif per-desa (`distance_matrix`) jika data GPS tidak tersedia.

### 4. Pengalaman Pelanggan (Checkout)
- Tombol baru: **📍 Gunakan Lokasi Saya** di halaman checkout.
- Tampilan detail ringkasan: Menampilkan Jarak (KM), Nama Zona, dan breakdown perhitungan ongkir secara transparan.

### 5. Dukungan Driver (Navigasi)
- Menambahkan tombol **🗺️ Peta** (link Google Maps) pada detail pesanan di panel Admin dan Driver.
- Link otomatis membuka rute ke lokasi pelanggan menggunakan koordinat GPS yang presisi.

---

*Generated: 2026-04-11 — Step 20 Documentation*
