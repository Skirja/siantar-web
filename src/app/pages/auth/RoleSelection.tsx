import { useNavigate } from "react-router";
import { useTitle } from "../../hooks/useTitle";
import { motion } from "motion/react";
import { ShoppingBag, Bike, Shield, ChevronRight } from "lucide-react";
import logoImg from "../../../assets/siantar-aja-logo.png";

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor: string;
  iconBg: string;
  borderColor: string;
  delay: number;
  onClick: () => void;
}

function RoleCard({
  icon,
  title,
  description,
  accentColor,
  iconBg,
  borderColor,
  delay,
  onClick,
}: RoleCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.975 }}
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-5 rounded-2xl border ${borderColor} bg-white/10 backdrop-blur-sm hover:bg-white/[0.16] transition-colors duration-200 text-left group cursor-pointer`}
    >
      {/* Icon circle */}
      <div
        className={`flex-shrink-0 w-14 h-14 rounded-xl ${iconBg} flex items-center justify-center`}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-lg leading-tight ${accentColor}`}>
          {title}
        </p>
        <p className="text-white/60 text-sm mt-0.5">{description}</p>
      </div>

      {/* Arrow */}
      <ChevronRight
        className={`flex-shrink-0 w-5 h-5 ${accentColor} opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200`}
      />
    </motion.button>
  );
}

export function RoleSelection() {
  useTitle("Masuk sebagai");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo & heading */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex flex-col items-center mb-10"
        >
          <img src={logoImg} alt="SiAntar" className="w-40 h-auto mb-5" />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-center"
          >
            <h1 className="text-white text-2xl font-bold">Selamat Datang!</h1>
            <p className="text-white/50 text-sm mt-1">Masuk sebagai siapa?</p>
          </motion.div>
        </motion.div>

        {/* Role cards */}
        <div className="flex flex-col gap-3">
          <RoleCard
            delay={0.5}
            icon={<ShoppingBag className="w-7 h-7 text-orange-400" />}
            iconBg="bg-orange-500/20"
            accentColor="text-orange-400"
            borderColor="border-orange-500/30"
            title="Pelanggan"
            description="Pesan makanan & kirim barang"
            onClick={() => navigate("/login-customer")}
          />

          <RoleCard
            delay={0.65}
            icon={<Bike className="w-7 h-7 text-emerald-400" />}
            iconBg="bg-emerald-500/20"
            accentColor="text-emerald-400"
            borderColor="border-emerald-500/30"
            title="Driver"
            description="Kelola pengiriman saya"
            onClick={() => navigate("/login-driver")}
          />

          <RoleCard
            delay={0.8}
            icon={<Shield className="w-7 h-7 text-indigo-400" />}
            iconBg="bg-indigo-500/20"
            accentColor="text-indigo-400"
            borderColor="border-indigo-500/30"
            title="Admin"
            description="Akses panel kontrol"
            onClick={() => navigate("/login-admin")}
          />
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-center text-white/30 text-xs mt-10"
        >
          © 2026 SiAntar — Layanan Antar Terpercaya
        </motion.p>
      </div>
    </div>
  );
}
