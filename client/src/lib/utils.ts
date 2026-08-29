import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

export const UNIT_LABELS: Record<string, string> = {
  UNIT: "Unidad",
  BOX: "Caja",
  BLISTER: "Blister",
  BOTTLE: "Frasco",
  VIAL: "Vial",
  AMPOULE: "Ampolla",
  TUBE: "Tubo",
  ROLL: "Rollo",
  PACK: "Paquete",
  ML: "ml",
  L: "L",
  MG: "mg",
  G: "g",
  KG: "kg",
};

export const STATUS_LABELS: Record<string, string> = {
  IN_STOCK: "En stock",
  LOW_STOCK: "Stock bajo",
  OUT_OF_STOCK: "Sin stock",
  EXPIRING_SOON: "Por vencer",
  EXPIRED: "Vencido",
};
