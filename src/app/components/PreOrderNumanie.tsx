import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  formatCurrency,
  calculateDistance,
  calculateNumanieFinance,
  getDefaultFeeSettings,
  NumanieFinance,
  FeeSettings,
} from "../utils/financeCalculations";
import { useData } from "../contexts/DataContext";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Calculator,
  MessageCircle,
  FileText,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  XCircle,
  Printer,
} from "lucide-react";
import { Database } from "../../lib/database.types";
import { NumanieInvoiceModal } from "./NumanieInvoiceModal";

type NumanieOrder = Database["public"]["Tables"]["numanie_orders"]["Row"];
type NumanieCustomer =
  Database["public"]["Tables"]["numanie_customers"]["Row"];

const VILLAGE_GROUPS = [
  "Desa Bukit Sungkai",
  "Desa Sekuningan Baru",
  "Desa Balai Riam (Pusat Kecamatan)",
  "Desa Bangun Jaya",
  "Desa Lupu Peruca",
  "Desa Natai Kondang",
  "Desa Ajang",
  "Desa Air Dua",
  "Desa Jihing",
  "Desa Semantun",
];

const NUMANIE_COORDS = {
  lat: -2.335165954880526,
  lng: 111.19062768333109,
};

const NUMANIE_MENU: NumanieMenuItem[] = [
  { name: "Golden Bloom", price: 55000 },
  { name: "Cheesy Bliss", price: 50000 },
  { name: "Simple Feast", price: 30000 },
  { name: "Beefy Bites", price: 40000 },
  { name: "Choco Milk Cheese", price: 30000 },
  { name: "Vegie Garden", price: 40000 },
  { name: "Fruit Pizza", price: 40000 },
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
type ActiveTab = "orderan" | "customers" | "history";

export function PreOrderNumanie() {
  const { feeSettings } = useData();

  const [activeTab, setActiveTab] = useState<ActiveTab>("orderan");
  const [currentStep, setCurrentStep] = useState<OrderStep>("cart");

  // Step 1: Cart
  const [cart, setCart] = useState<NumanieCartItem[]>([]);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState<number | "">("");

  // Step 2: Customer
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerVillage, setCustomerVillage] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<
    NumanieCustomer[]
  >([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<NumanieCustomer | null>(null);

  // Step 3: Lokasi
  const [coordinateInput, setCoordinateInput] = useState("");
  const [parsedCoords, setParsedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [finance, setFinance] = useState<NumanieFinance | null>(null);
  const [coordError, setCoordError] = useState("");

  // Other Tabs Data
  const [customers, setCustomers] = useState<NumanieCustomer[]>([]);
  const [orders, setOrders] = useState<NumanieOrder[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // History Filters
  const [historyDateFilter, setHistoryDateFilter] = useState<
    "today" | "yesterday" | "all" | "custom"
  >("today");
  const [historyNameFilter, setHistoryNameFilter] = useState("");
  const [historyVillageFilter, setHistoryVillageFilter] = useState("all");
  const [historyCustomStart, setHistoryCustomStart] = useState("");
  const [historyCustomEnd, setHistoryCustomEnd] = useState("");

  // Customer Filters
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

  // Invoice Modal
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<NumanieOrder | null>(null);
  const [lastSavedOrder, setLastSavedOrder] = useState<NumanieOrder | null>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.item_total, 0);

  // --- Helper Functions ---
  const parseCoordinates = (
    input: string,
  ): { lat: number; lng: number } | null => {
    const parts = input.trim().split(",");
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    if (isNaN(lat) || isNaN(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng };
  };

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

  const generateWALocationRequest = (phone: string): string => {
    const clean = phone.replace(/\D/g, "").replace(/^0/, "62");
    const msg = encodeURIComponent(
      "Hallo kak, kami dari Sianter ingin mengantarkan pesanan Pizza Numannie. Mohon share lokasi dengan klik *Lokasi Saat Ini* (bukan lokasi terkini) ya kak 🙏",
    );
    return `https://wa.me/${clean}?text=${msg}`;
  };

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
    setLastSavedOrder(null);
    setCurrentStep("cart");
  };

  // --- Cart Actions ---
  const updateQty = (name: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.name === name
            ? {
                ...item,
                quantity: item.quantity + delta,
                item_total: (item.quantity + delta) * item.price,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const addMenuItem = (menuItem: NumanieMenuItem) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.name === menuItem.name && !i.is_custom,
      );
      if (existing) {
        return prev.map((i) =>
          i.name === menuItem.name && !i.is_custom
            ? {
                ...i,
                quantity: i.quantity + 1,
                item_total: i.item_total + i.price,
              }
            : i,
        );
      }
      return [
        ...prev,
        {
          ...menuItem,
          quantity: 1,
          item_total: menuItem.price,
          is_custom: false,
        },
      ];
    });
  };

  const addCustomItem = () => {
    if (!customName.trim() || !customPrice) return;
    const price = Number(customPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Harga tidak valid");
      return;
    }
    setCart((prev) => [
      ...prev,
      {
        name: customName.trim(),
        price,
        quantity: 1,
        item_total: price,
        is_custom: true,
      },
    ]);
    setCustomName("");
    setCustomPrice("");
  };

  // --- Customer Actions ---
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
    if (customer.last_latitude && customer.last_longitude) {
      setCoordinateInput(
        `${customer.last_latitude},${customer.last_longitude}`,
      );
    }
  };

  // --- Location & Finance Actions ---
  const handleCalculateOngkir = () => {
    setCoordError("");
    const coords = parseCoordinates(coordinateInput);
    if (!coords) {
      setCoordError(
        "Format koordinat tidak valid. Contoh: -2.296157,111.183206",
      );
      return;
    }
    setParsedCoords(coords);
    const distance = calculateDistance(
      NUMANIE_COORDS.lat,
      NUMANIE_COORDS.lng,
      coords.lat,
      coords.lng,
    );
    const fees = (feeSettings as unknown as FeeSettings) || getDefaultFeeSettings();
    const result = calculateNumanieFinance(subtotal, distance, fees);
    setFinance(result);
  };

  const handleSaveOrder = async () => {
    if (!finance || !parsedCoords) return;
    setIsSaving(true);
    try {
      // Upsert customer
      const { data: upsertedCustomer, error: upsertError } = await supabase
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
          { onConflict: "phone", ignoreDuplicates: false },
        )
        .select()
        .single();
        
      if (upsertError) throw upsertError;

      const orderId = await generateOrderId();

      const newOrder = {
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
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from("numanie_orders").insert(newOrder);

      if (insertError) throw insertError;

      toast.success(`Order ${orderId} berhasil disimpan!`);
      setLastSavedOrder(newOrder as unknown as NumanieOrder);
    } catch (err: any) {
      toast.error("Gagal menyimpan order");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Fetching Data for Tabs ---
  useEffect(() => {
    if (activeTab === "customers") {
      fetchCustomers();
    } else if (activeTab === "history") {
      fetchOrders();
    }
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

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    const { data } = await supabase
      .from("numanie_orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders(data ?? []);
    setIsLoadingOrders(false);
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        c.phone.includes(customerSearchQuery),
    );
  }, [customers, customerSearchQuery]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Status isn't filtered as all are completed/cancelled, but if needed we can add.
      if (
        historyVillageFilter !== "all" &&
        o.customer_village !== historyVillageFilter
      )
        return false;
      if (
        historyNameFilter &&
        !o.customer_name
          .toLowerCase()
          .includes(historyNameFilter.toLowerCase())
      )
        return false;

      const orderDate = new Date(o.created_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      if (historyDateFilter === "today") {
        return orderDate >= today;
      } else if (historyDateFilter === "yesterday") {
        const tomorrow = new Date(yesterday);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return orderDate >= yesterday && orderDate < tomorrow;
      } else if (historyDateFilter === "custom") {
        if (historyCustomStart) {
          const start = new Date(historyCustomStart);
          start.setHours(0, 0, 0, 0);
          if (orderDate < start) return false;
        }
        if (historyCustomEnd) {
          const end = new Date(historyCustomEnd);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) return false;
        }
      }
      return true;
    });
  }, [
    orders,
    historyDateFilter,
    historyNameFilter,
    historyVillageFilter,
    historyCustomStart,
    historyCustomEnd,
  ]);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Yakin membatalkan order ini?")) return;
    try {
      const { error } = await supabase
        .from("numanie_orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);
      if (error) throw error;
      toast.success("Order dibatalkan");
      fetchOrders();
    } catch (err: any) {
      toast.error("Gagal membatalkan order");
    }
  };

  const handleSetCustomerNull = async (customerId: string) => {
    if (!confirm("Yakin menghapus referensi pelanggan ini dari database?")) return;
    try {
        const { error } = await supabase.from('numanie_customers').delete().eq('id', customerId);
        if (error) throw error;
        toast.success("Data customer berhasil dihapus");
        fetchCustomers();
    } catch (err: any) {
        toast.error("Gagal menghapus pelanggan");
    }
  };


  // --- Render Steps ---
  const renderStepCart = () => (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          🍕 Pilih Menu Numanie Pizza
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {NUMANIE_MENU.map((menu) => {
            const inCart = cart.find(
              (i) => i.name === menu.name && !i.is_custom,
            );
            return (
              <div
                key={menu.name}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-medium text-gray-800">{menu.name}</h4>
                  <p className="text-orange-600 font-bold mt-1">
                    {formatCurrency(menu.price)}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-end">
                  {inCart ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQty(menu.name, -1)}
                        className="w-8 h-8 flex justify-center items-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold">{inCart.quantity}</span>
                      <button
                        onClick={() => updateQty(menu.name, 1)}
                        className="w-8 h-8 flex justify-center items-center rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addMenuItem(menu)}
                      className="w-full py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 font-medium rounded-lg flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Tambah
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-orange-500" /> Tambah Item Custom
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nama Item"
              className="flex-1 px-3 py-2 border rounded-lg"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
            <input
              type="number"
              placeholder="Harga"
              className="w-32 px-3 py-2 border rounded-lg"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : "")}
            />
            <button
              onClick={addCustomItem}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-fit sticky top-4">
        <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b">
          Keranjang
        </h3>
        {cart.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            Belum ada pesanan
          </p>
        ) : (
          <div className="space-y-4 mb-4">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-sm">
                <div>
                  <div className="font-medium text-gray-800">
                    {item.name} {item.is_custom && <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">Custom</span>}
                  </div>
                  <div className="text-gray-500">
                    {item.quantity} x {formatCurrency(item.price)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatCurrency(item.item_total)}</span>
                  <button
                    onClick={() => updateQty(item.name, -item.quantity)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="border-t pt-4">
          <div className="flex justify-between font-bold text-lg mb-4">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <button
            onClick={() => setCurrentStep("customer")}
            disabled={cart.length === 0}
            className="w-full py-3 bg-orange-500 text-white rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-orange-600"
          >
            Lanjut <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderStepCustomer = () => (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        👤 Data Customer
      </h3>
      <div className="space-y-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nomor WhatsApp
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            placeholder="Contoh: 08123456789"
            value={customerPhone}
            onChange={(e) => handlePhoneInput(e.target.value)}
          />
          {customerSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {customerSuggestions.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => handleSelectSuggestion(cust)}
                  className="p-3 hover:bg-orange-50 cursor-pointer border-b last:border-0"
                >
                  <div className="font-medium">{cust.name}</div>
                  <div className="text-sm text-gray-500">
                    {cust.phone} • {cust.village} • {cust.order_count} orders
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Customer
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            placeholder="Nama lengkap"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Desa
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            value={customerVillage}
            onChange={(e) => setCustomerVillage(e.target.value)}
          >
            <option value="">Pilih Desa...</option>
            {VILLAGE_GROUPS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => setCurrentStep("cart")}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Kembali
          </button>
          <button
            onClick={() => setCurrentStep("location")}
            disabled={!customerName || !customerPhone || !customerVillage}
            className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-bold disabled:opacity-50 hover:bg-orange-600 flex items-center justify-center gap-2"
          >
            Lanjut <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderStepLocation = () => (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        📍 Lokasi Customer & Hitung Ongkir
      </h3>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-blue-900 mb-2">Minta Lokasi di WhatsApp</h4>
        <p className="text-sm text-blue-800 mb-4">
          Klik tombol di bawah ini untuk meminta customer mengirimkan lokasinya via WhatsApp. Setelah dibalas, salin koordinatnya ke kolom di bawah.
        </p>
        <button
          onClick={() => window.open(generateWALocationRequest(customerPhone), "_blank")}
          className="bg-[#25D366] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-[#128C7E] w-full justify-center"
        >
          <MessageCircle className="w-5 h-5" />
          Minta Lokasi ke Customer
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Koordinat Customer
        </label>
        <input
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          placeholder="Contoh: -2.296157, 111.183206"
          value={coordinateInput}
          onChange={(e) => setCoordinateInput(e.target.value)}
        />
        {coordError && <p className="text-red-500 text-xs mt-1">{coordError}</p>}
        {selectedCustomer?.last_latitude && (
          <p className="text-xs text-gray-500 mt-1">
            * Menggunakan koordinat terakhir dari database.
          </p>
        )}
        <button
          onClick={handleCalculateOngkir}
          className="mt-3 w-full bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 flex items-center justify-center gap-2"
        >
          <Calculator className="w-4 h-4" />
          Hitung Ongkir
        </button>
      </div>

      {finance && (
        <div className={`rounded-xl p-4 mb-6 border ${finance.zone === 'Hijau' ? 'bg-green-50 border-green-200' : finance.zone === 'Kuning' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-800">Jarak</span>
            <span className="font-bold">{finance.distance} km</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-800">Zona</span>
            <span className="font-bold px-2 py-0.5 rounded text-xs bg-white shadow-sm">
              {finance.zone}
            </span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-black/10 mt-3">
            <span className="font-bold text-gray-900">Total Ongkir</span>
            <span className="font-bold text-xl text-orange-600">{formatCurrency(finance.delivery_fee)}</span>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => setCurrentStep("customer")}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Kembali
        </button>
        <button
          onClick={() => setCurrentStep("invoice")}
          disabled={!finance}
          className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-bold disabled:opacity-50 hover:bg-orange-600 flex items-center justify-center gap-2"
        >
          Lihat Invoice <FileText className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderStepInvoice = () => (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-6 rounded-t-xl shadow-sm border border-gray-200 border-b-0 border-dashed relative">
        <div className="absolute -left-2 -right-2 bottom-0 border-b-2 border-dashed border-gray-300"></div>
        <div className="text-center mb-6">
          <h2 className="text-xl font-black text-gray-900 uppercase">🍕 Numanie Pizza via SiAntar</h2>
          <p className="text-sm text-gray-500">{format(new Date(), "dd MMM yyyy, HH:mm")}</p>
        </div>
        <div className="mb-4">
          <p className="font-bold text-gray-800">{customerName}</p>
          <p className="text-sm text-gray-600">{customerPhone}</p>
          <p className="text-sm text-gray-600">{customerVillage}</p>
        </div>
        <div className="border-t border-b border-gray-200 py-3 mb-4 space-y-2">
          {cart.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.name}</span>
              <span>{formatCurrency(item.item_total)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal Pizza</span>
            <span>{formatCurrency(finance?.subtotal ?? 0)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Ongkir ({finance?.zone} · {finance?.distance}km)</span>
            <span>{formatCurrency(finance?.delivery_fee ?? 0)}</span>
          </div>
        </div>
        <div className="flex justify-between items-center text-lg font-black text-orange-600 mb-4">
          <span>TOTAL BAYAR (COD)</span>
          <span>{formatCurrency(finance?.total ?? 0)}</span>
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-b-xl shadow-sm border border-gray-200 border-t-0 text-center text-xs text-gray-500">
        <p>Resto Numanie: {formatCurrency(finance?.total_ke_resto ?? 0)}</p>
        <p>Kurir Ambil: {formatCurrency(finance?.total_driver_ambil ?? 0)}</p>
      </div>

      <div className="mt-6 space-y-3">
        {!lastSavedOrder ? (
          <>
            <button
              onClick={handleSaveOrder}
              disabled={isSaving}
              className="w-full bg-orange-500 text-white px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-orange-600 disabled:opacity-50"
            >
              {isSaving ? "Menyimpan..." : <><CheckCircle2 className="w-5 h-5" /> Simpan Pesanan</>}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentStep("location")}
                disabled={isSaving}
                className="flex-1 px-4 py-2 border border-gray-300 bg-white rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Kembali
              </button>
              <button
                onClick={resetWizard}
                disabled={isSaving}
                className="flex-1 px-4 py-2 border border-gray-300 bg-white rounded-lg text-red-600 font-medium hover:bg-gray-50"
              >
                Batal & Ulangi
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg flex items-center gap-2 mb-4 justify-center font-medium">
              <CheckCircle2 className="w-5 h-5" /> Pesanan Berhasil Disimpan!
            </div>
            <button
              onClick={() => setSelectedOrderForInvoice(lastSavedOrder)}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700"
            >
              <Printer className="w-5 h-5" /> Cetak Struk
            </button>
            <button
              onClick={resetWizard}
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-800"
            >
              <Plus className="w-5 h-5" /> Buat Order Baru
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab("orderan")}
          className={`px-4 py-2 font-medium rounded-full whitespace-nowrap transition-colors ${activeTab === "orderan" ? "bg-orange-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
        >
          Buat Orderan Baru
        </button>
        <button
          onClick={() => setActiveTab("customers")}
          className={`px-4 py-2 font-medium rounded-full whitespace-nowrap transition-colors ${activeTab === "customers" ? "bg-orange-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
        >
          Data Customer
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 font-medium rounded-full whitespace-nowrap transition-colors ${activeTab === "history" ? "bg-orange-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
        >
          Riwayat Order
        </button>
      </div>

      {/* Tab: Orderan */}
      {activeTab === "orderan" && (
        <div className="space-y-6">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep === "cart" ? "bg-orange-500 text-white" : "bg-green-500 text-white"}`}>
                {currentStep === "cart" ? "1" : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div className={`w-16 h-1 ${currentStep === "cart" ? "bg-gray-200" : "bg-green-500"}`}></div>
              
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep === "customer" ? "bg-orange-500 text-white" : currentStep === "location" || currentStep === "invoice" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                {currentStep === "customer" ? "2" : currentStep === "location" || currentStep === "invoice" ? <CheckCircle2 className="w-5 h-5" /> : "2"}
              </div>
              <div className={`w-16 h-1 ${currentStep === "cart" || currentStep === "customer" ? "bg-gray-200" : "bg-green-500"}`}></div>

              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep === "location" ? "bg-orange-500 text-white" : currentStep === "invoice" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                {currentStep === "location" ? "3" : currentStep === "invoice" ? <CheckCircle2 className="w-5 h-5" /> : "3"}
              </div>
              <div className={`w-16 h-1 ${currentStep === "invoice" ? "bg-green-500" : "bg-gray-200"}`}></div>

              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep === "invoice" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                4
              </div>
            </div>
          </div>

          {currentStep === "cart" && renderStepCart()}
          {currentStep === "customer" && renderStepCustomer()}
          {currentStep === "location" && renderStepLocation()}
          {currentStep === "invoice" && renderStepInvoice()}
        </div>
      )}

      {/* Tab: Customers */}
      {activeTab === "customers" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau WhatsApp..."
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
            <button onClick={fetchCustomers} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <RefreshCw className={`w-5 h-5 ${isLoadingCustomers ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">Nama Customer</th>
                  <th className="px-4 py-3 font-medium text-gray-700">WhatsApp</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Desa</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Total Order</th>
                  <th className="px-4 py-3 font-medium text-gray-700 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Tidak ada data customer</td>
                  </tr>
                ) : (
                  filteredCustomers.map(cust => (
                    <tr key={cust.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{cust.name}</td>
                      <td className="px-4 py-3">
                        <a href={`https://wa.me/${cust.phone.replace(/\D/g, "").replace(/^0/, "62")}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" /> {cust.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{cust.village || "-"}</td>
                      <td className="px-4 py-3">
                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">{cust.order_count}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            resetWizard();
                            setCustomerName(cust.name);
                            setCustomerPhone(cust.phone);
                            setCustomerVillage(cust.village || "");
                            if (cust.last_latitude && cust.last_longitude) {
                              setCoordinateInput(`${cust.last_latitude},${cust.last_longitude}`);
                            }
                            setSelectedCustomer(cust);
                            setActiveTab("orderan");
                            setCurrentStep("cart");
                          }}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg mr-2"
                        >
                          Order Baru
                        </button>
                        <button
                          onClick={() => handleSetCustomerNull(cust.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: History */}
      {activeTab === "history" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center bg-gray-50">
            <select
              value={historyDateFilter}
              onChange={(e) => setHistoryDateFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="today">Hari Ini</option>
              <option value="yesterday">Kemarin</option>
              <option value="all">Semua Waktu</option>
            </select>
            <input
              type="text"
              placeholder="Cari nama..."
              value={historyNameFilter}
              onChange={(e) => setHistoryNameFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm flex-1 min-w-[150px] max-w-[250px]"
            />
            <select
              value={historyVillageFilter}
              onChange={(e) => setHistoryVillageFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="all">Semua Desa</option>
              {VILLAGE_GROUPS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <button onClick={fetchOrders} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg ml-auto bg-white border">
              <RefreshCw className={`w-5 h-5 ${isLoadingOrders ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">ID Order / Waktu</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Customer</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Subtotal</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Ongkir</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Total</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-700 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Tidak ada riwayat pesanan</td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-medium bg-gray-100 px-1.5 py-0.5 rounded w-fit mb-1">{order.id}</div>
                        <div className="text-xs text-gray-500">{format(new Date(order.created_at), "dd MMM HH:mm")}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-xs text-gray-500">{order.customer_village}</div>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(order.subtotal)}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{formatCurrency(order.delivery_fee)}</div>
                        <div className="text-[10px] text-gray-500">{order.zone} · {order.distance}km</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-orange-600">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3">
                        {order.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle2 className="w-3 h-3" /> Selesai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <XCircle className="w-3 h-3" /> Dibatalkan
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {order.status === "completed" && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedOrderForInvoice(order)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Cetak Struk"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg"
                            >
                              Batalkan
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedOrderForInvoice && (
        <NumanieInvoiceModal
          order={selectedOrderForInvoice}
          onClose={() => setSelectedOrderForInvoice(null)}
        />
      )}
    </div>
  );
}
