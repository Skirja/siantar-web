# 13 - Bug Fixes: Driver Panel, Order Tracking, Session Isolation, dan Auth Loading

**Tanggal:** 2026-04-07
**Scope:** 5 bug fixes kritis — race condition ConfirmDialog, akses ditolak tracking, session tercampur, auth loading redirect, dan status tidak sinkron

---

## Ringkasan

Sesi ini menangani 5 bug kritis yang dilaporkan user berdasarkan checklist perbaikan Web SiAntar:

| # | Issue | Status |
|---|-------|--------|
| 1 | Auto refresh setelah save, halaman Not Found / logout | ✅ FIXED |
| 2 | Error akses ditolak saat tracking order metode transfer | ✅ FIXED |
| 8 | Session akun customer tidak ter-reset (tercampur akun sebelumnya) | ✅ FIXED |
| 9 | Status pengiriman bertahap tidak sinkron ke lacak order customer | ✅ FIXED |
| 13 | Tombol setelah driver klik "Menerima Pesanan" error | ✅ FIXED |

---

## 1. Fix: Race Condition ConfirmDialog di Driver Panel (Issue #13)

**Masalah:** Setelah driver menekan tombol "Menerima Pesanan" lalu masuk ke view order aktif, SEMUA tombol status selanjutnya (Menuju Toko → Ambil Pesanan → Mulai Pengiriman → Selesaikan) menghasilkan error React dan tidak berfungsi.

**Root Cause:**
- `ConfirmDialog.handleConfirm()` memanggil `onConfirm()` (fungsi async) TIDAK di-await
- `onOpenChange(false)` dijalankan **SEGERA** sebelum operasi selesai
- Dialog di-unmount dari DOM saat `updateOrderStatus()` masih berjalan di background
- React Error: State update pada komponen yang sudah tidak ter-mount

### Perubahan yang Dilakukan

**File:** `src/app/components/ConfirmDialog.tsx`

```typescript
// BEFORE: handleConfirm tidak async, dialog langsung ditutup
const handleConfirm = () => {
  onConfirm();
  onOpenChange(false);
};

// AFTER: handleConfirm async, tunggu operasi selesai baru tutup dialog
const [processing, setProcessing] = useState(false);

const handleConfirm = async () => {
  setProcessing(true);
  try {
    await onConfirm();
  } finally {
    setProcessing(false);
    onOpenChange(false);
  }
};
```

**Perubahan tambahan di ConfirmDialog:**
- Tambah import `useState` dari React
- Tambah type `onConfirm: () => void | Promise<void>` (mendukung sync dan async)
- Tambah state `processing` untuk mencegah double-click
- Tombol confirm tampilkan "Memproses..." saat processing
- Tombol confirm `disabled={processing}` saat processing

**File:** `src/app/pages/driver/DriverPanel.tsx`

- Rename `loading` → `actionLoading` untuk menghindari konflik dengan `loading` dari AuthContext
- Rename `loading` dari AuthContext → `authLoading`
- Hapus wrapper async yang redundant di ConfirmDialog `onConfirm` (sekarang dihandle di komponen)
- Tambah `useEffect` untuk sync `activeOrder` dengan realtime data dari DataContext:
  ```typescript
  useEffect(() => {
    if (activeOrder) {
      const updated = orders.find(o => o.id === activeOrder.id);
      if (updated && updated.status !== activeOrder.status) {
        setActiveOrder(updated);
      }
    }
  }, [orders, activeOrder]);
  ```
- Tambah loading spinner saat `authLoading` true

---

## 2. Fix: "Akses Ditolak" pada Tracking Order Transfer (Issue #2)

**Masalah:** Customer yang order via metode "transfer" mendapat error "Akses Ditolak" saat membuka halaman lacak pesanan.

**Root Cause:**
1. `orderStatuses` array tidak mencakup status `pending` dan `driver_assigned` — menyebabkan `currentStatusIndex = -1` dan UI progress bar rusak
2. Ownership check memutuskan "Access Denied" terlalu cepat sebelum `customerPhone` dari AuthContext selesai dimuat (race condition antara AuthContext dan OrderTracking)
3. Perbandingan nomor telepon tidak dinormalisasi — perbedaan format (spasi, dash) menyebabkan mismatch

### Perubahan yang Dilakukan

**File:** `src/app/pages/customer/OrderTracking.tsx`

**a. Tambah status `pending` dan `driver_assigned` ke timeline:**
```typescript
// BEFORE: hanya 5 status
const orderStatuses = [
  { id: "processing", label: "Diproses", ... },
  { id: "going-to-store", label: "Driver menuju toko", ... },
  { id: "picked-up", label: "Pesanan diambil", ... },
  { id: "on-delivery", label: "Dalam perjalanan", ... },
  { id: "completed", label: "Selesai", ... },
];

// AFTER: 7 status lengkap
const orderStatuses = [
  { id: "pending", label: "Menunggu Konfirmasi", icon: Clock, ... },
  { id: "driver_assigned", label: "Driver Ditugaskan", icon: User, ... },
  { id: "processing", label: "Diproses", icon: Clock, ... },
  { id: "going-to-store", label: "Driver menuju toko", icon: MapPin, ... },
  { id: "picked-up", label: "Pesanan diambil", icon: Package, ... },
  { id: "on-delivery", label: "Dalam perjalanan", icon: Truck, ... },
  { id: "completed", label: "Selesai", icon: CheckCircle2, ... },
];
```

**b. Ownership check dengan timing yang benar:**
```typescript
useEffect(() => {
  if (!currentOrder) {
    setIsOwner(false);
    return;
  }
  
  const activePhone = customerPhone || storedPhone;
  
  // TUNGGU sampai phone tersedia — jangan memutuskan Access Denied terlalu cepat
  if (!activePhone) {
    setIsOwner(null); // null = masih loading, bukan ditolak
    return;
  }
  
  // Normalisasi kedua nomor telepon untuk perbandingan akurat
  const normalizePhone = (p: string) => (p || "").replace(/\D/g, "");
  const orderPhone = normalizePhone(currentOrder.customer_phone);
  const userPhone = normalizePhone(activePhone);
  
  const owns = currentOrder.customer_name === customerName && orderPhone === userPhone && userPhone.length > 0;
  setIsOwner(owns);
}, [currentOrder, customerPhone]);
```

**c. Tambah loading state untuk ownership:**
```typescript
// Tampilkan loading saat ownership belum ditentukan
if (isOwner === null) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
  );
}
```

**d. Update status progress mapping:**
```typescript
const statusProgress = {
  "pending": 0,
  "driver_assigned": 5,  // BARU
  "processing": 10,
  "going-to-store": 30,
  "picked-up": 50,
  "on-delivery": 75,
  "completed": 100,
};
```

**e. Safe status index fallback:**
```typescript
const currentStatusIndex = orderStatuses.findIndex(s => s.id === currentOrder.status);
const safeStatusIndex = currentStatusIndex >= 0 ? currentStatusIndex : 0; // fallback ke 0
```

**f. Import tambahan:**
- Tambah `User` icon dari lucide-react

---

## 3. Fix: Refresh Page / Session Logout (Issue #1)

**Masalah:** Setelah save data dan halaman auto-refresh, atau saat user refresh manual, halaman menjadi "Not Found" dan user harus logout-login ulang.

**Root Cause:**
- `CustomerLayout` dan `DriverPanel` tidak mengecek `loading` state dari AuthContext
- Saat AuthContext menjalankan `checkSession()` (async), `role` dan `isAuthenticated` masih `null`/`false`
- `useEffect` langsung menjalankan `navigate("/login-customer")` sebelum auth check selesai
- Hasil: user yang sudah login tapi auth belum selesai di-check → ter-redirect ke login

### Perubahan yang Dilakukan

**File:** `src/app/layouts/CustomerLayout.tsx`

```typescript
// BEFORE: tidak cek loading
export function CustomerLayout() {
  const { role, isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated || role !== "customer") {
      navigate("/login-customer");
    }
  }, [isAuthenticated, role, navigate]);

  if (!isAuthenticated || role !== "customer") {
    return null;
  }
  // ...
}

// AFTER: cek loading terlebih dahulu
export function CustomerLayout() {
  const { role, isAuthenticated, loading } = useAuth();
  
  useEffect(() => {
    if (loading) return; // TUNGGU auth check selesai
    if (!isAuthenticated || role !== "customer") {
      navigate("/login-customer");
    }
  }, [isAuthenticated, role, navigate, loading]);

  // Tampilkan loading spinner saat auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || role !== "customer") {
    return null;
  }
  // ...
}
```

**File:** `src/app/pages/driver/DriverPanel.tsx`

- Pola yang sama: cek `authLoading` sebelum redirect
- Tampilkan loading spinner saat auth check
- Rename `loading` state untuk action → `actionLoading` (untuk menghindari konflik dengan `authLoading`)

---

## 4. Fix: Session Customer Tercampur Antar Akun (Issue #8)

**Masalah:** Saat login menggunakan akun customer yang berbeda, masih muncul notifikasi / lacak order dari akun customer sebelumnya. Session / cache belum ter-reset sempurna.

**Root Cause:**
1. `CartContext` menggunakan `localStorage.getItem()` saat inisialisasi state (lazy initializer), tapi tidak re-hydrate ulang saat `customerPhone` berubah
2. `NotificationContext` sudah clear state saat `customerPhone` berubah, tapi `toast` yang sudah tampil tidak di-dismiss
3. `Checkout.tsx` tidak pre-fill data customer dari AuthContext — user harus input manual, berpotensi salah input

### Perubahan yang Dilakukan

**File:** `src/app/contexts/CartContext.tsx`

```typescript
// BEFORE: lazy initializer sekali saja saat mount
const [items, setItems] = useState<CartItem[]>(() => {
  const saved = localStorage.getItem(getCustomerCartKey());
  if (saved) return JSON.parse(saved);
  return [];
});

// AFTER: re-hydrate saat customerPhone berubah
const { customerPhone } = useAuth();
const [items, setItems] = useState<CartItem[]>([]);
const [notes, setNotes] = useState("");

// Re-hydrate cart saat customer login/logout/switch
useEffect(() => {
  const key = getCustomerCartKey(customerPhone || "");
  const notesKey = getCustomerNotesKey(customerPhone || "");
  try {
    const saved = localStorage.getItem(key);
    setItems(saved ? JSON.parse(saved) : []);
  } catch {
    setItems([]);
  }
  try {
    const savedNotes = localStorage.getItem(notesKey);
    setNotes(savedNotes || "");
  } catch {
    setNotes("");
  }
}, [customerPhone]);

// Sync ke localStorage hanya saat customerPhone tersedia
useEffect(() => {
  if (!customerPhone) return;
  localStorage.setItem(getCustomerCartKey(customerPhone), JSON.stringify(items));
}, [items, customerPhone]);

useEffect(() => {
  if (!customerPhone) return;
  localStorage.setItem(getCustomerNotesKey(customerPhone), notes);
}, [notes, customerPhone]);
```

**File:** `src/app/contexts/NotificationContext.tsx`

```typescript
useEffect(() => {
  // Clear SEMUA notifikasi dan toast saat auth change
  setDbNotifications([]);
  setNotifications([]);
  toast.dismiss(); // DISMISS semua toast yang sedang tampil
  
  // Jangan subscribe sampai auth info tersedia
  if (!role || !customerPhone) return;
  
  // ... subscription logic
}, [role, customerPhone]);
```

**File:** `src/app/pages/customer/Checkout.tsx`

```typescript
// Import useAuth
import { useAuth } from "../../contexts/AuthContext";

// Pre-fill customer info dari AuthContext
const { customerPhone, username: customerName } = useAuth();

useEffect(() => {
  if (customerName && !name) setName(customerName);
  if (customerPhone && !phone) setPhone(customerPhone);
}, [customerName, customerPhone]);
```

**File:** `src/app/pages/customer/History.tsx`

```typescript
// Tampilkan loading saat customerPhone belum tersedia
if (!customerPhone || !customerName) {
  return (
    <div className="pb-20 md:pb-8 min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        </div>
      </div>
    </div>
  );
}

// Baru filter setelah customerPhone tersedia
const customerOrders = orders.filter((order) => {
  return order.customer_name === customerName && order.customer_phone === customerPhone;
});
```

---

## 5. Fix: Driver Status Tidak Sinkron ke Customer Tracking (Issue #9)

**Masalah:** Status pengiriman bertahap dari driver panel (menuju resto → pickup → OTW → selesai) tidak terhubung ke status order customer secara realtime. Setelah driver klik "Menuju Toko", status tidak terupdate di tracking customer.

**Root Cause:**
- `updateOrderStatus` di DataContext menggunakan `.update().eq()` langsung ke tabel `orders`
- Driver (authenticated user) tidak punya RLS policy UPDATE yang benar untuk tabel `orders` (hanya ada policy `Drivers can update their assigned orders` yang memerlukan `driver_id = auth.uid()` + kolom driver_id harus sudah ada)
- RPC `update_order_status` sudah ada di database tapi tidak dipakai

### Perubahan yang Dilakukan

**File:** `src/app/contexts/DataContext.tsx`

```typescript
// BEFORE: langsung update tabel (bisa gagal karena RLS)
const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus, changedBy?: string) => {
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) throw error;

  await supabase.from("order_status_history").insert({
    order_id: orderId,
    status,
    changed_by: changedBy || null,
  });

  await refreshOrders();
}, [refreshOrders]);

// AFTER: pakai RPC update_order_status (SECURITY DEFINER, bypass RLS)
const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus, changedBy?: string) => {
  const { error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_status: status,
    p_changed_by: changedBy || null,
  });
  if (error) {
    console.error("updateOrderStatus error:", error);
    throw error;
  }

  await refreshOrders();
}, [refreshOrders]);
```

**File:** `src/app/pages/driver/DriverPanel.tsx`

- Tambah `useEffect` sync `activeOrder` dengan realtime data dari DataContext (sudah disebut di Fix #13)
- Memastikan setelah `updateOrderStatus` berhasil, `activeOrder` langsung terupdate dari `orders` array yang di-refresh via realtime subscription

---

## File yang Dibuat

Tidak ada file baru yang dibuat.

## File yang Diubah

| File | Perubahan |
|------|-----------|
| `src/app/components/ConfirmDialog.tsx` | Tambah `useState`, `processing` state, async `handleConfirm`, tombol disabled saat processing |
| `src/app/pages/driver/DriverPanel.tsx` | Rename `loading` → `actionLoading`, rename auth `loading` → `authLoading`, tambah loading spinner, sync activeOrder dengan realtime, fix semua handler |
| `src/app/pages/customer/OrderTracking.tsx` | Tambah status `pending` + `driver_assigned` ke timeline, ownership check dengan timing benar, normalisasi phone, loading state untuk `isOwner === null` |
| `src/app/layouts/CustomerLayout.tsx` | Cek `loading` dari AuthContext sebelum redirect, tambah loading spinner |
| `src/app/contexts/CartContext.tsx` | Re-hydrate cart saat `customerPhone` berubah, sync ke localStorage dengan phone-based key |
| `src/app/contexts/NotificationContext.tsx` | Tambah `toast.dismiss()` saat auth change, early return jika `!role || !customerPhone` |
| `src/app/pages/customer/Checkout.tsx` | Import `useAuth`, pre-fill customer name & phone dari AuthContext |
| `src/app/pages/customer/History.tsx` | Tampilkan loading saat `customerPhone` belum tersedia |
| `src/app/contexts/DataContext.tsx` | `updateOrderStatus` pakai RPC `update_order_status` alih-alih `.update().eq()` |

## Database

Tidak ada perubahan schema database. RPC `update_order_status` sudah ada sebelumnya.

## Build Status
- TypeScript type check: **0 errors** (`npx tsc --noEmit` ✅)
- Vite build: **SUKSES** (6.43s, no errors) ✅

---

## Cara Test

### Test Issue #13: Tombol Driver Error
1. Login sebagai driver
2. Terima pesanan yang di-assign admin
3. Setelah masuk view order aktif, tekan bertahap: Menuju Toko → Ambil Pesanan → Mulai Pengiriman → Selesaikan
4. **Expected:** Semua tombol berjalan normal, tidak ada error React, status terupdate

### Test Issue #2: Tracking Transfer Order
1. Login sebagai customer
2. Buat order dengan metode transfer
3. Buka halaman tracking order
4. **Expected:** Halaman tracking tampil normal, tidak ada "Akses Ditolak", status "Menunggu Konfirmasi" terlihat

### Test Issue #1: Refresh Page
1. Login sebagai customer
2. Buat order
3. Refresh halaman (F5)
4. **Expected:** Halaman tetap tampil, tidak redirect ke login

### Test Issue #8: Session Customer
1. Login sebagai Customer A, tambah produk ke keranjang
2. Logout
3. Login sebagai Customer B
4. **Expected:** Keranjang kosong, tidak ada notifikasi dari Customer A

### Test Issue #9: Status Sync
1. Login sebagai driver, terima pesanan
2. Klik "Menuju Toko"
3. Di tab lain, buka tracking customer
4. **Expected:** Status di tracking customer terupdate secara realtime

---

## Catatan

### Pola yang Diterapkan
1. **Async Dialog Handling:** ConfirmDialog sekarang mendukung `Promise<void>` return type dan meng-await operasi sebelum menutup
2. **Auth Loading Guard:** Semua layout/panel yang memerlukan auth harus cek `loading` state sebelum redirect
3. **Phone-based Session Isolation:** Cart dan notification sekarang scope per `customerPhone`, re-hydrate saat phone berubah
4. **RPC over Direct Update:** Update order status pakai RPC (SECURITY DEFINER) untuk bypass RLS
5. **Realtime Sync:** `activeOrder` di-driver-panel disync dengan `orders` dari DataContext via `useEffect`

### Status Order yang Lengkap (7 status)
1. `pending` — Menunggu Konfirmasi
2. `driver_assigned` — Driver Ditugaskan
3. `processing` — Diproses
4. `going-to-store` — Driver menuju toko
5. `picked-up` — Pesanan diambil
6. `on-delivery` — Dalam perjalanan
7. `completed` — Selesai
