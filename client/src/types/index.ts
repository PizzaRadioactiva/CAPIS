export type Role = "ADMIN" | "STAFF";

export type Unit =
  | "UNIT"
  | "BOX"
  | "BLISTER"
  | "BOTTLE"
  | "VIAL"
  | "AMPOULE"
  | "TUBE"
  | "ROLL"
  | "PACK"
  | "ML"
  | "L"
  | "MG"
  | "G"
  | "KG";

export type MovementType = "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "EXPIRING_SOON" | "EXPIRED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active?: boolean;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  genericName?: string | null;
  categoryId?: string | null;
  category?: Category | null;
  description?: string | null;
  manufacturer?: string | null;
  quantity: number;
  minimumStock: number;
  unit: Unit;
  batchNumber?: string | null;
  expirationDate?: string | null;
  supplier?: string | null;
  notes?: string | null;
  status: StockStatus;
  createdAt: string;
  updatedAt: string;
  movements?: StockMovement[];
}

export interface StockMovement {
  id: string;
  productId: string;
  product?: { id: string; name: string; unit: Unit };
  userId?: string | null;
  user?: { id: string; name: string } | null;
  type: MovementType;
  quantity: number;
  reason: string;
  notes?: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardData {
  kpis: {
    totalProducts: number;
    totalUnits: number;
    lowStockCount: number;
    outOfStockCount: number;
    expiredCount: number;
    expiringSoonCount: number;
    movementsToday: number;
  };
  categoryDistribution: { name: string; value: number }[];
  topLowStock: { id: string; name: string; quantity: number; minimumStock: number; unit: Unit }[];
  recentMovements: StockMovement[];
  movementTimeline: { date: string; in: number; out: number }[];
}

export interface Settings {
  id: string;
  capsEmail?: string | null;
  orgName: string;
  orgSubtitle: string;
}

export interface ApiErrorShape {
  error: {
    message: string;
    details?: unknown;
  };
}
