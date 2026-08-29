import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DashboardData } from "@/types";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { CategoryDistributionChart, LowStockBarChart, MovementTimelineChart } from "@/components/dashboard/Charts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { formatDateTime, UNIT_LABELS } from "@/lib/utils";
import { Package, Boxes, AlertTriangle, XCircle, CalendarClock, ActivitySquare, ArrowRight, ArrowDownCircle, ArrowUpCircle, RefreshCw } from "lucide-react";

const MOVEMENT_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  STOCK_IN: { icon: ArrowDownCircle, color: "text-emerald-600" },
  STOCK_OUT: { icon: ArrowUpCircle, color: "text-amber-600" },
  ADJUSTMENT: { icon: RefreshCw, color: "text-blue-600" },
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await api.get<DashboardData>("/dashboard");
      return data;
    },
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const { kpis, categoryDistribution, topLowStock, recentMovements, movementTimeline } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total de productos" value={kpis.totalProducts} icon={Package} tone="default" />
        <KpiCard label="Unidades en stock" value={kpis.totalUnits.toLocaleString("es-AR")} icon={Boxes} tone="info" />
        <KpiCard
          label="Stock bajo"
          value={kpis.lowStockCount}
          icon={AlertTriangle}
          tone={kpis.lowStockCount > 0 ? "warning" : "success"}
        />
        <KpiCard
          label="Sin stock"
          value={kpis.outOfStockCount}
          icon={XCircle}
          tone={kpis.outOfStockCount > 0 ? "destructive" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Movimientos hoy" value={kpis.movementsToday} icon={ActivitySquare} tone="default" />
        <KpiCard label="Por vencer (60 días)" value={kpis.expiringSoonCount} icon={CalendarClock} tone="warning" />
        <KpiCard label="Vencidos" value={kpis.expiredCount} icon={XCircle} tone={kpis.expiredCount > 0 ? "destructive" : "success"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryDistributionChart data={categoryDistribution} />
        <LowStockBarChart data={topLowStock} />
      </div>

      <MovementTimelineChart data={movementTimeline} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Movimientos recientes</CardTitle>
            <CardDescription>Últimos cambios registrados en el inventario</CardDescription>
          </div>
          <Link to="/movimientos" className="flex items-center gap-1 text-sm font-medium text-cyan-700 hover:underline">
            Ver todos <ArrowRight className="size-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentMovements.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Todavía no hay movimientos registrados</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentMovements.map((m) => {
                const config = MOVEMENT_ICON[m.type] ?? MOVEMENT_ICON.ADJUSTMENT;
                const Icon = config.icon;
                return (
                  <li key={m.id} className="flex items-center gap-3 py-3">
                    <Icon className={`size-5 shrink-0 ${config.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{m.product?.name ?? "Producto"}</p>
                      <p className="truncate text-xs text-slate-400">
                        {m.reason} {m.user?.name ? `· ${m.user.name}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={m.type === "STOCK_IN" ? "success" : m.type === "STOCK_OUT" ? "warning" : "info"}>
                        {m.type === "STOCK_IN" ? "+" : m.type === "STOCK_OUT" ? "-" : "±"}
                        {Math.abs(m.quantity)} {m.product?.unit ? UNIT_LABELS[m.product.unit] : ""}
                      </Badge>
                      <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(m.createdAt)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
