import { useNavigate } from "react-router";
import { useTitle } from "../../hooks/useTitle";
import { ShoppingBag, Package, ArrowRight, Clock } from "lucide-react";
import { Logo } from "../../components/Logo";

export function ServiceSelection() {
  useTitle("Pilih Layanan");
  const navigate = useNavigate();


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Selamat Datang di SiAnter
          </h1>
          <p className="text-gray-300 text-lg">
            Pilih layanan yang Anda butuhkan
          </p>
        </div>

        {/* Service Options */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Pesan Makanan */}
          <button
            onClick={() => navigate("/home")}
            className="group relative bg-gradient-to-br from-[#FF6A00] to-orange-600 rounded-2xl p-8 hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 text-left"
          >
            <div className="absolute top-4 right-4 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>

            <div className="mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                <ShoppingBag className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Pesan Makanan
              </h2>
              <p className="text-white/80 text-sm">
                Pesan makanan dan minuman dari outlet favorit Anda
              </p>
            </div>

            <div className="space-y-2 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white/70 rounded-full" />
                <span>Pilih dari berbagai outlet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white/70 rounded-full" />
                <span>Lacak pesanan real-time</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/20">
              <span className="text-white font-medium flex items-center justify-between">
                <span>Mulai Pesan</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </button>

          {/* SiAnter Sehat (Coming Soon) */}
          <div className="group relative bg-gradient-to-br from-green-900/40 via-green-800/40 to-green-900/40 rounded-2xl p-8 border border-green-500/20 opacity-60 cursor-not-allowed">
            <div className="absolute top-4 right-4 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-white/30" />
            </div>

            <div className="mb-6 text-left">
              <div className="w-20 h-20 bg-green-500/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 border border-green-500/20">
                <span className="text-4xl filter grayscale">💚</span>
              </div>
              <h2 className="text-2xl font-bold text-white/60 mb-2">
                SiAnter Sehat
              </h2>
              <p className="text-white/40 text-sm">
                Layanan pengantaran obat dan kebutuhan medis
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-white/30 font-bold uppercase tracking-widest text-xs italic">
                Segera Hadir
              </span>
            </div>
          </div>

          {/* Antar Barang (Not Available) */}
          <div className="group relative bg-gradient-to-br from-indigo-900/40 via-indigo-800/40 to-indigo-900/40 rounded-2xl p-8 border border-indigo-500/20 opacity-60 cursor-not-allowed">
            <div className="absolute top-4 right-4 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-white/30" />
            </div>

            <div className="mb-6 text-left">
              <div className="w-20 h-20 bg-indigo-500/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20">
                <Package className="w-10 h-10 text-white/40" />
              </div>
              <h2 className="text-2xl font-bold text-white/60 mb-2">
                Antar Barang
              </h2>
              <p className="text-white/40 text-sm">
                Layanan pindahan dan antar barang volume besar
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-white/30 font-bold uppercase tracking-widest text-xs italic">
                Belum Tersedia
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            SiAnter - Layanan Antar Cepat & Terpercaya
          </p>
        </div>
      </div>
    </div>
  );
}
