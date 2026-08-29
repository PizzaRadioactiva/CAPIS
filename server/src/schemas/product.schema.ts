import { z } from "zod";
import { Unit } from "@prisma/client";

export const productCreateSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  genericName: z.string().trim().max(200).optional().or(z.literal("")),
  categoryId: z.string().cuid().optional().or(z.literal("")).or(z.null()),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  manufacturer: z.string().trim().max(200).optional().or(z.literal("")),
  quantity: z.coerce.number().int("Debe ser un número entero").min(0, "La cantidad no puede ser negativa"),
  minimumStock: z.coerce.number().int().min(0, "El stock mínimo no puede ser negativo").default(10),
  unit: z.nativeEnum(Unit).default(Unit.UNIT),
  batchNumber: z.string().trim().max(100).optional().or(z.literal("")),
  expirationDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val ? new Date(val) : null)),
  supplier: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const productUpdateSchema = productCreateSchema.partial();

export const stockOperationSchema = z.object({
  quantity: z.coerce.number().int("Debe ser un número entero").positive("La cantidad debe ser mayor a 0"),
  reason: z.string().trim().min(2, "Indicá un motivo").max(300),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  batchNumber: z.string().trim().max(100).optional().or(z.literal("")),
  expirationDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val ? new Date(val) : undefined)),
});

export const adjustmentSchema = z.object({
  quantity: z.coerce.number().int("Debe ser un número entero").min(0, "No puede ser negativo"),
  reason: z.string().trim().min(2, "Indicá un motivo").max(300),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const productQuerySchema = z.object({
  search: z.string().trim().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "EXPIRING_SOON", "EXPIRED", "ALL"]).optional(),
  sortBy: z.enum(["name", "quantity", "expirationDate", "updatedAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
