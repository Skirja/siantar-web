import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";

export function CustomerLayout() {
  const { role, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || role !== "customer") {
      navigate("/login-customer");
    }
  }, [isAuthenticated, role, navigate, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || role !== "customer") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Outlet />
    </div>
  );
}
