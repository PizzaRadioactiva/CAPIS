export type StockStatus = "OUT_OF_STOCK" | "LOW_STOCK" | "EXPIRED" | "EXPIRING_SOON" | "IN_STOCK";

const EXPIRING_SOON_DAYS = 60;

interface StatusInput {
  quantity: number;
  minimumStock: number;
  expirationDate: Date | null;
}

export function computeStockStatus({ quantity, minimumStock, expirationDate }: StatusInput): StockStatus {
  if (expirationDate) {
    const now = new Date();
    const diffDays = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "EXPIRED";
    if (diffDays <= EXPIRING_SOON_DAYS) return "EXPIRING_SOON";
  }
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity <= minimumStock) return "LOW_STOCK";
  return "IN_STOCK";
}

export function isLowStock(quantity: number, minimumStock: number) {
  return quantity > 0 && quantity <= minimumStock;
}
