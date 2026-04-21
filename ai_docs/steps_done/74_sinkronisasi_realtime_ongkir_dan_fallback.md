# 74 - Sinkronisasi Real-time Ongkir dan Mekanisme Fallback

**Tanggal:** 2026-04-21  
**Scope:** Perbaikan Isu #77 (Ongkir tidak sinkron), Real-time Database, dan Reliabilitas Checkout.  
**Status:** Selesai & Terverifikasi 🚀

---

## Masalah (Isu #77)
Ditemukan bahwa perubahan tarif **ongkir per KM** yang dilakukan oleh Admin di panel pengaturan tidak langsung tersinkronisasi ke sisi pelanggan. Pelanggan harus memuat ulang (*refresh*) halaman secara manual untuk mendapatkan tarif terbaru. Hal ini berisiko menyebabkan ketidaksesuaian harga (kerugian atau kelebihan tagihan).

## Penyebab
1.  **Statik di Awal:** Tabel `fee_settings` hanya diambil (*fetch*) satu kali saat aplikasi pertama kali dimuat.
2.  **Absennya Real-time:** Tabel `fee_settings` belum didaftarkan ke dalam publikasi *Real-time* Supabase.
3.  **Kurangnya Fallback:** Halaman *Checkout* tidak melakukan validasi ulang tarif sesaat sebelum kalkulasi akhir dilakukan.

---

## Perubahan yang Dilakukan

### 1. Konfigurasi Database (Real-time via MCP)
Telah dilakukan eksekusi SQL langsung melalui MCP Supabase untuk mendaftarkan tabel `fee_settings` ke publikasi `supabase_realtime`.
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE fee_settings;
```
*Catatan: Query dijalankan dengan pengecekan `IF NOT EXISTS` untuk menjaga idempotensi.*

### 2. Implementasi Subscription di Frontend
*   **File:** `src/app/contexts/DataContext.tsx`
*   Menambahkan `feeSettingsChannel` menggunakan `subscribeToTable` untuk memantau perubahan pada tabel `fee_settings`.
*   Setiap kali ada perubahan data oleh Admin, fungsi `refreshFeeSettings()` akan dipicu secara otomatis di semua klien yang aktif.
*   Memastikan pembersihan (*cleanup*) dilakukan dengan `unsubscribe(feeSettingsChannel)` saat komponen di-*unmount*.

### 3. Mekanisme Fallback (Reliabilitas Tinggi)
Meskipun *Real-time* sudah aktif, ditambahkan mekanisme cadangan (*fallback*) untuk mengantisipasi gangguan koneksi WebSocket:
*   **File:** `src/app/pages/customer/Checkout.tsx`
*   **File:** `src/app/pages/customer/KirimBarang.tsx`
*   Menambahkan pemanggilan `refreshFeeSettings()` di dalam `useEffect` pada saat komponen di-*mount*.
*   **Hasil:** Aplikasi akan SELALU mengambil tarif paling mutakhir tepat saat pelanggan masuk ke halaman konfirmasi pembayaran.

---

## Detail Teknis Perubahan

| File | Perubahan |
|------|-----------|
| `src/app/contexts/DataContext.tsx` | Implementasi `feeSettingsChannel` dan logika `unsubscribe`. |
| `src/app/pages/customer/Checkout.tsx` | Penambahan `refreshFeeSettings` pada *mount* sebagai *fallback*. |
| `src/app/pages/customer/KirimBarang.tsx` | Penambahan `refreshFeeSettings` pada *mount* dan perbaikan *import* `useEffect`. |

---

## Verifikasi Akhir
- [x] **SQL Execution:** Berhasil via MCP.
- [x] **Typecheck:** Lulus (`tsc --noEmit`).
- [x] **Linting:** Lulus (`eslint`).
- [x] **Commit:** Berhasil dengan format Conventional Commits (`fix(finance): ...`).

**Dibuat oleh:** Gemini CLI  
**Status:** **COMPLETED** 🚀