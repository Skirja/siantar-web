# 75. Perbaikan RLS, Flow Pembayaran Transfer, dan Optimalisasi Visibilitas Operasional

**Tanggal:** 21 April 2024
**Scope:** Keamanan Database (RLS), Operasional Admin/Driver, dan Akurasi Pesanan.
**Status:** **COMPLETED** 🚀

---

## Masalah yang Diselesaikan

1.  **Kegagalan Update Database (RLS Issue):** 
    - Pelanggan (*anonymous*) gagal mengunggah bukti bayar, gagal melakukan *auto-cancel* saat driver tidak ditemukan, dan gagal menandai notifikasi sebagai "dibaca" karena aturan *Row Level Security* (RLS) Supabase memblokir aksi `UPDATE` langsung ke tabel.
2.  **Kaku-nya Penugasan Driver (Admin Panel):**
    - Adanya batasan keras (*hardcode*) yang melarang Admin menugaskan lebih dari 2 pesanan ke satu driver atau menugaskan pesanan yang tidak searah.
3.  **Masalah Aksesibilitas Driver:**
    - Tombol navigasi Maps dan WhatsApp sering hilang di tab rute aktif, menyulitkan driver saat berpindah fase pengantaran.
4.  **Kurangnya Detail Pesanan (Catatan Pelanggan):**
    - Catatan tambahan (seperti "tanpa sayur" atau "beli es batu") tidak terlihat jelas di panel Admin dan Driver, serta tidak tercetak di invoice.

---

## Perubahan yang Dilakukan

### 1. Database & Backend (Supabase RPC)
- **Modifikasi RPC `update_order_payment`:** Menambahkan logika untuk mengosongkan (`NULL`) kolom `payment_rejection_reason` secara otomatis saat pelanggan mengunggah bukti bayar baru (untuk menangani skenario unggah ulang setelah ditolak).
- **Pembuatan RPC Baru `mark_notification_read`:** Fungsi khusus dengan hak akses tinggi (`SECURITY DEFINER`) agar pelanggan bisa menandai notifikasi dibaca tanpa diblokir RLS.
- **Pembaruan `database.types.ts`:** Menambahkan definisi fungsi RPC baru ke dalam *type system* TypeScript agar sinkron dengan database.

### 2. Frontend - Penanganan RLS (Bypass Aman)
- **`PaymentInstruction.tsx`:** Mengganti `updateOrder` (Direct Table Update) menjadi `updateOrderPayment` (RPC Call).
- **`OrderTracking.tsx`:** Mengganti logika *auto-cancel* agar menggunakan RPC `updateOrderStatus`.
- **`NotificationContext.tsx`:** Mengganti aksi *mark as read* agar menggunakan RPC `mark_notification_read`.

### 3. Frontend - Admin Panel
- **Hapus Batasan Order:** Mengubah logika *Assign Driver* dari "Blocked" (Disable tombol) menjadi "Warning" (Hanya peringatan). Admin kini bebas menugaskan banyak order ke driver mana pun.
- **Visibilitas Detail Pesanan:** 
    - Menampilkan `customer_note` (catatan global) dengan latar belakang kuning mencolok.
    - Menampilkan daftar `order_items` beserta catatan per itemnya (misal: "Pedas level 5") langsung di kartu pesanan utama.
- **Nomor Konfirmasi:** Memastikan nomor WhatsApp tujuan konfirmasi pembayaran mengarah ke **085134830507**.

### 4. Frontend - Driver Panel
- **Standardisasi Action Buttons:** Tombol **📍 Maps Kedai**, **📍 Maps Customer**, dan **💬 WhatsApp Customer** kini selalu muncul secara konsisten di semua fase rute aktif (Menuju Toko -> Pickup -> OTW).
- **Catatan Real-time:** Menambahkan render catatan per item dan catatan global di tampilan rute driver agar tidak perlu membuka modal detail secara manual.
- **Peningkatan Histori:** Menambahkan akses Maps dan WhatsApp pada daftar histori pengiriman.

### 5. Frontend - Invoice
- **`InvoiceModal.tsx`:** Menambahkan bagian "Catatan Pelanggan" pada cetakan invoice/struk agar kedai dan pelanggan memiliki bukti fisik instruksi khusus.

---

## Hasil Akhir & Dampak
- ✅ **Keamanan Terjamin:** Masalah RLS terselesaikan tanpa mengekspos *Secret Key* (tetap menggunakan jalur RPC).
- ✅ **Fleksibilitas Admin:** Admin memiliki kontrol penuh atas penugasan driver tanpa dibatasi aturan sistem yang kaku.
- ✅ **Driver Lebih Cepat:** Akses navigasi satu klik selalu tersedia, mengurangi waktu koordinasi manual.
- ✅ **Akurasi Pesanan:** Semua catatan khusus pelanggan terekspos jelas di semua sisi (Admin, Driver, Invoice), meminimalisir kesalahan pesanan.

**Build Status:** ✅ TypeScript 0 errors | ✅ Linting Clean | ✅ Data Synced 🚀
