# 60. Redesign UI Keranjang, Kategori & Layanan (Mobile Focus)

## Deskripsi Pekerjaan
Pekerjaan ini mencakup peningkatan signifikan pada pengalaman pengguna (UX) dan antarmuka (UI) SiAnter, fokus pada efisiensi ruang di perangkat mobile, navigasi kategori yang lebih modern, serta penyelarasan roadmap fitur melalui kartu layanan "Coming Soon".

## Perubahan Utama

### 1. Perbaikan UI Keranjang Belanja (#59)
- **Layout:** Mengubah dari layout vertikal standar ke **Horizontal Card Layout**.
- **Tipografi:** 
    - Implementasi `line-clamp-2` pada nama menu untuk menjaga kerapian grid.
    - Penggunaan font size yang lebih kecil (`text-[10px]`) dan tracking ketat untuk sub-info (outlet, varian).
- **Kontrol:** 
    - Desain ulang tombol kuantitas menjadi baris horizontal yang padat.
    - Reposisi tombol hapus ke sudut kanan atas area kontrol untuk mencegah klik tidak sengaja.

### 2. Kategori Menu & Slider (#60)
- **Navigasi Kategori:** Mengganti grid kategori 3x2 dengan **Horizontal Category Slider** yang dapat digeser (*swipeable*).
- **Visual:** Menambahkan ikon emoji yang relevan untuk setiap kategori guna mempermudah pengenalan visual.
- **Empty State:** Mengimplementasikan pesan "Belum ada menu pada kategori ini" dengan visual yang menarik jika kategori (seperti "Lain-lain") kosong.

### 3. Roadmap Layanan (#61)
- **Home & Service Selection:** Menambahkan kartu layanan baru sebagai bagian dari roadmap masa depan.
- **SiAnter Sehat:** Ikon 💚, status "Segera Hadir", gaya visual *dimmed*.
- **Antar Barang:** Ikon 📦, status "Belum Tersedia", gaya visual *dimmed*.
- **Pembersihan:** Menghapus layanan "Kirim Barang" yang redundan dan masih dalam tahap pengembangan.

### 4. Konfigurasi Sistem & Router
- **Router:** Menonaktifkan (comment out) rute `/home/kirim-barang` di `routes.tsx` untuk mencegah akses ke fitur yang belum siap.
- **Cleanup:** Memperbaiki beberapa kesalahan sintaks JSX di `Home.tsx` akibatOverlap penggantian kode dan menambahkan import yang hilang seperti `ArrowRight`, `Clock`, dan `ImageIcon`.

## Teknis & Verifikasi
- **Framework:** React + Vite + TailwindCSS + Lucide Icons.
- **Lulus Typecheck:** `npm run typecheck` (Exit code: 0).
- **Lulus Linting:** `npm run lint` (Exit code: 0).
- **Build Sukses:** `npm run build` berhasil di-generate.

## File yang Dimodifikasi
- `src/app/pages/customer/Home.tsx`
- `src/app/pages/customer/Cart.tsx`
- `src/app/pages/customer/ServiceSelection.tsx`
- `src/app/routes.tsx`
