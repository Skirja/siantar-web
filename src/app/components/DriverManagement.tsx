import { useState } from "react";
import { User, Phone, Plus, Edit2, Copy, Check, AlertCircle, Shield, Loader2 } from "lucide-react";
import { useData, Profile } from "../contexts/DataContext";
import { generateSecurePassword } from "../utils/credentialGenerator";
import { toast } from "sonner";

export function DriverManagement() {
  const { drivers, orders, addDriver, updateDriver, deactivateDriver, loadingDrivers } = useData();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editingDriver, setEditingDriver] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  const [driverForm, setDriverForm] = useState({
    name: "",
    phone: "",
  });

  const handleAddDriver = async () => {
    if (!driverForm.name || !driverForm.phone) {
      toast.error("Mohon lengkapi nama dan nomor HP");
      return;
    }

    const password = generateSecurePassword();
    const email = `driver_${driverForm.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@siantar.id`;

    setSaving(true);
    try {
      await addDriver(driverForm.name, driverForm.phone, password);
      setGeneratedCredentials({ email, password });
      setShowAddModal(false);
      setShowCredentialsModal(true);
      setDriverForm({ name: "", phone: "" });
      toast.success("Driver berhasil ditambahkan");
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan driver");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCredential = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    if (!generatedCredentials) return;
    const text = `Email: ${generatedCredentials.email}\nPassword: ${generatedCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopiedField("all");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleEditDriver = (driver: Profile) => {
    setEditingDriver(driver);
    setDriverForm({
      name: driver.name,
      phone: driver.phone || "",
    });
    setShowEditModal(true);
  };

  const handleUpdateDriver = async () => {
    if (!editingDriver) return;
    if (!driverForm.name || !driverForm.phone) {
      toast.error("Mohon lengkapi nama dan nomor HP");
      return;
    }

    setSaving(true);
    try {
      await updateDriver(editingDriver.id, {
        name: driverForm.name,
        phone: driverForm.phone,
      });
      setShowEditModal(false);
      setEditingDriver(null);
      setDriverForm({ name: "", phone: "" });
      toast.success("Data driver berhasil diperbarui");
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui data driver");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateDriver = async (driver: Profile) => {
    if (confirm(`Yakin ingin ${driver.is_active ? "menonaktifkan" : "mengaktifkan"} driver ${driver.name}?`)) {
      try {
        if (driver.is_active) {
          await deactivateDriver(driver.id);
          toast.success("Driver berhasil dinonaktifkan");
        } else {
          await updateDriver(driver.id, { is_active: true });
          toast.success("Driver berhasil diaktifkan");
        }
      } catch (error: any) {
        toast.error(error.message || "Gagal mengubah status driver");
      }
    }
  };

  const getDriverStats = (driverId: string) => {
    const driverOrders = orders.filter((o) => o.driver_id === driverId);
    const completedOrders = driverOrders.filter((o) => o.status === "completed");
    const activeOrders = driverOrders.filter(
      (o) => o.status !== "completed" && o.status !== "pending"
    );

    return {
      totalOrders: driverOrders.length,
      completed: completedOrders.length,
      active: activeOrders.length,
    };
  };

  if (loadingDrivers) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manajemen Driver</h2>
          <p className="text-sm text-gray-600 mt-1">Kelola akun driver</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Driver</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {drivers.map((driver) => {
          const stats = getDriverStats(driver.id);

          return (
            <div
              key={driver.id}
              className={`bg-white rounded-xl shadow-sm p-6 border-2 ${
                driver.is_active ? "border-transparent" : "border-red-300 opacity-75"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      driver.is_active ? "bg-orange-100" : "bg-gray-100"
                    }`}
                  >
                    <User
                      className={`w-6 h-6 ${driver.is_active ? "text-orange-600" : "text-gray-400"}`}
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {driver.name}
                      {!driver.is_active && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{driver.phone}</span>
                    </div>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm ${
                    driver.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {driver.is_active ? "Aktif" : "Nonaktif"}
                </div>
              </div>

              {/* Driver Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Total Order</div>
                  <div className="text-xl font-bold text-blue-600">{stats.totalOrders}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Selesai</div>
                  <div className="text-xl font-bold text-green-600">{stats.completed}</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Aktif</div>
                  <div className="text-xl font-bold text-orange-600">{stats.active}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditDriver(driver)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeactivateDriver(driver)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    driver.is_active
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>{driver.is_active ? "Nonaktifkan" : "Aktifkan"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tambah Driver Baru</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={driverForm.name}
                  onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                  placeholder="Contoh: Pak Ahmad"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor HP <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={driverForm.phone}
                  onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                  placeholder="08xx-xxxx-xxxx"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <div className="font-semibold mb-1">Kredensial akan dibuat otomatis</div>
                    <div className="text-blue-700">
                      Sistem akan generate email dan password yang aman. Anda akan melihat kredensial setelah driver dibuat.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={saving}
              >
                Batal
              </button>
              <button
                onClick={handleAddDriver}
                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Menambahkan...</span>
                  </>
                ) : (
                  <span>Tambah Driver</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Driver Modal */}
      {showEditModal && editingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowEditModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Driver</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={driverForm.name}
                  onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor HP <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={driverForm.phone}
                  onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDriver(null);
                  setDriverForm({ name: "", phone: "" });
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={saving}
              >
                Batal
              </button>
              <button
                onClick={handleUpdateDriver}
                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && generatedCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              setShowCredentialsModal(false);
              setGeneratedCredentials(null);
            }}
          />
          <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Kredensial Driver</h2>
                <p className="text-orange-100 text-sm">Simpan kredensial ini dengan aman</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-orange-100 mb-2">
                  Email
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/20 backdrop-blur px-4 py-3 rounded-lg font-mono text-lg break-all">
                    {generatedCredentials.email}
                  </div>
                  <button
                    onClick={() => handleCopyCredential("email", generatedCredentials.email)}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    {copiedField === "email" ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-100 mb-2">
                  Password
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/20 backdrop-blur px-4 py-3 rounded-lg font-mono text-lg">
                    {generatedCredentials.password}
                  </div>
                  <button
                    onClick={() => handleCopyCredential("password", generatedCredentials.password)}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    {copiedField === "password" ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur border-2 border-white/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold mb-1">Penting!</div>
                  <ul className="list-disc list-inside space-y-1 text-white/90">
                    <li>Simpan kredensial ini dengan aman</li>
                    <li>Berikan ke driver yang bersangkutan</li>
                    <li>Password tidak dapat dilihat lagi setelah ditutup</li>
                    <li>Driver harus login dengan kredensial ini</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopyAll}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors font-medium"
              >
                {copiedField === "all" ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Salin Semua</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setGeneratedCredentials(null);
                }}
                className="flex-1 px-4 py-3 bg-white text-orange-600 rounded-xl hover:bg-orange-50 transition-colors font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
