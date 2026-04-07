import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";
import { subscribeToTable, unsubscribe } from "../../lib/realtime";
import type { Tables } from "../../lib/database.types";
import { useAuth } from "./AuthContext";

type DbNotification = Tables<"notifications">;

export interface Notification {
  id: string;
  type: "new_order" | "payment_confirmed" | "order_completed" | "driver_assigned" | "order_status_changed";
  message: string;
  orderId?: string;
  timestamp: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  dbNotifications: DbNotification[];
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  unreadCount: number;
  markDbNotificationAsRead: (id: string) => Promise<void>;

  showSuccess: (message: string, description?: string) => void;
  showError: (message: string, description?: string) => void;
  showInfo: (message: string, description?: string) => void;
  showWarning: (message: string, description?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dbNotifications, setDbNotifications] = useState<DbNotification[]>([]);
  const { customerPhone, role } = useAuth();

  // Load and subscribe to notifications when auth state changes
  useEffect(() => {
    // Clear ALL notifications immediately on any auth change
    setDbNotifications([]);
    setNotifications([]);
    toast.dismiss();

    // Don't subscribe until we have auth info
    if (!role || !customerPhone) return;

    if (role === "customer") {
      const loadNotifications = async () => {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("customer_phone", customerPhone)
          .order("created_at", { ascending: false });
        if (data) setDbNotifications(data);
      };
      loadNotifications();

      const channel = subscribeToTable("notifications", (payload) => {
        if (payload.eventType === "INSERT") {
          const newNotif = payload.new as DbNotification;
          
          const normalizePhone = (p: string | null) => {
            if (!p) return null;
            let digits = p.replace(/\D/g, "");
            if (digits.startsWith("0")) digits = "62" + digits.slice(1);
            return digits;
          };
          
          const notifPhone = normalizePhone(newNotif.customer_phone);
          const userPhone = normalizePhone(customerPhone);
          
          // Add if phone matches exactly OR if target phone is null (broadcast)
          if (!newNotif.customer_phone || notifPhone === userPhone) {
            setDbNotifications((prev) => [newNotif, ...prev]);
            toast.info(newNotif.title, { description: newNotif.message });
          }
        }
      });

      return () => { unsubscribe(channel); };
    } else {
      // For admin/driver, load all notifications
      const loadNotifications = async () => {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false });
        if (data) setDbNotifications(data);
      };
      loadNotifications();

      const channel = subscribeToTable("notifications", (payload) => {
        if (payload.eventType === "INSERT") {
          const newNotif = payload.new as DbNotification;
          setDbNotifications((prev) => [newNotif, ...prev]);
          toast.info(newNotif.title, { description: newNotif.message });
        }
      });

      return () => { unsubscribe(channel); };
    }
  }, [role, customerPhone]);

  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);

    toast.info(notification.message, {
      description: "Klik untuk melihat detail",
    });
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markDbNotificationAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setDbNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length +
    dbNotifications.filter((n) => !n.is_read).length;

  const showSuccess = useCallback((message: string, description?: string) => {
    toast.success(message, { description });
  }, []);

  const showError = useCallback((message: string, description?: string) => {
    toast.error(message, { description });
  }, []);

  const showInfo = useCallback((message: string, description?: string) => {
    toast.info(message, { description });
  }, []);

  const showWarning = useCallback((message: string, description?: string) => {
    toast.warning(message, { description });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        dbNotifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        unreadCount,
        markDbNotificationAsRead,
        showSuccess,
        showError,
        showInfo,
        showWarning,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}
