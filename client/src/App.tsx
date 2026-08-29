import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/toaster";

import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import StockPage from "@/pages/StockPage";
import AddProductPage from "@/pages/AddProductPage";
import EditProductPage from "@/pages/EditProductPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import MovementsPage from "@/pages/MovementsPage";
import ReportsPage from "@/pages/ReportsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFoundPage from "@/pages/NotFoundPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/stock" element={<StockPage />} />
              <Route path="/stock/nuevo" element={<AddProductPage />} />
              <Route path="/stock/:id" element={<ProductDetailPage />} />
              <Route path="/stock/:id/editar" element={<EditProductPage />} />
              <Route path="/movimientos" element={<MovementsPage />} />
              <Route path="/reportes" element={<ReportsPage />} />
              <Route path="/notificaciones" element={<NotificationsPage />} />
              <Route path="/ajustes" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
