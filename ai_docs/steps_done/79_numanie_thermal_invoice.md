# Step 79: Implementasi Invoice Thermal PO Numanie Pizza

## Deskripsi
Menyeragamkan sistem invoice pada modul PO Numanie Pizza dengan format struk thermal standar SiAnter, menggantikan sistem pengiriman invoice teks WhatsApp otomatis dengan sistem cetak/unduh struk yang lebih profesional.

## Perubahan Utama

### 1. Pembuatan Komponen `NumanieInvoiceModal.tsx`
- Membuat modal khusus untuk menampilkan struk thermal PO Numanie.
- Fitur:
    - Judul struk: **"INVOICE NUMANIE PIZZA"**.
    - Opsi ukuran kertas: **58mm** dan **80mm**.
    - Fungsi **Print** (langsung ke printer thermal).
    - Fungsi unduh sebagai **PNG** dan **JPG**.
    - Integrasi dengan `html2canvas` untuk rendering gambar yang presisi.

### 2. Integrasi pada `PreOrderNumanie.tsx`
- **Alur Pemesanan (Langkah 4):**
    - Mengubah tombol "Kirim Invoice & Simpan DB" menjadi "Simpan Pesanan".
    - Menghapus pembukaan otomatis link WhatsApp.
    - Setelah berhasil simpan, menampilkan status sukses dan tombol **"Cetak Struk"** yang membuka modal.
    - Memastikan data `created_at` disertakan pada state `lastSavedOrder` untuk menghindari error "Invalid Date" pada struk.
- **Tab Riwayat (History):**
    - Menambahkan ikon printer pada setiap baris order yang sudah selesai.
    - Memungkinkan admin mencetak ulang struk dari data riwayat.

### 3. Pembersihan & Keamanan
- Menghapus fungsi `generateWAInvoice` yang lama karena sudah tidak digunakan.
- Menambahkan state `isPrinting` pada modal untuk mencegah *double-click* atau *race condition* saat proses rendering struk.
- Verifikasi tipe data untuk memastikan `order.items` (JSON) dibaca dengan benar sebagai array.

## Verifikasi
- [x] **Lint:** Lulus (`npm run lint`).
- [x] **Typecheck:** Lulus (`npm run typecheck`).
- [x] **Fungsional:** Struk tampil dengan benar, data tanggal valid, dan tombol print/unduh berfungsi.
