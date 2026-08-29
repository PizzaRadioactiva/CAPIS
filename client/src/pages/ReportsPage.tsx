import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { FileBarChart, AlertTriangle, XCircle, CalendarClock, Package, Mail, Loader2, Download } from "lucide-react";

interface ReportDef {
  key: string;
  title: string;
  description: string;
  icon: React.ElementType;
  tone: "default" | "warning" | "destructive" | "info";
  endpoint: string;
}

const REPORTS: ReportDef[] = [
  {
    key: "full-stock",
    title: "Stock actual completo",
    description: "Listado de todos los productos con su cantidad, mínimo y vencimiento.",
    icon: Package,
    tone: "default",
    endpoint: "/reports/email/full-stock",
  },
  {
    key: "low-stock",
    title: "Productos con stock bajo",
    description: "Productos cuya cantidad está en o por debajo del mínimo configurado.",
    icon: AlertTriangle,
    tone: "warning",
    endpoint: "/reports/email/low-stock",
  },
  {
    key: "out-of-stock",
    title: "Productos sin stock",
    description: "Productos agotados que requieren reposición urgente.",
    icon: XCircle,
    tone: "destructive",
    endpoint: "/reports/email/out-of-stock",
  },
  {
    key: "expiring",
    title: "Vencidos y por vencer",
    description: "Productos vencidos o que vencen dentro de los próximos 60 días.",
    icon: CalendarClock,
    tone: "info",
    endpoint: "/reports/email/expiring",
  },
];

const TONE_STYLES: Record<ReportDef["tone"], string> = {
  default: "bg-cyan-50 text-cyan-700",
  warning: "bg-amber-50 text-amber-700",
  destructive: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
};

export default function ReportsPage() {
  const { toast } = useToast();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  async function handleSend(report: ReportDef) {
    setLoadingKey(report.key);
    try {
      const { data } = await api.post(report.endpoint);
      if (data.sent === false) {
        toast({ title: "Sin novedades", description: data.message });
      } else {
        toast({
          variant: "success",
          title: "Reporte enviado",
          description: `Se envió a ${data.recipient} (${data.count} producto(s))`,
        });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: getApiErrorMessage(err, "No se pudo generar el reporte") });
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="size-5 text-cyan-600" />
            Reportes de inventario
          </CardTitle>
          <CardDescription>
            Generá y enviá reportes por email al instante. El destinatario se configura en{" "}
            <span className="font-medium">Ajustes</span>.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REPORTS.map((report) => (
          <Card key={report.key} className="transition-shadow hover:shadow-md">
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between">
                <div className={`flex size-11 items-center justify-center rounded-xl ${TONE_STYLES[report.tone]}`}>
                  <report.icon className="size-5" />
                </div>
                <Badge variant="outline">Email</Badge>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{report.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{report.description}</p>
              </div>
              <Button onClick={() => handleSend(report)} disabled={loadingKey === report.key} className="mt-auto w-full">
                {loadingKey === report.key ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                Enviar por email
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 p-5 text-sm text-slate-500">
          <Download className="size-5 shrink-0 text-slate-400" />
          <p>
            La exportación a PDF/CSV está preparada para agregarse próximamente. Por ahora, todos los reportes se envían
            por email en formato HTML profesional.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
