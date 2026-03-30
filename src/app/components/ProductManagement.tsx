import { useState } from "react";
import { Plus, Edit2, Trash2, X, Package } from "lucide-react";
import { useData } from "../contexts/DataContext";
import type { ProductWithDetails, ProductVariant, ProductExtra } from "../contexts/DataContext";
import { formatCurrency } from "../utils/financeCalculations";

export function ProductManagement() {
  const { products, outlets, addProduct, updateProduct, deleteProduct, getProductsByOutlet } = useData();
  const [selectedOutlet, setSelectedOutlet] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithDetails | null>(null);

  const [productForm, setProductForm] = useState({
    name: "",
    price: 0,
    discount_price: 0,
    description: "",
    category: "Makanan" as "Makanan" | "Minuman",
    variants: [] as ProductVariant[],
    extras: [] as ProductExtra[],
  });

  const [variantForm, setVariantForm] = useState({ name: "", price_adjustment: 0 });
  const [showVariantInput, setShowVariantInput] = useState(false);
  const [extraForm, setExtraForm] = useState({ name: "", price: 0 });
  const [showExtraInput, setShowExtraInput] = useState(false);

  const handleAddProduct = (outletId: string) => {
    setSelectedOutlet(outletId);
    setEditingProduct(null);
    setProductForm({
      name: "",
      price: 0,
      discount_price: 0,
      description: "",
      category: "Makanan",
      variants: [],
      extras: [],
    });
    setShowProductModal(true);
  };

  const handleEditProduct = (product: ProductWithDetails) => {
    setEditingProduct(product);
    setSelectedOutlet(product.outlet_id);
    setProductForm({
      name: product.name,
      price: product.price,
      discount_price: product.discount_price || 0,
      description: product.description || "",
      category: product.category as "Makanan" | "Minuman",
      variants: product.variants || [],
      extras: product.extras || [],
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price || !selectedOutlet) return;

    const productData = {
      outlet_id: selectedOutlet,
      name: productForm.name,
      price: productForm.price,
      discount_price: productForm.discount_price > 0 ? productForm.discount_price : null,
      description: productForm.description,
      category: productForm.category,
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
    } else {
      await addProduct(productData, [], []);
    }
    setShowProductModal(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Yakin ingin menghapus produk ini?")) {
      await deleteProduct(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Manajemen Produk</h2>
      </div>
      <div className="space-y-6">
        {outlets.map((outlet) => {
          const outletProducts = getProductsByOutlet(outlet.id);
          return (
            <div key={outlet.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{outlet.name}</h3>
                  <p className="text-sm text-gray-600">{outlet.village}</p>
                </div>
                <button
                  onClick={() => handleAddProduct(outlet.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Produk</span>
                </button>
              </div>
              {outletProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {outletProducts.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {product.discount_price ? (
                              <>
                                <span className="text-sm text-gray-500 line-through">{formatCurrency(product.price)}</span>
                                <span className="text-sm font-semibold text-orange-600">{formatCurrency(product.discount_price)}</span>
                              </>
                            ) : (
                              <span className="text-sm font-semibold text-gray-900">{formatCurrency(product.price)}</span>
                            )}
                          </div>
                          <span className="inline-block px-2 py-1 mt-2 text-xs bg-gray-100 text-gray-700 rounded">{product.category}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleEditProduct(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs text-gray-500">
                        {product.variants.length > 0 && <span>{product.variants.length} varian</span>}
                        {product.extras.length > 0 && <span>{product.extras.length} extra</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Belum ada produk</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowProductModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{editingProduct ? "Edit Produk" : "Tambah Produk"}</h2>
              <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Produk</label>
                <input type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Contoh: Nasi Goreng Spesial" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Harga Normal</label>
                  <input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Harga Diskon</label>
                  <input type="number" value={productForm.discount_price} onChange={(e) => setProductForm({ ...productForm, discount_price: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <button onClick={() => setShowProductModal(false)} className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                Batal
              </button>
              <button onClick={handleSaveProduct} className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium">
                Simpan Produk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
