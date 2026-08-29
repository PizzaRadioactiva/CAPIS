import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import type { DashboardData } from "@/types";

interface TopbarProps {
  title: string;
  onMobileMenuToggle: () => void;
}

export function Topbar({ title, onMobileMenuToggle }: TopbarProps) {
  const { user, logout } = useAuth();

  const { data } = useQuery({
    queryKey: ["dashboard-badge"],
    queryFn: async () => {
      const { data } = await api.get<DashboardData>("/dashboard");
      return data;
    },
    refetchInterval: 60000,
  });

  const alertCount = (data?.kpis.lowStockCount ?? 0) + (data?.kpis.outOfStockCount ?? 0);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
              <Bell className="size-5 text-slate-500" />
              {alertCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Alertas de inventario</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {alertCount === 0 ? (
              <p className="px-2 py-3 text-sm text-slate-400">No hay alertas activas</p>
            ) : (
              <>
                {(data?.kpis.outOfStockCount ?? 0) > 0 && (
                  <DropdownMenuItem className="flex items-center justify-between">
                    <span>Productos sin stock</span>
                    <Badge variant="destructive">{data?.kpis.outOfStockCount}</Badge>
                  </DropdownMenuItem>
                )}
                {(data?.kpis.lowStockCount ?? 0) > 0 && (
                  <DropdownMenuItem className="flex items-center justify-between">
                    <span>Stock bajo</span>
                    <Badge variant="warning">{data?.kpis.lowStockCount}</Badge>
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100">
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs font-normal text-slate-400">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>Cerrar sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
