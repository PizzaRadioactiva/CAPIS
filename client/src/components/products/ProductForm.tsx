import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema, ProductFormValues, UNIT_OPTIONS } from "./productFormSchema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useProducts";
import { Loader2 } from "lucide-react";
import type { Product } from "@/types";

interface ProductFormProps {
  defaultValues?: Partial<Product>;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function ProductForm({ defaultValues, onSubmit, submitLabel = "Guardar producto", isSubmitting }: ProductFormProps) {
  const { data: categories } = useCategories();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      genericName: defaultValues?.genericName ?? "",
      categoryId: defaultValues?.categoryId ?? "",
      description: defaultValues?.description ?? "",
      manufacturer: defaultValues?.manufacturer ?? "",
      quantity: defaultValues?.quantity ?? 0,
      minimumStock: defaultValues?.minimumStock ?? 10,
      unit: defaultValues?.unit ?? "UNIT",
      batchNumber: defaultValues?.batchNumber ?? "",
      expirationDate: defaultValues?.expirationDate ? defaultValues.expirationDate.slice(0, 10) : "",
      supplier: defaultValues?.supplier ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const categoryId = watch("categoryId");
  const unit = watch("unit");

  return (
    <form onSubmit={handleSubmit(async (values) => onSubmit(values))} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Nombre del producto *</Label>
          <Input id="name" placeholder="Ej: Paracetamol 500mg" {...register("name")} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="genericName">Nombre genérico</Label>
          <Input id="genericName" placeholder="Ej: Paracetamol" {...register("genericName")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Categoría</Label>
          <Select value={categoryId || undefined} onValueChange={(v) => setValue("categoryId", v)}>
            <SelectTrigger id="categoryId">
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea id="description" rows={2} placeholder="Descripción breve del producto" {...register("description")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manufacturer">Laboratorio / Fabricante</Label>
          <Input id="manufacturer" {...register("manufacturer")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier">Proveedor</Label>
          <Input id="supplier" {...register("supplier")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Cantidad {defaultValues ? "" : "inicial"} *</Label>
          <Input id="quantity" type="number" min={0} {...register("quantity")} />
          {errors.quantity && <p className="text-xs text-red-600">{errors.quantity.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="minimumStock">Stock mínimo *</Label>
          <Input id="minimumStock" type="number" min={0} {...register("minimumStock")} />
          {errors.minimumStock && <p className="text-xs text-red-600">{errors.minimumStock.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Unidad de medida *</Label>
          <Select value={unit} onValueChange={(v) => setValue("unit", v)}>
            <SelectTrigger id="unit">
              <SelectValue placeholder="Seleccionar unidad" />
            </SelectTrigger>
            <SelectContent>
              {UNIT_OPTIONS.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.unit && <p className="text-xs text-red-600">{errors.unit.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="batchNumber">Número de lote</Label>
          <Input id="batchNumber" {...register("batchNumber")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expirationDate">Fecha de vencimiento</Label>
          <Input id="expirationDate" type="date" {...register("expirationDate")} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notas adicionales</Label>
          <Textarea id="notes" rows={2} placeholder="Opcional" {...register("notes")} />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
