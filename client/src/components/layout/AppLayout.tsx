import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar, NAV_ITEMS } from "./Sidebar";
import { Topbar } from "./Topbar";
import { X } from "lucide-react";

function useCurrentTitle() {
  const location = useLocation();
  const match = NAV_ITEMS.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );
  return match?.label ?? "C.A.P.S.";
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = useCurrentTitle();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 h-full w-64 animate-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute -right-10 top-4 rounded-md bg-white/10 p-2 text-white"
              aria-label="Cerrar menú"
            >
              <X className="size-5" />
            </button>
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} onMobileMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
