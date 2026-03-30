import { Link, useNavigate } from "react-router";
import { ArrowLeft, Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { formatCurrency } from "../../utils/financeCalculations";

export function Cart() {
  const { items, updateQuantity, removeItem, notes, setNotes, subtotal } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (items.length > 0) {
      navigate("/home/checkout");
    }
  };

  if (items.length === 0) {
    return (
      <div className="pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span>
          </Link>
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">Keranjang masih kosong</p>
            <Link
              to="/home"
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Mulai Belanja
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali</span>
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Keranjang Belanja
        </h1>

        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {items.map((item, index) => (
            <div
              key={`${item.productId}-${index}`}
              className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4"
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                {item.selectedVariant && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    Varian: {item.selectedVariant.name}
                  </p>
                )}
                {item.selectedExtras.length > 0 && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    Extra: {item.selectedExtras.map((e) => e.name).join(", ")}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1">{item.outletName}</p>
                <p className="text-orange-600 font-medium mt-2">
                  {formatCurrency(item.price)}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(index, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-medium">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(index, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeItem(index)}
                  className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Catatan untuk Driver
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Tolong belikan es batu ya"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center text-lg mb-4">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-bold text-gray-900">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
          >
            Lanjut ke Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
