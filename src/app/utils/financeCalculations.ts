// Finance calculation constants (defaults, overridden by fee_settings from DB)
export const DEFAULT_COST_PER_KM = 2000;
export const DEFAULT_SERVICE_FEE = 0;
export const DEFAULT_ADMIN_FEE = 0;
export const DEFAULT_DRIVER_SHARE_PCT = 80;
export const DEFAULT_ADMIN_SHARE_PCT = 20;
export const DEFAULT_MIN_DISTANCE_KM = 1;

export interface FeeSettings {
  cost_per_km: number;
  service_fee: number;
  admin_fee: number;
  driver_share_pct: number;
  admin_share_pct: number;
  min_distance_km: number;
}

export function getDefaultFeeSettings(): FeeSettings {
  return {
    cost_per_km: DEFAULT_COST_PER_KM,
    service_fee: DEFAULT_SERVICE_FEE,
    admin_fee: DEFAULT_ADMIN_FEE,
    driver_share_pct: DEFAULT_DRIVER_SHARE_PCT,
    admin_share_pct: DEFAULT_ADMIN_SHARE_PCT,
    min_distance_km: DEFAULT_MIN_DISTANCE_KM,
  };
}

export interface OrderFinance {
  subtotal: number;
  adminFee: number;
  serviceFee: number;
  deliveryFee: number;
  distance: number;
  chargedDistance: number;
  isMinimumChargeApplied: boolean;
  total: number;
  driverEarning: number;
  amountToStore: number;
  setoranToAdmin: number;
  adminProfit: number;
}

export function calculateOrderFinance(
  subtotal: number, // This should be the marked-up subtotal (store_price + 1000) * qty
  distance: number,
  totalItems: number = 0, // Count of items to extract the Rp1000 marker
  fees: FeeSettings = getDefaultFeeSettings(),
  directDeliveryFee?: number
): OrderFinance {
  const chargedDistance = Math.max(distance, fees.min_distance_km);
  const isMinimumChargeApplied = distance < fees.min_distance_km;
  // Use distance matrix fee if provided and > 0, otherwise fallback to KM * 2000
  const deliveryFee = (directDeliveryFee !== undefined && directDeliveryFee > 0) ? directDeliveryFee : chargedDistance * fees.cost_per_km;
  const driverSharePct = fees.driver_share_pct / 100;
  const adminSharePct = fees.admin_share_pct / 100;
  
  const driverEarning = deliveryFee * driverSharePct;
  const adminFromDelivery = deliveryFee * adminSharePct;

  // New logic: markup is 1000 per item
  const itemMarkupTotal = 1000 * totalItems;
  const adminFee = 0; // Legacy admin fee is removed
  const serviceFee = 0; // Legacy service fee is removed

  const adminProfit = adminFromDelivery + itemMarkupTotal;
  const total = subtotal + deliveryFee; // Subtotal already heavily includes the markup

  // Amount to store is raw total minus the app markup
  const amountToStore = subtotal - itemMarkupTotal;
  const setoranToAdmin = adminFromDelivery + itemMarkupTotal;

  return {
    subtotal,
    adminFee,
    serviceFee,
    deliveryFee,
    distance,
    chargedDistance,
    isMinimumChargeApplied,
    total,
    driverEarning,
    amountToStore,
    setoranToAdmin,
    adminProfit,
  };
}

export function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export interface DriverBonus {
  dailyBonus: number;
  weeklyBonus: number;
  totalBonus: number;
}

export function calculateDriverBonus(
  dailyOrders: number,
  weeklyOrders: number
): DriverBonus {
  let dailyBonus = 0;
  if (dailyOrders >= 15) dailyBonus = 30000;
  else if (dailyOrders >= 10) dailyBonus = 15000;
  else if (dailyOrders >= 5) dailyBonus = 5000;

  const weeklyBonus = weeklyOrders >= 50 ? 50000 : 0;

  return { dailyBonus, weeklyBonus, totalBonus: dailyBonus + weeklyBonus };
}

// Generate 3-digit unique payment code (100-999)
// Ensures the code is not already used in existingOrders
export function generateUniquePaymentCode(existingOrderCodes: number[] = []): number {
  const maxAttempts = 100;
  for (let i = 0; i < maxAttempts; i++) {
    const code = Math.floor(100 + Math.random() * 900); // 100-999
    if (!existingOrderCodes.includes(code)) {
      return code;
    }
  }
  // Fallback: use timestamp-based code if all attempts fail
  return 100 + (Date.now() % 900);
}
