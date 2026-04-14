import { useRouteError } from "react-router";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Logo } from "./Logo";

export function ErrorBoundaryUi() {
  const error = useRouteError();
  console.error("Application Render Error:", error);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        <div className="mb-6 flex justify-center">
          <Logo size="3xl" />
        </div>
        
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan Aplikasi</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Maaf atas ketidaknyamanannya. Terjadi kesalahan teknis saat memuat halaman ini.
        </p>

        <button
          onClick={handleReload}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#FF6A00] hover:bg-[#FF8534] text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-orange-200 active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Muat Ulang Halaman</span>
        </button>

        <div className="mt-8 pt-6 border-t border-gray-100 italic">
          <p className="text-xs text-gray-400">
            Jika masalah berlanjut, silakan hubungi admin SiAntar.
          </p>
        </div>
      </div>
    </div>
  );
}
