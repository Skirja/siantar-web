import { useParams, Link } from "react-router";
import { ArrowLeft, MapPin, Plus, ShoppingCart, ImageIcon, Loader2 } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useData } from "../../contexts/DataContext";
import { useState } from "react";
import { motion } from "motion/react";
import type { ProductVariant, ProductExtra, ProductWithDetails } from "../../contexts/DataContext";

export function StoreDetail() {
  const { storeId } = useParams<{ storeId: string }>();
  const { addItem, items } = useCart();
  const { outlets, getProductsByOutlet, loadingProducts } = useData();
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedExtras, setSelectedExtras] = useState<Record<string, string[]>>({});

  const outlet = outlets.find((o) => o.id === storeId);
  const outletProducts = storeId ? getProductsByOutlet(storeId) : [];

  if (!outlet || !storeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-500 mb-4">Outlet tidak ditemukan</p>
          <Link
            to="/home"
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const calculateProductPrice = (product: ProductWithDetails) => {
    let price = product.discount_price ?? product.price;

    const variantId = selectedVariants[product.id];
    if (variantId) {
      const variant = product.variants?.find((v) => v.id === variantId);
      if (variant) price += variant.price_adjustment;
    }

    const extraIds = selectedExtras[product.id] || [];
    extraIds.forEach((extraId) => {
      const extra = product.extras?.find((e) => e.id === extraId);
      if (extra) price += extra.price;
    });

    return price;
  };

  const handleAddToCart = (product: ProductWithDetails) => {
    const variantId = selectedVariants[product.id];
    const selectedVariant = variantId
      ? product.variants?.find((v) => v.id === variantId)
      : undefined;

    const extraIds = selectedExtras[product.id] || [];
    const productExtras = extraIds
      .map((id) => product.extras?.find((e) => e.id === id))
      .filter((e): e is ProductExtra => !!e);

    const price = calculateProductPrice(product);

    addItem({
      productId: product.id,
      name: product.name,
      basePrice: product.discount_price ?? product.price,
      selectedVariant,
      selectedExtras: productExtras,
      price,
      outletId: storeId,
      outletName: outlet.name,
      imageUrl: product.image_url,
    });
  };

  return (
    <div className="pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{outlet.name}</h1>
            <div className="flex items-center gap-2 mt-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{outlet.village}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Menu</h2>

        {loadingProducts ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : outletProducts.length === 0 ? (
          /* Empty State - No Products */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <ShoppingCart className="w-16 h-16 text-orange-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Belum ada menu
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Outlet ini belum menambahkan menu. Silakan coba outlet lain atau kembali nanti.
            </p>
            <Link
              to="/home"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Kembali ke Beranda</span>
            </Link>
          </motion.div>
        ) : (
          /* Product List */
          <div className="space-y-3">
            {outletProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm p-4 flex gap-4 hover:shadow-md transition-shadow"
              >
                {/* Product Image */}
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    {!product.is_available && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex-shrink-0">
                        Habis
                      </span>
                    )}
                  </div>
                  <p className="text-orange-600 font-medium mt-1">
                    Rp {calculateProductPrice(product).toLocaleString("id-ID")}
                  </p>

                  {/* Variant Selection */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="mt-2">
                      <label className="text-sm text-gray-500">Varian:</label>
                      <select
                        className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm"
                        value={selectedVariants[product.id] || ""}
                        onChange={(e) =>
                          setSelectedVariants({
                            ...selectedVariants,
                            [product.id]: e.target.value,
                          })
                        }
                      >
                        <option value="">Pilih Varian</option>
                        {product.variants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.name} (+Rp {variant.price_adjustment.toLocaleString("id-ID")})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Extra Selection */}
                  {product.extras && product.extras.length > 0 && (
                    <div className="mt-2">
                      <label className="text-sm text-gray-500">Tambahan:</label>
                      <div className="flex flex-wrap mt-1">
                        {product.extras.map((extra) => (
                          <label key={extra.id} className="mr-2">
                            <input
                              type="checkbox"
                              className="mr-1"
                              checked={selectedExtras[product.id]?.includes(extra.id) || false}
                              onChange={(e) => {
                                const currentExtras = selectedExtras[product.id] || [];
                                if (e.target.checked) {
                                  setSelectedExtras({
                                    ...selectedExtras,
                                    [product.id]: [...currentExtras, extra.id],
                                  });
                                } else {
                                  setSelectedExtras({
                                    ...selectedExtras,
                                    [product.id]: currentExtras.filter((id) => id !== extra.id),
                                  });
                                }
                              }}
                            />
                            {extra.name} (+Rp {extra.price.toLocaleString("id-ID")})
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.is_available}
                  className="flex items-center justify-center w-10 h-10 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex-shrink-0 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <Link
          to="/home/cart"
          className="fixed bottom-20 md:bottom-8 right-4 sm:right-8 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-colors flex items-center gap-3 px-6 py-4 z-50"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-medium">
            {totalItems} Item
          </span>
        </Link>
      )}
    </div>
  );
}
