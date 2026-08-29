import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useProduct, useDeleteProduct, getApiErrorMessage } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StockInDialog } from "@/components/products/StockInDialog";
import { StockOutDialog } from "@/components/products/StockOutDialog";
import { ConfirmDeleteDialog } from "@/components/products/ConfirmDeleteDialog";
import { formatDate, formatDateTime, UNIT_LABELS } from "@/lib/utils";
import {
  ArrowLeft,
  PackagePlus,
  PackageMinus,
  Pencil,
  Trash2,
  Mail,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
} from "lucide-react";

const MOVEMENT_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  STOCK_IN: { icon: ArrowDownCircle, color: "text-emerald-600", label: "Ingreso" },
  STOCK_OUT: { icon: ArrowUpCircle, color: "text-amber-600", label: "Egreso" },
  ADJUSTMENT: { icon: RefreshCw, color: "text-blue-600", label: "Ajuste" },
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: product, isLoading } = useProduct(id);
  const deleteMutation = useDeleteProduct();

  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";
  const canDelete = user?.role === "ADMIN";

  async function handleDelete() {
    if (!product) return;
    try {
      await deleteMutation.mutateAsync(product.id);
      toast({ variant: "success", title: "Producto eliminado" });
      navigate("/stock");
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: getApiErrorMessage(err) });
    }
  }

  async function handleSendEmail() {
    if (!product) return;
    setSendingEmail(true);
    try {
      const { data } = await api.post(`/reports/email/product/${product.id}`);
      toast({ variant: "success", title: "Email enviado", description: `Ficha enviada a ${data.recipient}` });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: getApiErrorMessage(err, "No se pudo enviar el email") });
    } finally {
      setSendingEmail(false);
    }
  }

  if (isLoading || !product) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/stock" className="mb-2 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="size-4" /> Volver al stock
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">{product.name}</h2>
          {product.genericName && <p className="text-sm text-slate-400">{product.genericName}</p>}
          <div className="mt-2">
            <StatusBadge status={product.status} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleSendEmail} disabled={sendingEmail}>
            {sendingEmail ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
            Enviar por email
          </Button>
          {canManage && (
            <>
              <Button variant="success" onClick={() => setStockInOpen(true)}>
                <PackagePlus className="size-4" /> Agregar stock
              </Button>
              <Button variant="outline" onClick={() => setStockOutOpen(true)}>
                <PackageMinus className="size-4" /> Descontar stock
              </Button>
              <Button variant="outline" onClick={() => navigate(`/stock/${product.id}/editar`)}>
                <Pencil className="size-4" /> Editar
              </Button>
            </>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" /> Eliminar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del producto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Stock actual" value={`${product.quantity} ${UNIT_LABELS[product.unit]}`} highlight />
              <InfoRow label="Stock mínimo" value={String(product.minimumStock)} />
              <InfoRow label="Categoría" value={product.category?.name ?? "—"} />
              <InfoRow label="Laboratorio" value={product.manufacturer ?? "—"} />
              <InfoRow label="Proveedor" value={product.supplier ?? "—"} />
              <InfoRow label="Lote" value={product.batchNumber ?? "—"} />
              <InfoRow label="Vencimiento" value={formatDate(product.expirationDate)} />
              <Separator />
              <InfoRow label="Creado" value={formatDateTime(product.createdAt)} />
              <InfoRow label="Última actualización" value={formatDateTime(product.updatedAt)} />
              {product.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Descripción</p>
                    <p className="mt-1 text-slate-600">{product.description}</p>
                  </div>
                </>
              )}
              {product.notes && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Notas</p>
                  <p className="mt-1 text-slate-600">{product.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de movimientos</CardTitle>
              <CardDescription>Últimos cambios de stock registrados para este producto</CardDescription>
            </CardHeader>
            <CardContent>
              {!product.movements || product.movements.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Todavía no hay movimientos registrados</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {product.movements.map((m) => {
                    const config = MOVEMENT_CONFIG[m.type] ?? MOVEMENT_CONFIG.ADJUSTMENT;
                    const Icon = config.icon;
                    return (
                      <li key={m.id} className="flex items-start gap-3 py-3">
                        <Icon className={`mt-0.5 size-5 shrink-0 ${config.color}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800">{config.label}</span>
                            <Badge variant={m.type === "STOCK_IN" ? "success" : m.type === "STOCK_OUT" ? "warning" : "info"}>
                              {m.type === "STOCK_IN" ? "+" : m.type === "STOCK_OUT" ? "-" : "±"}
                              {Math.abs(m.quantity)}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500">{m.reason}</p>
                          {m.notes && <p className="text-xs text-slate-400">{m.notes}</p>}
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDateTime(m.createdAt)} {m.user?.name ? `· ${m.user.name}` : ""}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <StockInDialog product={product} open={stockInOpen} onOpenChange={setStockInOpen} />
      <StockOutDialog product={product} open={stockOutOpen} onOpenChange={setStockOutOpen} />
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        description={`Esta acción eliminará permanentemente "${product.name}" y no se puede deshacer.`}
      />
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={highlight ? "text-base font-bold text-slate-900" : "font-medium text-slate-700"}>{value}</span>
    </div>
  );
}
