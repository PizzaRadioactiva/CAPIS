import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStockOut, getApiErrorMessage } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PackageMinus } from "lucide-react";
import type { Product } from "@/types";

export function StockOutDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const stockOut = useStockOut(product.id);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("Consumo / dispensación");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setQuantity("");
    setReason("Consumo / dispensación");
    setNotes("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError("Ingresá una cantidad válida mayor a 0");
      return;
    }
    if (qty > product.quantity) {
      setError(`No hay suficiente stock. Disponible: ${product.quantity}`);
      return;
    }
    try {
      await stockOut.mutateAsync({ quantity: qty, reason, notes: notes || undefined });
      toast({ variant: "success", title: "Stock descontado", description: `Se restaron ${qty} unidad(es) de ${product.name}` });
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo descontar el stock"));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageMinus className="size-5 text-amber-600" />
            Descontar stock
          </DialogTitle>
          <DialogDescription>{product.name} — stock actual: {product.quantity}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qty-out">Cantidad a descontar *</Label>
            <Input
              id="qty-out"
              type="number"
              min={1}
              max={product.quantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason-out">Motivo *</Label>
            <Input id="reason-out" value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes-out">Notas</Label>
            <Textarea id="notes-out" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" rows={2} />
          </div>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={stockOut.isPending}>
              {stockOut.isPending && <Loader2 className="size-4 animate-spin" />}
              Confirmar egreso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
