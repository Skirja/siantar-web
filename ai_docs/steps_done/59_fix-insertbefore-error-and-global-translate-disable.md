# Step 59 — Fix 'insertBefore' error & Global Translate Disable

**Tanggal:** 14 April 2026  
**Scope:** Fix crash `insertBefore` (Google Translate interference), Global Error Boundary implementation, Build Verification.
**Build:** ✅ TypeScript 0 errors | Vite build SUCCESS | Lint 0 errors

---

## Ringkasan Perubahan

Sesi ini menangani masalah kritis di mana aplikasi *crash* (White Screen of Death) saat browser mencoba menterjemahkan teks status pesanan secara otomatis menggunakan Google Translate.

### 1. Mematikan Auto-Translate Global
- **Masalah:** Ekstensi penterjemah menyuntikkan tag `<font>` ke dalam DOM asinkron React, merusak referensi Virtual DOM.
- **Solusi:** Menambahkan atribut `translate="no"` pada tag `<html>` di `index.html` untuk memberi tahu browser/Google Translate agar tidak menterjemahkan seluruh aplikasi.

### 2. Refactoring Keamanan (Lapis Kedua)
Meskipun fitur terjemahan dimatikan, praktik terbaik tetap diterapkan untuk menjaga integritas *naked text nodes*:
- **`DriverPanel.tsx`**: Membungkus teks status kondisional (Diproses, Menuju Toko, dll) dengan elemen `<span>`.
- **`OrderTracking.tsx`**: Membungkus teks pelacakan status pelanggan dengan elemen `<span>`.

### 3. Implementasi Global Error Boundary
Menambahkan jaring pengaman agar jika terjadi error rendering di masa depan, aplikasi tidak hancur menjadi layar putih:
- **`ErrorBoundaryUi.tsx`**: Komponen baru dengan visual yang bersih, pesan error yang ramah, dan tombol **"Muat Ulang Halaman"**.
- **`routes.tsx`**: Dikonfigurasi menggunakan properti `errorElement` pada `createHashRouter` di level `RootLayout`.

---

## Detail Teknis (File yang Diubah)

### 1. Konfigurasi Utama
- **`index.html`**:
    ```html
    <html lang="en" translate="no">
    ```

### 2. Antarmuka Pemulihan
- **`src/app/components/ErrorBoundaryUi.tsx` [NEW]**:
    - Menggunakan `useRouteError` dari React Router.
    - Menampilkan `Logo`, ikon `AlertTriangle`, dan tombol `RotateCcw` untuk reload.

### 3. Integrasi Router
- **`src/app/routes.tsx`**:
    - Import `ErrorBoundaryUi`.
    - Menambahkan `errorElement: <ErrorBoundaryUi />` pada root configuration.

### 4. Refactor Komponen
- **`src/app/pages/driver/DriverPanel.tsx`**:
    - Status badge text wrapped in `<span>`.
    - Filter order aktif ditambah pengecekan status `cancelled`.
- **`src/app/pages/customer/OrderTracking.tsx`**:
    - Wrap teks status: "Selesai", "Dibatalkan", "Aktif" dalam `<span>`.
    - Wrap teks "Sedang berlangsung" dalam `<span>`.

---

## Verifikasi & Build Status

Saya telah menjalankan perintah verifikasi berikut sebelum finalisasi:

| Check | Command | Status |
|---|---|---|
| **Typecheck** | `npm run typecheck` | ✅ **Lulus** (0 Error) |
| **Linting** | `npm run lint` | ✅ **Lulus** (0 Error) |
| **Production Build** | `npm run build` | ✅ **Berhasil** (built in 11.04s) |

---

*Generated: 14 April 2026 — Step 59 Documentation*
