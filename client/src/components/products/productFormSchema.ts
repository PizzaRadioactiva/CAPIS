import { z } from "zod";

export const UNIT_OPTIONS = [
  { value: "UNIT", label: "Unidad" },
  { value: "BOX", label: "Caja" },
  { value: "BLISTER", label: "Blister" },
  { value: "BOTTLE", label: "Frasco" },
  { value: "VIAL", label: "Vial" },
  { value: "AMPOULE", label: "Ampolla" },
  { value: "TUBE", label: "Tubo" },
  { value: "ROLL", label: "Rollo" },
  { value: "PACK", label: "Paquete" },
  { value: "ML", label: "Mililitros (ml)" },
  { value: "L", label: "Litros (L)" },
  { value: "MG", label: "Miligramos (mg)" },
  { value: "G", label: "Gramos (g)" },
  { value: "KG", label: "Kilogramos (kg)" },
] as const;

export const productFormSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  genericName: z.string().trim().max(200).optional(),
  categoryId: z.string().optional(),
  description: z.string().trim().max(1000).optional(),
  manufacturer: z.string().trim().max(200).optional(),
  quantity: z.coerce.number({ invalid_type_error: "Ingresá un número" }).int("Debe ser un entero").min(0, "No puede ser negativo"),
  minimumStock: z.coerce.number({ invalid_type_error: "Ingresá un número" }).int("Debe ser un entero").min(0, "No puede ser negativo"),
  unit: z.string().min(1, "Seleccioná una unidad"),
  batchNumber: z.string().trim().max(100).optional(),
  expirationDate: z.string().optional(),
  supplier: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
