import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, Clock, CalendarX } from "lucide-react";
import type { StockStatus } from "@/types";

const CONFIG: Record<StockStatus, { variant: "success" | "warning" | "destructive" | "info" | "outline"; icon: React.ElementType }> = {
  IN_STOCK: { variant: "success", icon: CheckCircle2 },
  LOW_STOCK: { variant: "warning", icon: AlertTriangle },
  OUT_OF_STOCK: { variant: "destructive", icon: XCircle },
  EXPIRING_SOON: { variant: "info", icon: Clock },
  EXPIRED: { variant: "destructive", icon: CalendarX },
};

export function StatusBadge({ status }: { status: StockStatus }) {
  const config = CONFIG[status] ?? CONFIG.IN_STOCK;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon className="size-3" />
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
