# Dokumentasi Langkah Kerja: Sinkronisasi Setoran (#48) & Filter Pesanan Admin (#49)

**Nomor Folder:** 18
**Tanggal:** 2026-04-09
**Deskripsi:** Memperbaiki ketidaksesuaian nominal setoran admin antara Driver Panel & Admin Panel, serta menambahkan fitur filter (tanggal & status) pada daftar pesanan di Admin Panel.

---

## 1. Perbaikan Sinkronisasi Setoran (#48)

### Masalah:
Nomor setoran yang tampil di UI Driver Panel dan Admin Panel tidak menyertakan nilai *markup* (Rp1.000 per menu), sedangkan fungsi pemotongan saldo di database menyertakan nilai tersebut. Hal ini menyebabkan kebingungan bagi driver dan ketidaksesuaian rekap bagi admin.

### Perubahan:
- **`src/app/pages/driver/DriverPanel.tsx`**: Mengubah pemanggilan `calculateOrderFinance` agar menyertakan `order.service_fee` (yang menyimpan total markup) sebagai parameter `markupAmount`.
- **`src/app/pages/admin/AdminPanel.tsx`**: Melakukan perubahan yang sama pada kartu pesanan di tab "Pesanan" untuk memastikan konsistensi tampilan dengan Driver Panel dan basis data.

---

## 2. Penambahan Filter Pesanan Admin (#49)

### Masalah:
Tab "Pesanan" pada Admin Panel menampilkan semua pesanan tanpa opsi penyaringan, sehingga daftar pesanan menumpuk dan sulit dikelola seiring bertambahnya data.

### Perubahan:
- **State Filter**: Menambahkan state `dateFilter`, `statusFilter`, `customStartDate`, dan `customEndDate` di komponen `AdminPanel`.
- **Logika Penyaringan**: Menggunakan `useMemo` untuk memproses `filteredOrders` berdasarkan kriteria:
  - **Status**: Mendukung filter semua status atau status spesifik (Pending, Processing, Completed, dll).
  - **Tanggal**: Mendukung "Hari Ini", "Kemarin", "Semua", dan "Rentang Kustom" (Datepicker).
- **UI Filter**: 
  - Menambahkan barisan kontrol filter (Select & Date Input) di atas daftar pesanan.
  - Menambahkan ringkasan jumlah pesanan yang ditemukan (`Stats Summary`).
  - Memperbarui render list agar menggunakan `filteredOrders.map` alih-alih `orders.map`.

---

## 3. Verifikasi & Pengujian
- **TypeScript Check**: `npx tsc --noEmit` berhasil (0 Error).
- **Sinkronisasi**: Nominal "Setoran Admin" kini mencakup profit pengiriman + markup menu, memberikan angka yang sama di panel driver maupun admin.
- **Filter**: Filter tanggal dan status berfungsi secara *real-time* di panel admin, memungkinkan admin untuk fokus pada pesanan hari ini atau status tertentu.
