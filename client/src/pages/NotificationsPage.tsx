import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Loader2, Info } from "lucide-react";

export default function NotificationsPage() {
  const { toast } = useToast();
  const [overrideEmail, setOverrideEmail] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function send(endpoint: string, label: string) {
    setLoading(endpoint);
    try {
      const { data } = await api.post(endpoint, overrideEmail ? { to: overrideEmail } : {});
      if (data.sent === false) {
        toast({ title: "Sin novedades", description: data.message });
      } else {
        toast({ variant: "success", title: `${label} enviado`, description: `Destinatario: ${data.recipient}` });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: getApiErrorMessage(err, "No se pudo enviar el email") });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5 text-cyan-600" />
            Email y notificaciones
          </CardTitle>
          <CardDescription>
            Enviá información de stock por email. Si no especificás un destinatario, se usa el configurado en Ajustes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="override">Enviar a (opcional)</Label>
            <Input
              id="override"
              type="email"
              placeholder="Dejar vacío para usar el email configurado en Ajustes"
              value={overrideEmail}
              onChange={(e) => setOverrideEmail(e.target.value)}
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-cyan-50 p-3 text-sm text-cyan-800">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>Los emails se envían mediante Resend con plantillas HTML profesionales con el membrete de C.A.P.S.</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => send("/reports/email/low-stock", "Reporte de stock bajo")}
              disabled={loading === "/reports/email/low-stock"}
            >
              {loading === "/reports/email/low-stock" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Alerta de stock bajo
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => send("/reports/email/out-of-stock", "Reporte de sin stock")}
              disabled={loading === "/reports/email/out-of-stock"}
            >
              {loading === "/reports/email/out-of-stock" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Productos sin stock
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => send("/reports/email/expiring", "Reporte de vencimientos")}
              disabled={loading === "/reports/email/expiring"}
            >
              {loading === "/reports/email/expiring" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Por vencer / vencidos
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => send("/reports/email/full-stock", "Reporte completo")}
              disabled={loading === "/reports/email/full-stock"}
            >
              {loading === "/reports/email/full-stock" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Stock completo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
