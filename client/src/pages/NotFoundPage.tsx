import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700">
        <Activity className="size-8 text-white" />
      </div>
      <h1 className="text-4xl font-bold text-slate-900">404</h1>
      <p className="text-slate-500">La página que buscás no existe o fue movida.</p>
      <Button asChild>
        <Link to="/">
          <Home className="size-4" /> Volver al inicio
        </Link>
      </Button>
    </div>
  );
}
