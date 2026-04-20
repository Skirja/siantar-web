# 73. Perbaikan Aksesibilitas Driver & Optimalisasi Flow Pembayaran Admin

**Tanggal:** 2026-04-20
**Scope:** Operasional Driver, Transparansi Order, Keamanan Pembayaran, dan UI Admin.

---

## Masalah yang Diselesaikan
Setelah migrasi ke hosting (Vercel), ditemukan beberapa kendala operasional:
1. **Aksesibilitas Driver Terbatas:** Driver kesulitan mengakses lokasi Maps (kedai/customer) dan kontak WhatsApp secara konsisten di berbagai status pesanan.
2. **Catatan Item Tidak Terlihat:** Catatan detail per produk (contoh: "Tanpa sayur") tidak muncul di Admin, Driver, maupun Invoice.
3. **Flow Pembayaran Kaku:** Admin tidak bisa menugaskan driver (Assign Driver) jika pembayaran transfer belum dikonfirmasi sistem, padahal verifikasi sering dilakukan manual via WhatsApp.
4. **Kontak Admin Salah:** Nomor WhatsApp konfirmasi pembayaran customer masih menggunakan nomor placeholder.

---

## Perubahan yang Dilakukan

### 1. Visibilitas Catatan Item (Order Notes)
*   **Komponen `OrderItemsDetail.tsx`:** Menambahkan tampilan `item.note` di bawah nama produk dengan styling miring (*italic*) dan background kuning tipis agar kontras bagi Admin dan Driver.
*   **Komponen `InvoiceModal.tsx`:** Menambahkan baris catatan item pada pratinjau struk thermal agar transparan bagi pelanggan dan pihak outlet.

### 2. Peningkatan Panel Driver (Maps & Kontak)
*   **Tab Histori:** Menambahkan tombol akses cepat WhatsApp dan Google Maps pada setiap pesanan yang telah selesai di `DriverPanel.tsx`.
*   **Tab Rute Aktif:** Menambahkan tombol **WhatsApp Kedai** pada tugas pickup dan memastikan tombol **Maps Customer** tersedia di semua tahapan pengantaran.
*   **Normalisasi Nomor:** Implementasi fungsi `normalizePhoneForWhatsApp` untuk memastikan format nomor telepon selalu diawali `62` agar link WhatsApp tidak error.

### 3. Fleksibilitas Admin Panel
*   **Tombol "Paksa Assign":** Mengubah logika `disabled` pada tombol penugasan driver. Kini admin bisa melakukan "Assign Driver (Paksa)" meskipun status pembayaran belum `confirmed`.
*   **Indikator Warning:** Menambahkan pesan visual *"Menunggu Transfer / Bukti WA"* berwarna oranye pada pesanan yang belum tervalidasi sistem.
*   **Preview Bukti Bayar:** Menambahkan fungsi `window.open` pada gambar bukti transfer agar admin bisa melihat bukti dalam ukuran penuh di tab baru secara aman.

### 4. Update Kontak Customer
*   **`PaymentInstruction.tsx`:** Memperbarui nomor tujuan konfirmasi WhatsApp ke nomor resmi: **085134830507**.
*   **Keamanan Tautan:** Menambahkan atribut `rel="noopener noreferrer"` pada semua elemen `<a>` yang mengarah ke luar aplikasi (WA/Maps) sesuai *best practice* keamanan web.

---

## Hasil Akhir
*   ✅ Driver memiliki kontrol penuh atas navigasi dan komunikasi di setiap status pesanan.
*   ✅ Admin memiliki fleksibilitas untuk memproses order tanpa hambatan teknis status pembayaran.
*   ✅ Detail pesanan (catatan khusus) kini tersampaikan dengan jelas ke semua pihak.
*   ✅ Alur pembayaran lebih kredibel dengan nomor admin yang benar.

**Status:** **COMPLETED** 🚀
