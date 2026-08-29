import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, UNIT_LABELS } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ArrowDownCircle, ArrowUpCircle, RefreshCw } from "lucide-react";
import type { Paginated, StockMovement, MovementType } from "@/types";

const TYPE_OPTIONS: { value: MovementType | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos los tipos" },
  { value: "STOCK_IN", label: "Ingresos" },
  { value: "STOCK_OUT", label: "Egresos" },
  { value: "ADJUSTMENT", label: "Ajustes" },
];

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; badge: "success" | "warning" | "info" }> = {
  STOCK_IN: { icon: ArrowDownCircle, color: "text-emerald-600", badge: "success" },
  STOCK_OUT: { icon: ArrowUpCircle, color: "text-amber-600", badge: "warning" },
  ADJUSTMENT: { icon: RefreshCw, color: "text-blue-600", badge: "info" },
};

export default function MovementsPage() {
  const [type, setType] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["stock-movements", type, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<StockMovement>>("/stock-movements", {
        params: { type: type !== "ALL" ? type : undefined, page, pageSize: 20 },
      });
      return data;
    },
    placeholderData: (prev) => prev,
  });

  const movements = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select
          value={type}
          onValueChange={(v) => {
            setType(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo de movimiento" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">No hay movimientos registrados</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => {
                  const config = TYPE_CONFIG[m.type] ?? TYPE_CONFIG.ADJUSTMENT;
                  const Icon = config.icon;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Link to={`/stock/${m.productId}`} className="font-medium text-slate-800 hover:text-cyan-700 hover:underline">
                          {m.product?.name ?? "Producto eliminado"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Icon className={`size-4 ${config.color}`} />
                          <Badge variant={config.badge}>
                            {m.type === "STOCK_IN" ? "Ingreso" : m.type === "STOCK_OUT" ? "Egreso" : "Ajuste"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800">
                        {m.type === "STOCK_IN" ? "+" : m.type === "STOCK_OUT" ? "-" : "±"}
                        {Math.abs(m.quantity)} {m.product?.unit ? UNIT_LABELS[m.product.unit] : ""}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-sm text-slate-500">{m.reason}</TableCell>
                      <TableCell className="text-sm text-slate-500">{m.user?.name ?? "Sistema"}</TableCell>
                      <TableCell className="text-sm text-slate-400">{formatDateTime(m.createdAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-1 text-sm text-slate-500">
          <span>
            Página {pagination.page} de {pagination.totalPages} · {pagination.total} movimiento(s)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="size-4" /> Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
