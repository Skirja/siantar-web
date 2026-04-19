# 70. Implementasi Flow Pembayaran Transfer + Validasi Admin (Anti-Refund)

**Tanggal:** 2026-04-18  
**Scope:** Keamanan Transaksi, Validasi Operasional, dan Flow Pembayaran Customer

---

## Masalah Utama
Sebelumnya, customer yang memilih metode pembayaran **Transfer** langsung mendapatkan akses ke nomor rekening dan form upload bukti bayar segera setelah checkout. Hal ini berisiko:
1. Customer sudah terlanjur transfer dana.
2. Ternyata tidak ada driver yang tersedia atau kedai tujuan sudah tutup/antre panjang.
3. Admin terpaksa melakukan **Refund Manual** yang memakan waktu, biaya admin antar bank, dan menurunkan kepercayaan customer.

## Solusi yang Diimplementasikan
Menerapkan sistem **Gatekeeper Admin** di mana instruksi pembayaran "dikunci" sampai admin memberikan konfirmasi ketersediaan operasional di lapangan.

---

## Perubahan yang Dilakukan

### 1. Database (PostgreSQL / Supabase)
- **Modifikasi Constraint:** Mengubah `orders_payment_status_check` pada tabel `orders` untuk mendukung status baru.
- **Status Baru:** `'awaiting_admin_confirmation'` ditambahkan sebagai status awal untuk pesanan metode transfer.
- **SQL Migration:**
  ```sql
  ALTER TABLE public.orders DROP CONSTRAINT orders_payment_status_check;
  ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status = ANY (ARRAY['awaiting_admin_confirmation'::text, 'pending'::text, 'waiting_confirmation'::text, 'confirmed'::text, 'rejected'::text]));
  ```

### 2. Sisi Customer (Frontend)
- **Checkout (`Checkout.tsx`):** Logika pembuatan order diperbarui. Jika metode pembayaran adalah Transfer, maka `payment_status` awal diset ke `'awaiting_admin_confirmation'`.
- **Instruksi Pembayaran (`PaymentInstruction.tsx`):**
  - Menambahkan blok UI "Menunggu Konfirmasi Pesanan" dengan animasi pulse.
  - **Proteksi Data:** Menyembunyikan (tidak merender) nomor rekening, nama pemilik akun, kode unik, dan form upload selama status masih `awaiting_admin_confirmation`.
  - Menambahkan tombol WhatsApp langsung ke Admin untuk mempercepat proses konfirmasi.
- **Tracking Pesanan (`OrderTracking.tsx`):** Menambahkan label status visual "Menunggu Konfirmasi Admin" agar customer mendapatkan kejelasan progres.

### 3. Sisi Admin (Admin Panel)
- **Manajemen Order (`AdminPanel.tsx`):**
  - Memberikan badge oranye menyala pada pesanan yang membutuhkan konfirmasi ketersediaan.
  - Menambahkan tombol aksi **✅ Konfirmasi Pesanan** dan **❌ Tolak Pesanan** yang hanya muncul pada status `awaiting_admin_confirmation`.
  - **Proteksi Penugasan:** Tombol "Assign Driver" otomatis disembunyikan/dikunci untuk pesanan transfer sampai pembayaran berstatus `'confirmed'`. Hal ini memastikan driver tidak ditugaskan ke order yang belum lunas.
- **Pesanan Manual (`ManualOrderCreation.tsx`):** Menyelaraskan status pembayaran transfer pada pembuatan pesanan manual agar konsisten dengan flow aplikasi utama.

### 4. Tipe Data (TypeScript)
- Memperbarui interface dan pengecekan tipe data pada `database.types.ts` dan konteks terkait untuk mengenali status `'awaiting_admin_confirmation'`.

---

## Hasil & Dampak
- ✅ **Keamanan Dana:** Uang customer tidak akan keluar sebelum ada jaminan layanan (Driver & Toko OK).
- ✅ **Zero Refund:** Menghilangkan resiko refund akibat pembatalan pesanan setelah bayar.
- ✅ **Kontrol Admin:** Admin memiliki kendali penuh untuk menyeimbangkan beban kerja driver sebelum mengizinkan transaksi finansial.
- ✅ **Real-time:** Mengandalkan polling/websocket Supabase sehingga saat admin klik "Konfirmasi", layar customer otomatis berubah tanpa refresh.

## Status: **COMPLETED** 🚀
