# 78 - Plan Implementasi: PO / POS Numanie Pizza (Admin Panel)

**Tanggal:** 2026-04-22
**Scope:** Sistem Pre-Order Numanie Pizza berbasis admin — pencatatan, invoice, dan database customer.
**Status:** DRAFT PLAN ✍️

---

## 1. Ringkasan Eksekutif

Fitur ini adalah sistem **manual Pre-Order (PO)** yang sepenuhnya berjalan di dalam **Admin Panel** SiAntar. Tujuannya adalah menggantikan alur order Numanie Pizza yang selama ini dilakukan secara manual via WA tanpa pencatatan sistematis.

### Key Decisions (Final)
| Aspek | Keputusan |
|---|---|
| Tarif ongkir | Sistem zona utama (Hijau/Kuning/Merah) + cost_per_km dari `fee_settings` |
| Penyimpanan order | Tabel baru `numanie_orders` (terpisah dari `orders`) |
| Driver assignment | **TIDAK ADA** — Numanie punya kurir sendiri |
| Metode pembayaran | **COD saja** |
| Data customer | Tabel baru `numanie_customers` di database |

### Apa yang TIDAK Dibangun
- Tidak ada route baru (bukan `/admin/numanie`)
- Tidak ada context baru
- Tidak ada halaman customer untuk Numanie
- Tidak ada status tracking real-time
- Tidak ada markup +Rp1.000 per item
- Tidak ada potongan 20% admin

---

## 2. Analisis Codebase (Pre-Implementation Check)

### ✅ Yang Sudah Ada & Bisa Dipakai Ulang
| Komponen/Fungsi | Lokasi | Dipakai Untuk |
|---|---|---|
| `calculateDistance(lat1,lon1,lat2,lon2)` | `financeCalculations.ts` | Hitung jarak GPS Numanie → Customer |
| `formatCurrency(amount)` | `financeCalculations.ts` | Format Rp di invoice |
| `getDefaultFeeSettings()` | `financeCalculations.ts` | Fallback fee |
| `feeSettings` dari DataContext | `DataContext.tsx` | cost_per_km & zona fee |
| Tab system (Radix UI Tabs) | `components/ui/tabs.tsx` | Sub-tabs Orderan/Data Customer/Riwayat |
| WA URL generator pattern | `ManualOrderCreation.tsx` | Referensi format WA link |
| Sidebar nav pattern | `AdminPanel.tsx` | Tambah item "PO Numanie" |
| `supabase` client | `lib/supabase.ts` | Direct DB calls dari komponen baru |
| `toast` (sonner) | Sudah di-import di mana-mana | Feedback UI |
| Lucide Icons | `lucide-react` | Icons di komponen baru |

### ❌ Yang Belum Ada (Harus Dibuat)
- Tabel `numanie_customers` — belum ada
- Tabel `numanie_orders` — belum ada
- Komponen `PreOrderNumanie.tsx` — belum ada
- Fungsi `calculateNumanieFinance()` — belum ada
- Tab "PO Numanie" di AdminPanel — belum ada
- Types di `database.types.ts` — belum ada

### Konfirmasi Database
```
Query: SELECT name FROM outlets WHERE name ILIKE '%numanie%' OR name ILIKE '%pizza%'
Result: [] (kosong — tidak ada outlet Numanie di DB)
```

---

## 3. Arsitektur Sistem

```
AdminPanel.tsx
└── Tab: "PO Numanie" (activeTab === "pre-order")
    └── PreOrderNumanie.tsx (komponen utama)
        ├── Sub-Tab: "Orderan"
        │   └── Wizard Flow (4 Steps)
        │       ├── Step 1: Cart (POS menu grid + custom items)
        │       ├── Step 2: Data Customer (auto-fill dari DB)
        │       ├── Step 3: Lokasi & Ongkir (WA minta lokasi → input coords → hitung)
        │       └── Step 4: Invoice (preview → kirim WA)
        ├── Sub-Tab: "Data Customer"
        │   └── Tabel numanie_customers (search, view, delete)
        └── Sub-Tab: "Riwayat Order"
            └── Tabel numanie_orders (filter tanggal/nama/desa)
```

### Data Flow
```
Admin input cart
    ↓
Admin input customer WA
    ↓ (lookup DB)
numanie_customers → auto-fill nama, desa, last_coords
    ↓
WA button → buka WA: "Mohon share lokasi..."
    ↓ (customer balas di WA)
Admin paste koordinat → calculateDistance() → calculateNumanieFinance()
    ↓
Invoice preview muncul otomatis
    ↓
Admin klik "Kirim ke WA" → buka WA dengan pesan invoice
    ↓
INSERT numanie_orders + UPSERT numanie_customers
```

---

## 4. Fase 1 — Database Migrations

### Migration 1: `create_numanie_customers`

```sql
CREATE TABLE numanie_customers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  phone           TEXT        NOT NULL UNIQUE,
  village         TEXT,
  last_address    TEXT,
  last_latitude   NUMERIC,
  last_longitude  NUMERIC,
  order_count     INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at otomatis
CREATE TRIGGER set_numanie_customers_updated_at
  BEFORE UPDATE ON numanie_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: hanya admin yang bisa akses
ALTER TABLE numanie_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on numanie_customers"
  ON numanie_customers FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Index untuk search by phone
CREATE INDEX idx_numanie_customers_phone ON numanie_customers(phone);
CREATE INDEX idx_numanie_customers_name ON numanie_customers(name);
```

### Migration 2: `create_numanie_orders`

```sql
-- Tipe JSONB untuk items:
-- [{ "name": "Golden Bloom", "price": 55000, "quantity": 2, "item_total": 110000, "is_custom": false }]

CREATE TABLE numanie_orders (
  id                  TEXT        PRIMARY KEY,  -- Format: NP-YYYYMMDD-XXX
  customer_id         UUID        REFERENCES numanie_customers(id) ON DELETE SET NULL,
  customer_name       TEXT        NOT NULL,
  customer_phone      TEXT        NOT NULL,
  customer_village    TEXT,
  customer_latitude   NUMERIC,
  customer_longitude  NUMERIC,
  items               JSONB       NOT NULL DEFAULT '[]'::jsonb,
  subtotal            INTEGER     NOT NULL,         -- Total harga pizza saja
  delivery_fee        INTEGER     NOT NULL DEFAULT 0,
  total               INTEGER     NOT NULL,          -- subtotal + delivery_fee
  distance            REAL,                          -- Jarak dalam KM
  zone                TEXT        CHECK (zone IN ('Hijau', 'Kuning', 'Merah')),
  zone_fee            INTEGER     NOT NULL DEFAULT 0,
  total_ke_resto      INTEGER     NOT NULL,           -- = subtotal (untuk Numanie)
  total_driver_ambil  INTEGER     NOT NULL,           -- = total (kurir ambil dari customer)
  notes               TEXT,
  status              TEXT        NOT NULL DEFAULT 'completed'
                      CHECK (status IN ('completed', 'cancelled')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE TRIGGER set_numanie_orders_updated_at
  BEFORE UPDATE ON numanie_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE numanie_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on numanie_orders"
  ON numanie_orders FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Indexes untuk filter di tab Riwayat
CREATE INDEX idx_numanie_orders_created_at    ON numanie_orders(created_at DESC);
CREATE INDEX idx_numanie_orders_customer_phone ON numanie_orders(customer_phone);
CREATE INDEX idx_numanie_orders_village        ON numanie_orders(customer_village);
CREATE INDEX idx_numanie_orders_status         ON numanie_orders(status);
```

### Catatan RLS
Fungsi `is_admin()` sudah ada di DB (terlihat dari list RPCs). Kedua tabel hanya bisa diakses oleh user yang sedang login sebagai admin Supabase Auth.

---

## 5. Fase 2 — TypeScript Types

### File: `src/lib/database.types.ts`

Tambahkan interface berikut ke dalam objek `Tables`:

```typescript
// Interface untuk item di dalam JSONB column `items`
export interface NumanieOrderItem {
  name: string;
  price: number;
  quantity: number;
  item_total: number;
  is_custom: boolean;  // true = item yang ditambah manual oleh admin
}

// numanie_customers
numanie_customers: {
  Row: {
    id: string;
    name: string;
    phone: string;
    village: string | null;
    last_address: string | null;
    last_latitude: number | null;
    last_longitude: number | null;
    order_count: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    name: string;
    phone: string;
    village?: string | null;
    last_address?: string | null;
    last_latitude?: number | null;
    last_longitude?: number | null;
    order_count?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    name?: string;
    phone?: string;
    village?: string | null;
    last_address?: string | null;
    last_latitude?: number | null;
    last_longitude?: number | null;
    order_count?: number;
    updated_at?: string;
  };
};

// numanie_orders
numanie_orders: {
  Row: {
    id: string;
    customer_id: string | null;
    customer_name: string;
    customer_phone: string;
    customer_village: string | null;
    customer_latitude: number | null;
    customer_longitude: number | null;
    items: NumanieOrderItem[];
    subtotal: number;
    delivery_fee: number;
    total: number;
    distance: number | null;
    zone: 'Hijau' | 'Kuning' | 'Merah' | null;
    zone_fee: number;
    total_ke_resto: number;
    total_driver_ambil: number;
    notes: string | null;
    status: 'completed' | 'cancelled';
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id: string;
    customer_id?: string | null;
    customer_name: string;
    customer_phone: string;
    customer_village?: string | null;
    customer_latitude?: number | null;
    customer_longitude?: number | null;
    items: NumanieOrderItem[];
    subtotal: number;
    delivery_fee: number;
    total: number;
    distance?: number | null;
    zone?: 'Hijau' | 'Kuning' | 'Merah' | null;
    zone_fee?: number;
    total_ke_resto: number;
    total_driver_ambil: number;
    notes?: string | null;
    status?: 'completed' | 'cancelled';
  };
  Update: {
    status?: 'completed' | 'cancelled';
    notes?: string | null;
    updated_at?: string;
  };
};
```

---

## 6. Fase 3 — Finance Logic

### File: `src/app/utils/financeCalculations.ts`

Tambahkan di bagian bawah file (jangan ubah fungsi yang sudah ada):

```typescript
// ─── NUMANIE PIZZA FINANCE ─────────────────────────────────────────────────

export interface NumanieFinance {
  subtotal: number;           // Total harga semua pizza
  delivery_fee: number;       // Ongkir total (zone_fee + distance * cost_per_km)
  total: number;              // subtotal + delivery_fee
  distance: number;           // Jarak GPS dalam KM (1 desimal)
  zone: "Hijau" | "Kuning" | "Merah";
  zone_fee: number;           // Fee zona flat (5000/10000/15000)
  total_ke_resto: number;     // Yang dibayar ke Numanie Pizza = subtotal
  total_driver_ambil: number; // Yang dikumpulkan kurir dari customer = total
}

/**
 * Menghitung finance untuk order Numanie Pizza.
 * Tidak ada markup, tidak ada potongan admin, tidak ada driver share.
 * Ongkir menggunakan sistem zona yang sama dengan SiAntar utama.
 */
export function calculateNumanieFinance(
  subtotal: number,
  distance: number,
  fees: FeeSettings = getDefaultFeeSettings()
): NumanieFinance {
  let zone: "Hijau" | "Kuning" | "Merah";
  let zone_fee: number;

  if (distance <= 3) {
    zone = "Hijau";
    zone_fee = 5000;
  } else if (distance <= 5) {
    zone = "Kuning";
    zone_fee = 10000;
  } else {
    zone = "Merah";
    zone_fee = 15000;
  }

  const delivery_fee = zone_fee + Math.round(distance * fees.cost_per_km);
  const total = subtotal + delivery_fee;

  return {
    subtotal,
    delivery_fee,
    total,
    distance,
    zone,
    zone_fee,
    total_ke_resto: subtotal,
    total_driver_ambil: total,
  };
}
```

---

## 7. Fase 4 — Komponen Utama: `PreOrderNumanie.tsx`

**Lokasi:** `src/app/components/PreOrderNumanie.tsx`

### 7.1 Konstanta & Interface

```typescript
// Koordinat titik awal Numanie Pizza (FIXED)
const NUMANIE_COORDS = {
  lat: -2.335165954880526,
  lng: 111.19062768333109,
};

// Master menu Numanie (FIXED, tidak dari DB)
const NUMANIE_MENU: NumanieMenuItem[] = [
  { name: "Golden Bloom",      price: 55000 },
  { name: "Cheesy Bliss",      price: 50000 },
  { name: "Simple Feast",      price: 30000 },
  { name: "Beefy Bites",       price: 40000 },
  { name: "Choco Milk Cheese", price: 30000 },
  { name: "Vegie Garden",      price: 40000 },
  { name: "Fruit Pizza",       price: 40000 },
];

interface NumanieMenuItem {
  name: string;
  price: number;
}

interface NumanieCartItem extends NumanieMenuItem {
  quantity: number;
  item_total: number;
  is_custom: boolean;
}

type OrderStep = "cart" | "customer" | "location" | "invoice";
type ActiveTab  = "orderan" | "customers" | "history";
```

### 7.2 State Management (di dalam komponen utama)

```typescript
// ── Tab aktif
const [activeTab, setActiveTab] = useState<ActiveTab>("orderan");

// ── Step wizard (hanya relevan saat tab "orderan")
const [currentStep, setCurrentStep] = useState<OrderStep>("cart");

// ── STEP 1: Cart
const [cart, setCart] = useState<NumanieCartItem[]>([]);
// Form tambah custom item
const [customName, setCustomName] = useState("");
const [customPrice, setCustomPrice] = useState<number | "">("");

// ── STEP 2: Customer
const [customerName, setCustomerName] = useState("");
const [customerPhone, setCustomerPhone] = useState("");
const [customerVillage, setCustomerVillage] = useState("");
const [customerSuggestions, setCustomerSuggestions] = useState<NumanieCustomer[]>([]);
const [selectedCustomer, setSelectedCustomer] = useState<NumanieCustomer | null>(null);

// ── STEP 3: Lokasi
const [coordinateInput, setCoordinateInput] = useState("");
const [parsedCoords, setParsedCoords] = useState<{ lat: number; lng: number } | null>(null);
const [finance, setFinance] = useState<NumanieFinance | null>(null);
const [coordError, setCoordError] = useState("");

// ── STEP 4: Invoice (derived dari state di atas)

// ── Data untuk tab lain
const [customers, setCustomers] = useState<NumanieCustomer[]>([]);
const [orders, setOrders] = useState<NumanieOrder[]>([]);
const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
const [isLoadingOrders, setIsLoadingOrders] = useState(false);
const [isSaving, setIsSaving] = useState(false);

// ── Filter tab Riwayat
const [historyDateFilter, setHistoryDateFilter] = useState<"today" | "yesterday" | "all" | "custom">("today");
const [historyNameFilter, setHistoryNameFilter] = useState("");
const [historyVillageFilter, setHistoryVillageFilter] = useState("all");
const [historyCustomStart, setHistoryCustomStart] = useState("");
const [historyCustomEnd, setHistoryCustomEnd] = useState("");

// ── Filter tab Data Customer
const [customerSearchQuery, setCustomerSearchQuery] = useState("");

// DataContext untuk feeSettings
const { feeSettings } = useData();
```

### 7.3 Helper Functions

#### parseCoordinates
```typescript
const parseCoordinates = (input: string): { lat: number; lng: number } | null => {
  const parts = input.trim().split(",");
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());
  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
};
```

#### generateOrderId
```typescript
const generateOrderId = async (): Promise<string> => {
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `NP-${today}`;
  const { count } = await supabase
    .from("numanie_orders")
    .select("id", { count: "exact", head: true })
    .like("id", `${prefix}%`);
  const seq = String((count ?? 0) + 1).padStart(3, "0");
  return `${prefix}-${seq}`;
};
```

#### generateWALocationRequest
```typescript
const generateWALocationRequest = (phone: string): string => {
  const clean = phone.replace(/\D/g, "").replace(/^0/, "62");
  const msg = encodeURIComponent(
    "Hallo kak, kami dari Sianter ingin mengantarkan pesanan Pizza Numannie. " +
    "Mohon share lokasi dengan klik *Lokasi Saat Ini* (bukan lokasi terkini) ya kak 🙏"
  );
  return `https://wa.me/${clean}?text=${msg}`;
};
```

#### generateWAInvoice
```typescript
const generateWAInvoice = (): string => {
  if (!finance) return "";
  const clean = customerPhone.replace(/\D/g, "").replace(/^0/, "62");
  let msg = `🍕 *Invoice Numanie Pizza*\n\n`;
  msg += `Hallo kak *${customerName}* 😊\n`;
  msg += `Berikut detail pesanan:\n\n`;
  msg += `*Detail Pesanan:*\n`;
  cart.forEach((item) => {
    msg += `• ${item.name} x${item.quantity} = ${formatCurrency(item.item_total)}\n`;
  });
  msg += `\n`;
  msg += `Subtotal Pizza : ${formatCurrency(finance.subtotal)}\n`;
  msg += `Ongkir (${finance.zone} · ${finance.distance}km) : ${formatCurrency(finance.delivery_fee)}\n`;
  msg += `━━━━━━━━━━━━━━━\n`;
  msg += `*TOTAL : ${formatCurrency(finance.total)}*\n\n`;
  msg += `💵 Pembayaran: *COD* (bayar saat pesanan tiba)\n\n`;
  msg += `Terima kasih sudah memesan! 🙏`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
};
```

#### handleCalculateOngkir
```typescript
const handleCalculateOngkir = () => {
  setCoordError("");
  const coords = parseCoordinates(coordinateInput);
  if (!coords) {
    setCoordError("Format koordinat tidak valid. Contoh: -2.296157,111.183206");
    return;
  }
  setParsedCoords(coords);
  const distance = calculateDistance(
    NUMANIE_COORDS.lat,
    NUMANIE_COORDS.lng,
    coords.lat,
    coords.lng
  );
  const fees = feeSettings || getDefaultFeeSettings();
  const result = calculateNumanieFinance(subtotal, distance, fees);
  setFinance(result);
};
```

#### handleSaveOrder
```typescript
const handleSaveOrder = async () => {
  if (!finance || !parsedCoords) return;
  setIsSaving(true);
  try {
    // 1. Upsert customer ke numanie_customers
    const { data: upsertedCustomer } = await supabase
      .from("numanie_customers")
      .upsert(
        {
          phone: customerPhone,
          name: customerName,
          village: customerVillage,
          last_latitude: parsedCoords.lat,
          last_longitude: parsedCoords.lng,
          order_count: (selectedCustomer?.order_count ?? 0) + 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "phone", ignoreDuplicates: false }
      )
      .select()
      .single();

    // 2. Generate order ID
    const orderId = await generateOrderId();

    // 3. Insert order ke numanie_orders
    await supabase.from("numanie_orders").insert({
      id: orderId,
      customer_id: upsertedCustomer?.id ?? null,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_village: customerVillage,
      customer_latitude: parsedCoords.lat,
      customer_longitude: parsedCoords.lng,
      items: cart.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_total: item.item_total,
        is_custom: item.is_custom,
      })),
      subtotal: finance.subtotal,
      delivery_fee: finance.delivery_fee,
      total: finance.total,
      distance: finance.distance,
      zone: finance.zone,
      zone_fee: finance.zone_fee,
      total_ke_resto: finance.total_ke_resto,
      total_driver_ambil: finance.total_driver_ambil,
      status: "completed",
    });

    toast.success(`Order ${orderId} berhasil disimpan!`);
    resetWizard();
  } catch (err) {
    toast.error("Gagal menyimpan order");
    console.error(err);
  } finally {
    setIsSaving(false);
  }
};
```

#### resetWizard
```typescript
const resetWizard = () => {
  setCart([]);
  setCustomName("");
  setCustomPrice("");
  setCustomerName("");
  setCustomerPhone("");
  setCustomerVillage("");
  setSelectedCustomer(null);
  setCoordinateInput("");
  setParsedCoords(null);
  setFinance(null);
  setCoordError("");
  setCurrentStep("cart");
};
```

### 7.4 UI: Step Indicator

```
[1] Pesanan  →  [2] Customer  →  [3] Lokasi & Ongkir  →  [4] Invoice
```

Gunakan pola step indicator yang mirip dengan `ManualOrderCreation.tsx` — lingkaran bernomor dengan garis penghubung, status `current` (oranye), `done` (hijau), `upcoming` (abu-abu).

### 7.5 UI: Step 1 — Cart (POS Menu Grid)

**Layout:**
- Heading: "🍕 Pilih Menu Numanie Pizza"
- Grid 2 kolom (mobile) / 3 kolom (desktop) — 7 kartu menu
- Setiap kartu:
  - Nama pizza
  - Harga (orange, bold)
  - Tombol `−` qty `+` (qty = 0 → hanya tampil tombol `+` besar)
- Bagian bawah grid: **"+ Tambah Item Custom"** — collapsible form:
  - Input: Nama Item
  - Input: Harga (number)
  - Tombol "Tambahkan"
- **Cart Summary** (sticky di bawah / sidebar kanan di desktop):
  - List item dengan tombol hapus per item
  - Total subtotal
  - Tombol "Lanjut →" (disabled jika cart kosong)

**Logika Cart:**
```typescript
const subtotal = cart.reduce((sum, item) => sum + item.item_total, 0);

const updateQty = (name: string, delta: number) => {
  setCart(prev =>
    prev
      .map(item => item.name === name
        ? { ...item, quantity: item.quantity + delta, item_total: (item.quantity + delta) * item.price }
        : item
      )
      .filter(item => item.quantity > 0)
  );
};

const addMenuItem = (menuItem: NumanieMenuItem) => {
  setCart(prev => {
    const existing = prev.find(i => i.name === menuItem.name && !i.is_custom);
    if (existing) {
      return prev.map(i => i.name === menuItem.name && !i.is_custom
        ? { ...i, quantity: i.quantity + 1, item_total: i.item_total + i.price }
        : i
      );
    }
    return [...prev, { ...menuItem, quantity: 1, item_total: menuItem.price, is_custom: false }];
  });
};

const addCustomItem = () => {
  if (!customName.trim() || !customPrice) return;
  const price = Number(customPrice);
  if (isNaN(price) || price <= 0) {
    toast.error("Harga tidak valid");
    return;
  }
  setCart(prev => [...prev, {
    name: customName.trim(),
    price,
    quantity: 1,
    item_total: price,
    is_custom: true,
  }]);
  setCustomName("");
  setCustomPrice("");
};
```

### 7.6 UI: Step 2 — Data Customer

**Layout:**
- Heading: "👤 Data Customer"
- Field **Nomor WhatsApp** (wajib):
  - Saat admin mengetik → debounce 300ms → search `numanie_customers` by phone LIKE `%query%`
  - Jika ada hasil → tampilkan dropdown suggestion card:
    - Nama, desa, jumlah order sebelumnya
    - Klik suggestion → auto-fill semua field
  - Jika tidak ada → kosong, admin isi manual
- Field **Nama Customer** (wajib)
- Field **Desa** (dropdown — VILLAGE_GROUPS yang sama seperti di sistem utama)
- Tombol "← Kembali" dan "Lanjut →" (disabled jika nama/phone kosong)

**Auto-fill Logic:**
```typescript
const handlePhoneInput = async (value: string) => {
  setCustomerPhone(value);
  if (value.length >= 4) {
    const { data } = await supabase
      .from("numanie_customers")
      .select("*")
      .ilike("phone", `%${value}%`)
      .limit(5);
    setCustomerSuggestions(data ?? []);
  } else {
    setCustomerSuggestions([]);
  }
};

const handleSelectSuggestion = (customer: NumanieCustomer) => {
  setCustomerName(customer.name);
  setCustomerPhone(customer.phone);
  setCustomerVillage(customer.village ?? "");
  setSelectedCustomer(customer);
  setCustomerSuggestions([]);
  // Jika customer punya last coords, pre-fill coordinate input di step 3
  if (customer.last_latitude && customer.last_longitude) {
    setCoordinateInput(`${customer.last_latitude},${customer.last_longitude}`);
  }
};
```

### 7.7 UI: Step 3 — Lokasi & Ongkir

**Layout:**
- Heading: "📍 Lokasi Customer & Hitung Ongkir"
- **Section A — Minta Lokasi:**
  - Info box biru: "Minta customer share lokasi melalui WhatsApp"
  - Tombol besar `💬 Konfirmasi ke Customer` → `window.open(generateWALocationRequest(customerPhone))`
  - Info text kecil: "Setelah customer balas dengan lokasi, paste koordinatnya di bawah"
- **Section B — Input Koordinat:**
  - Label: "Koordinat Customer"
  - Input text placeholder: `-2.296157,111.183206`
  - Hint: "Copy koordinat dari pin lokasi yang dikirim customer di WhatsApp"
  - Error message (merah) jika format salah
  - Tombol `📐 Hitung Ongkir`
- **Section C — Hasil Kalkulasi** (muncul setelah hitung berhasil):
  - Card hijau/kuning/merah sesuai zona:
    - Jarak: `X.X km`
    - Zona: badge warna (🟢 Hijau / 🟡 Kuning / 🔴 Merah)
    - Zone Fee: Rp X.XXX
    - Biaya per KM: Rp X.XXX
    - **Ongkir Total: Rp X.XXX** (bold, besar)
  - Summary finansial:
    - Total ke Numanie (Resto): `Rp X.XXX` (harga pizza saja)
    - Total Driver Ambil dari Customer: `Rp X.XXX` (pizza + ongkir)
- Tombol "← Kembali" dan "Lihat Invoice →" (enabled hanya setelah ongkir dihitung)

**Jika customer repeat order dengan last_coords tersimpan:**
- Coordinate input sudah ter-pre-fill dari step 2
- Tampilkan info: "Koordinat terakhir customer ini digunakan. Ubah jika ada perubahan lokasi."
- Tapi tetap bisa diedit

### 7.8 UI: Step 4 — Invoice & Kirim

**Layout:**
- Heading: "🧾 Invoice Siap"
- **Invoice Preview Card** (desain seperti struk):
  - Header: Logo / "🍕 Numanie Pizza via SiAntar"
  - Tanggal & jam
  - Nama customer, desa
  - Divider
  - List item pesanan (nama, qty, harga satuan, total per item)
  - Divider
  - Subtotal Pizza
  - Ongkir (zona, jarak)
  - **TOTAL** (bold, besar, oranye)
  - Divider
  - Metode bayar: COD
  - Footer: "Total ke Numanie: Rp X.XXX | Total Driver Ambil: Rp X.XXX"
- **Action Buttons:**
  - Tombol utama: `💬 Kirim Invoice ke Customer` → `window.open(generateWAInvoice())`
    - Setelah klik tombol ini → trigger `handleSaveOrder()` otomatis
  - Tombol sekunder: `🔄 Mulai Order Baru` → `resetWizard()`
  - Tombol tersier: `← Kembali` (jika perlu edit koordinat)
- **Status Save:** Loading spinner selama `isSaving`, lalu toast success/error

**Catatan UX Penting:**
- Order disimpan ke DB **setelah** admin klik "Kirim Invoice ke Customer"
- Satu aksi = dua output: WA terbuka + DB tersimpan
- Jika save gagal, WA tetap sudah terbuka → tampilkan warning "Invoice terkirim tapi gagal disimpan, coba simpan ulang"
- Tombol retry save tersedia

---

## 8. Fase 5 — Tab Data Customer

**Fetch saat tab aktif:**
```typescript
useEffect(() => {
  if (activeTab === "customers") fetchCustomers();
}, [activeTab]);

const fetchCustomers = async () => {
  setIsLoadingCustomers(true);
  const { data } = await supabase
    .from("numanie_customers")
    .select("*")
    .order("order_count", { ascending: false });
  setCustomers(data ?? []);
  setIsLoadingCustomers(false);
};
```

**UI Tabel:**
| Kolom | Keterangan |
|---|---|
| Nama | Nama customer |
| No. WA | Nomor WhatsApp (clickable → buka WA) |
| Desa | Desa terakhir |
| Koordinat Terakhir | lat,lng (small text) |
| Total Order | Badge angka |
| Aksi | Tombol "Order Baru" (switch ke tab Orderan + auto-fill) |

- **Search:** Input di atas tabel untuk filter by nama atau nomor WA
- **Delete:** Tombol hapus dengan konfirmasi (hapus customer + orders terkait? → NO, hanya set `customer_id = NULL` di orders, customer tetap terhapus dari tabel customers)

---

## 9. Fase 6 — Tab Riwayat Order

**Fetch:**
```typescript
useEffect(() => {
  if (activeTab === "history") fetchOrders();
}, [activeTab]);
```

**Filter State → useMemo untuk filteredOrders** (sama pola dengan AdminPanel.tsx)

**UI:**
- Filter bar: Tanggal (today/kemarin/custom/semua) | Nama customer | Desa
- Tabel:

| Kolom | Keterangan |
|---|---|
| ID Order | `NP-20260422-001` — monospace |
| Customer | Nama (WA badge clickable) |
| Desa | Desa pengiriman |
| Items | Ringkasan: "Golden Bloom x2, +1 item" |
| Subtotal | Harga pizza |
| Ongkir | Zona badge + nominal |
| Total | Total yang dibayar customer |
| Waktu | Tanggal & jam |
| Status | Badge completed/cancelled |
| Aksi | Tombol "Batalkan" (hanya jika completed) |

- **Expand row / detail modal:** Klik baris → tampilkan detail lengkap (semua items, breakdown ongkir, koordinat, info finansial)
- **Cancel order:** Ubah status dari `completed` → `cancelled` (soft delete, tidak dihapus dari DB)
- **Export (NICE TO HAVE):** Tombol export ke Excel/CSV untuk filter aktif

---

## 10. Fase 7 — Integrasi ke AdminPanel

### File: `src/app/pages/admin/AdminPanel.tsx`

**Perubahan:**

1. **Import:**
```typescript
import { PreOrderNumanie } from "../../components/PreOrderNumanie";
import { Pizza } from "lucide-react"; // atau UtensilsCrossed
```

2. **Tambah tipe tab:**
```typescript
const [activeTab, setActiveTab] = useState<
  | "dashboard"
  | "orders"
  | "drivers"
  | "stores"
  | "finance"
  | "informasi"
  | "keuangan-driver"
  | "pengaturan"
  | "pre-order"   // ← BARU
>("dashboard");
```

3. **Tambah item navigasi:**
```typescript
const navigationItems = [
  { id: "dashboard",       label: "Dasbor",          icon: TrendingUp },
  { id: "orders",          label: "Pesanan",          icon: ShoppingBag },
  { id: "pre-order",       label: "PO Numanie",       icon: Pizza },  // ← BARU
  { id: "finance",         label: "Keuangan",         icon: DollarSign },
  { id: "drivers",         label: "Driver",           icon: Users },
  { id: "stores",          label: "Outlet",           icon: Store },
  { id: "informasi",       label: "Informasi",        icon: Bell },
  { id: "keuangan-driver", label: "Keuangan Driver",  icon: Wallet },
  { id: "pengaturan",      label: "Pengaturan",       icon: Settings },
];
```

4. **Tambah render:**
```typescript
{activeTab === "pre-order" && <PreOrderNumanie />}
```

---

## 11. Validasi & Error Handling

### Validasi Per Step

**Step 1 (Cart):**
- [ ] Minimal 1 item di cart
- [ ] Custom item: nama wajib tidak kosong
- [ ] Custom item: harga > 0

**Step 2 (Customer):**
- [ ] Nama wajib tidak kosong
- [ ] No. WA wajib, minimal 10 digit, hanya angka dan tanda +
- [ ] WA format: dimulai dengan `08`, `628`, atau `+628`

**Step 3 (Lokasi):**
- [ ] Input koordinat tidak boleh kosong
- [ ] Format `lat,lng` — dua bagian dipisah koma
- [ ] lat: angka desimal, range -90 s/d 90
- [ ] lng: angka desimal, range -180 s/d 180
- [ ] Jika koordinat sangat jauh dari area Balai Riam (>50km) → warning (bukan block): "Koordinat cukup jauh dari area operasional, pastikan benar"
- [ ] Ongkir harus sudah dihitung sebelum ke Step 4

**Step 4 (Invoice):**
- [ ] Semua data tersedia (cart, customer, finance) sebelum save

### Error States
- DB error saat fetch customers → toast error + retry button
- DB error saat save order → toast error + data tidak hilang (masih di state)
- WA tidak terbuka (popup blocked) → tampilkan link yang bisa dikopi

---

## 12. Ringkasan File yang Dibuat / Dimodifikasi

| File | Aksi | Deskripsi |
|---|---|---|
| `supabase/migrations/YYYYMMDDXXXXXX_create_numanie_customers.sql` | **BUAT** | Tabel numanie_customers + RLS |
| `supabase/migrations/YYYYMMDDXXXXXX_create_numanie_orders.sql` | **BUAT** | Tabel numanie_orders + RLS |
| `src/lib/database.types.ts` | **EDIT** | Tambah types NumanieCustomer & NumanieOrder |
| `src/app/utils/financeCalculations.ts` | **EDIT** | Tambah `calculateNumanieFinance()` & `NumanieFinance` interface |
| `src/app/components/PreOrderNumanie.tsx` | **BUAT** | Komponen utama (~600-800 baris) |
| `src/app/pages/admin/AdminPanel.tsx` | **EDIT** | Tambah tab "pre-order", import, navigationItems |

**Total modifikasi: 2 file baru SQL + 1 komponen baru + 3 file yang diedit**

---

## 13. Urutan Pengerjaan & Estimasi Waktu

```
┌─────────────────────────────────────────────────────┐
│  FASE 1 — Database (~30 menit)                      │
│  □ apply_migration: create_numanie_customers        │
│  □ apply_migration: create_numanie_orders           │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│  FASE 2 — Types + Finance Logic (~20 menit)         │
│  □ Edit database.types.ts (tambah 2 types)          │
│  □ Edit financeCalculations.ts (tambah 1 fungsi)    │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│  FASE 3 — Core Component (~2-3 jam)                 │
│  □ Buat PreOrderNumanie.tsx                         │
│    □ Step 1: Cart + Menu Grid + Custom Items        │
│    □ Step 2: Customer Form + Auto-fill              │
│    □ Step 3: Location Input + Kalkulasi Ongkir      │
│    □ Step 4: Invoice Preview + WA Send + Save       │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│  FASE 4 — Supporting Tabs (~1 jam)                  │
│  □ Tab Data Customer (tabel + search + delete)      │
│  □ Tab Riwayat Order (tabel + filter + cancel)      │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│  FASE 5 — AdminPanel Integration (~15 menit)        │
│  □ Tambah tipe tab "pre-order"                      │
│  □ Tambah navigationItems entry                     │
│  □ Tambah render condition                          │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│  FASE 6 — QA & Polish (~30 menit)                   │
│  □ TypeScript typecheck (npm run typecheck)         │
│  □ Lint (npm run lint)                              │
│  □ Test alur end-to-end manual                      │
│  □ Edge cases: cart kosong, koordinat salah, dll.   │
└─────────────────────────────────────────────────────┘
```

**Estimasi total: ~4-5 jam pengerjaan** (implementasi bersih tanpa blockers)

---

## 14. Pertanyaan Terbuka / Hal yang Perlu Konfirmasi

Semua sudah terjawab kecuali satu hal kecil yang mungkin perlu dikonfirmasi saat implementasi:

1. **Icon "PO Numanie" di sidebar** — Lucide React tidak punya icon `Pizza` di semua versi. Perlu cek versi yang terinstall. Alternatif: `UtensilsCrossed`, `ShoppingCart`, atau `ClipboardList`.

2. **Posisi tab "PO Numanie" di sidebar** — Dalam plan ini diletakkan setelah "Pesanan". Konfirmasi apakah ini posisi yang diinginkan.

3. **Apakah ada nomor WA Numanie** yang perlu di-hardcode untuk konfirmasi/pengiriman invoice? Sekarang plan menggunakan WA customer. Tidak perlu WA Numanie.

---

## 15. Catatan Teknis Tambahan

### Zona Ongkir (sama persis dengan sistem utama)
| Jarak | Zona | Zone Fee | Tambahan |
|---|---|---|---|
| 0 – 3 km | 🟢 Hijau | Rp 5.000 | + jarak × cost_per_km |
| 3 – 5 km | 🟡 Kuning | Rp 10.000 | + jarak × cost_per_km |
| > 5 km | 🔴 Merah | Rp 15.000 | + jarak × cost_per_km |

### Contoh Kalkulasi
```
Customer: 2km dari Numanie
Zone: Hijau (Rp 5.000)
Jarak tambahan: 2 × Rp 2.000 = Rp 4.000
Ongkir Total: Rp 9.000

Pesanan: Golden Bloom (55.000) + Simple Feast (30.000)
Subtotal: Rp 85.000
Ongkir: Rp 9.000
Total driver ambil: Rp 94.000
Total ke Numanie: Rp 85.000
```

### Format Order ID
```
NP-20260422-001   → Order pertama tanggal 22 April 2026
NP-20260422-002   → Order kedua hari yang sama
NP-20260423-001   → Order pertama hari berikutnya (reset)
```

---

**Status Plan:** APPROVED — Siap untuk implementasi 🚀
**Dibuat oleh:** Claude (Sonnet 4.6)
**Direview oleh:** Skirja