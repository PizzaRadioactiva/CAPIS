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
import { useStockIn, getApiErrorMessage } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PackagePlus } from "lucide-react";
import type { Product } from "@/types";

export function StockInDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const stockIn = useStockIn(product.id);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("Reposición de stock");
  const [batchNumber, setBatchNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setQuantity("");
    setReason("Reposición de stock");
    setBatchNumber("");
    setExpirationDate("");
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
    try {
      await stockIn.mutateAsync({
        quantity: qty,
        reason,
        notes: notes || undefined,
        batchNumber: batchNumber || undefined,
        expirationDate: expirationDate || undefined,
      });
      toast({ variant: "success", title: "Stock agregado", description: `Se sumaron ${qty} unidad(es) a ${product.name}` });
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo agregar el stock"));
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
            <PackagePlus className="size-5 text-emerald-600" />
            Agregar stock
          </DialogTitle>
          <DialogDescription>{product.name} — stock actual: {product.quantity}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qty-in">Cantidad a agregar *</Label>
            <Input id="qty-in" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="batch-in">Número de lote</Label>
              <Input id="batch-in" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-in">Vencimiento</Label>
              <Input id="exp-in" type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason-in">Motivo *</Label>
            <Input id="reason-in" value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes-in">Notas</Label>
            <Textarea id="notes-in" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" rows={2} />
          </div>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="success" disabled={stockIn.isPending}>
              {stockIn.isPending && <Loader2 className="size-4 animate-spin" />}
              Confirmar ingreso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
