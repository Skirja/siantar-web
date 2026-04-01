# 01 - Eksplorasi dan Analisis Kodebase SiAntar Web

**Tanggal:** 2026-03-31  
**Scope:** Pemahaman menyeluruh terhadap kodebase siantar-web

---

## Yang Dilakukan

### 1. Eksplorasi Struktur Proyek
- Membaca direktori utama dan subdirektori (`src/`, `src/app/`, `src/lib/`, `src/styles/`, dll.)
- Menganalisis `package.json` untuk dependencies dan scripts
- Membaca konfigurasi: `vite.config.ts`, `postcss.config.mjs`, `index.html`

### 2. Analisis Git History
- Menjalankan `git log --oneline`, `git log --stat`, `git branch -a`, `git shortlog -sn`
- Mencatat 3 commit yang ada:
  - `d995670` — `init` (2026-03-30 23:25): Initial scaffold, 136 file, UI kit, semua halaman & konteks
  - `75b8d7b` — `done v1` (2026-03-31 00:45): Refactor besar, integrasi Supabase, migrasi dari mock data ke live database
  - `ebcfdfa` — `fix v1` (2026-03-31 01:12): Hotfix 1 baris di `OutletMenuManagement.tsx`

### 3. Pembacaan Seluruh Source Code
Dibaca dan dianalisis setiap file secara menyeluruh (bukan hanya komentar):

#### Konteks (State Management)
| File | Fungsi |
|------|--------|
| `src/app/contexts/AuthContext.tsx` | Autentikasi 3 role (Customer pakai localStorage, Admin/Driver pakai Supabase Auth) |
| `src/app/contexts/DataContext.tsx` | Central data store, semua CRUD untuk outlets, products, orders, drivers, fees, distances |
| `src/app/contexts/CartContext.tsx` | State keranjang belanja (in-memory) |
| `src/app/contexts/NotificationContext.tsx` | Notifikasi in-app + wrapper Sonner toast |

#### Halaman Auth
| File | Fungsi |
|------|--------|
| `src/app/pages/auth/Splash.tsx` | Splash screen animasi, auto-redirect ke login |
| `src/app/pages/auth/LoginCustomer.tsx` | Login customer (nama + nomor HP, tanpa password) |
| `src/app/pages/auth/LoginAdmin.tsx` | Login admin (email + password via Supabase) |
| `src/app/pages/auth/LoginDriver.tsx` | Login driver (email + password via Supabase) |

#### Halaman Customer
| File | Fungsi |
|------|--------|
| `src/app/pages/customer/Home.tsx` | Daftar outlet dengan pencarian & filter kategori |
| `src/app/pages/customer/StoreDetail.tsx` | Katalog produk per outlet, pilih variant/extra, tambah ke keranjang |
| `src/app/pages/customer/Cart.tsx` | Review keranjang, kontrol kuantitas, catatan driver |
| `src/app/pages/customer/Checkout.tsx` | Form checkout, pilih desa, metode bayar, kalkulasi ongkir |
| `src/app/pages/customer/PaymentInstruction.tsx` | Instruksi transfer, upload bukti bayar |
| `src/app/pages/customer/OrderTracking.tsx` | Tracking real-time status pesanan, info driver |
| `src/app/pages/customer/History.tsx` | Riwayat pesanan customer |
| `src/app/pages/customer/ServiceSelection.tsx` | Pilih layanan: Pesan Makanan atau Kirim Barang |
| `src/app/pages/customer/KirimBarang.tsx` | Form pengiriman paket/barang |

#### Halaman Admin
| File | Fungsi |
|------|--------|
| `src/app/pages/admin/AdminPanel.tsx` | Dashboard admin: 5 tab (Dashboard, Orders, Finance, Drivers, Stores) |
| `src/app/pages/admin/OutletMenuManagement.tsx` | CRUD menu per outlet (produk + variant + extra) |
| `src/app/pages/admin/Settings.tsx` | Pengaturan akun pembayaran & konfigurasi fee |

#### Halaman Driver
| File | Fungsi |
|------|--------|
| `src/app/pages/driver/DriverPanel.tsx` | Dashboard driver: order assigned, stats, bonus, update status |

#### Komponen Kustom
| File | Fungsi |
|------|--------|
| `src/app/components/Navbar.tsx` | Navigasi customer (desktop + mobile bottom bar) |
| `src/app/components/FinanceDashboard.tsx` | Dashboard finansial dengan chart, filter, export Excel |
| `src/app/components/InvoiceModal.tsx` | Generate invoice thermal receipt (58mm/80mm) |
| `src/app/components/DriverManagement.tsx` | CRUD driver, generate kredential otomatis |
| `src/app/components/ManualOrderCreation.tsx` | Wizard buat order manual (dari WhatsApp) |
| `src/app/components/Logo.tsx` | Komponen logo SiAntar |
| `src/app/components/ConfirmDialog.tsx` | Dialog konfirmasi reusable |
| `src/app/components/ProtectedRoute.tsx` | Guard rute (tidak aktif dipakai, proteksi inline) |
| `src/app/components/NotificationPanel.tsx` | Panel notifikasi slide-out |

#### Infrastruktur
| File | Fungsi |
|------|--------|
| `src/lib/supabase.ts` | Inisialisasi client Supabase + helper storage |
| `src/lib/database.types.ts` | Tipe TypeScript auto-generated untuk 10 tabel database |
| `src/app/utils/financeCalculations.ts` | Kalkulasi ongkir, fee, bonus driver, format mata uang |
| `src/app/utils/credentialGenerator.ts` | Generate username/password driver, hash password |

### 4. Pemetaan Database (10 Tabel Supabase)
- `outlets` — Toko/restoran
- `products` — Menu produk
- `product_variants` — Varian produk (ukuran/tipe)
- `product_extras` — Tambahan/topping
- `orders` — Pesanan utama
- `order_items` — Item per pesanan
- `order_status_history` — Audit trail perubahan status
- `profiles` — Profil user (name, phone, role, village)
- `fee_settings` — Konfigurasi fee (cost_per_km, service_fee, admin_fee, dll.)
- `distance_matrix` — Data jarak antar desa
- `payment_accounts` — Akun bank/e-wallet untuk transfer

### 5. Pemetaan Alur Data
```
Customer: Login → ServiceSelection → Home → StoreDetail → Cart → Checkout → PaymentInstruction/OrderTracking → History
Admin:    Login → AdminPanel (Dashboard/Orders/Finance/Drivers/Stores) → OutletMenuManagement → Settings
Driver:   Login → DriverPanel (assigned orders, status update, earnings)
```

---

## Temuan Kunci

1. **Proyek dibuat dalam ~2 jam** oleh 1 kontributor (Skirja) pada 30-31 Maret 2026
2. **Tidak ada test** — tidak ada file test, tidak ada dependency testing
3. **Supabase anon key hardcoded** di `src/lib/supabase.ts`
4. **Customer auth sangat sederhana** — hanya nama + nomor HP, disimpan di localStorage
5. **Order auto-refresh setiap 3 detik** di OrderTracking (polling, bukan realtime subscription)
6. **8 desa hardcoded** di Checkout dan KirimBarang (area Balai Riam)
7. **Model pricing**: delivery fee = cost_per_km × max(distance, min_distance), driver dapat 80%, admin dapat 20% + service_fee + admin_fee
8. **ProtectedRoute tidak aktif** — proteksi dilakukan inline di CustomerLayout/AdminPanel/DriverPanel
