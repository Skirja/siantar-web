import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useTitle } from "../../hooks/useTitle";
import { motion } from "motion/react";
import { Logo } from "../../components/Logo";

export function Splash() {
  useTitle("");

  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login after 2.5 seconds
    const timer = setTimeout(() => {
      navigate("/role-select");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-white flex flex-col items-center justify-center p-4">
      {/* Logo with animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <Logo size="4xl" showText={false} className="mb-8" />

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <div className="flex gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0 }}
              className="w-3 h-3 bg-[#FF6A00] rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
              className="w-3 h-3 bg-[#FF6A00] rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
              className="w-3 h-3 bg-[#FF6A00] rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-center"
      >
        <p className="text-sm text-gray-500">
          © 2026 SiAnter - Layanan Antar Terpercaya
        </p>
      </motion.div>
    </div>
  );
}
