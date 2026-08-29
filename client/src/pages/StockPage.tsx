import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProducts, useCategories, useDeleteProduct, getApiErrorMessage } from "@/hooks/useProducts";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/products/ConfirmDeleteDialog";
import { StockInDialog } from "@/components/products/StockInDialog";
import { StockOutDialog } from "@/components/products/StockOutDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate, UNIT_LABELS } from "@/lib/utils";
import {
  Search,
  PackagePlus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  PackageMinus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  SlidersHorizontal,
} from "lucide-react";
import type { Product } from "@/types";

const STATUS_FILTERS = [
  { value: "ALL", label: "Todos los estados" },
  { value: "IN_STOCK", label: "En stock" },
  { value: "LOW_STOCK", label: "Stock bajo" },
  { value: "OUT_OF_STOCK", label: "Sin stock" },
  { value: "EXPIRING_SOON", label: "Por vencer" },
  { value: "EXPIRED", label: "Vencidos" },
];

const SORT_OPTIONS = [
  { value: "name-asc", label: "Nombre (A-Z)" },
  { value: "name-desc", label: "Nombre (Z-A)" },
  { value: "quantity-asc", label: "Cantidad (menor a mayor)" },
  { value: "quantity-desc", label: "Cantidad (mayor a menor)" },
  { value: "expirationDate-asc", label: "Vencimiento (más próximo)" },
  { value: "updatedAt-desc", label: "Actualizado recientemente" },
];

export default function StockPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") ?? "ALL");
  const [status, setStatus] = useState(searchParams.get("status") ?? "ALL");
  const [sort, setSort] = useState("name-asc");
  const [page, setPage] = useState(1);

  const [stockInProduct, setStockInProduct] = useState<Product | null>(null);
  const [stockOutProduct, setStockOutProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId, status, sort]);

  const [sortBy, sortOrder] = sort.split("-") as [string, "asc" | "desc"];

  const { data: categories } = useCategories();
  const { data, isLoading, isFetching } = useProducts({
    search: debouncedSearch || undefined,
    categoryId: categoryId !== "ALL" ? categoryId : undefined,
    status: status !== "ALL" ? status : undefined,
    sortBy,
    sortOrder,
    page,
    pageSize: 15,
  });

  const deleteMutation = useDeleteProduct();

  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";
  const canDelete = user?.role === "ADMIN";

  const products = data?.items ?? [];
  const pagination = data?.pagination;

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (categoryId !== "ALL") count++;
    if (status !== "ALL") count++;
    return count;
  }, [categoryId, status]);

  async function handleDelete() {
    if (!deleteProduct) return;
    try {
      await deleteMutation.mutateAsync(deleteProduct.id);
      toast({ variant: "success", title: "Producto eliminado", description: deleteProduct.name });
      setDeleteProduct(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: getApiErrorMessage(err, "No se pudo eliminar el producto") });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, genérico, laboratorio..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-[170px]">
              <SlidersHorizontal className="mr-1 size-3.5 text-slate-400" />
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las categorías</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[190px]">
              <ArrowUpDown className="mr-1 size-3.5 text-slate-400" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canManage && (
            <Button onClick={() => navigate("/stock/nuevo")}>
              <PackagePlus className="size-4" />
              Agregar producto
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Search className="size-10 text-slate-300" />
              <p className="font-medium text-slate-600">No se encontraron productos</p>
              <p className="text-sm text-slate-400">
                {debouncedSearch || activeFiltersCount > 0
                  ? "Probá ajustar la búsqueda o los filtros"
                  : "Todavía no hay productos cargados"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Mínimo</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={isFetching ? "opacity-60 transition-opacity" : ""}>
                {products.map((product) => (
                  <TableRow key={product.id} className="cursor-pointer" onClick={() => navigate(`/stock/${product.id}`)}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{product.name}</div>
                      {product.genericName && <div className="text-xs text-slate-400">{product.genericName}</div>}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{product.category?.name ?? "—"}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-slate-800">{product.quantity}</span>{" "}
                      <span className="text-xs text-slate-400">{UNIT_LABELS[product.unit]}</span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{product.minimumStock}</TableCell>
                    <TableCell className="text-sm text-slate-500">{formatDate(product.expirationDate)}</TableCell>
                    <TableCell>
                      <StatusBadge status={product.status} />
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/stock/${product.id}`)}>
                            <Eye className="size-4" /> Ver detalle
                          </DropdownMenuItem>
                          {canManage && (
                            <>
                              <DropdownMenuItem onClick={() => setStockInProduct(product)}>
                                <PackagePlus className="size-4" /> Agregar stock
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setStockOutProduct(product)}>
                                <PackageMinus className="size-4" /> Descontar stock
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/stock/${product.id}/editar`)}>
                                <Pencil className="size-4" /> Editar
                              </DropdownMenuItem>
                            </>
                          )}
                          {canDelete && (
                            <DropdownMenuItem onClick={() => setDeleteProduct(product)} className="text-red-600 focus:text-red-700">
                              <Trash2 className="size-4" /> Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-1 text-sm text-slate-500">
          <span>
            Página {pagination.page} de {pagination.totalPages} · {pagination.total} producto(s)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="size-4" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {stockInProduct && (
        <StockInDialog product={stockInProduct} open={!!stockInProduct} onOpenChange={(o) => !o && setStockInProduct(null)} />
      )}
      {stockOutProduct && (
        <StockOutDialog product={stockOutProduct} open={!!stockOutProduct} onOpenChange={(o) => !o && setStockOutProduct(null)} />
      )}
      {deleteProduct && (
        <ConfirmDeleteDialog
          open={!!deleteProduct}
          onOpenChange={(o) => !o && setDeleteProduct(null)}
          onConfirm={handleDelete}
          isLoading={deleteMutation.isPending}
          description={`Esta acción eliminará permanentemente "${deleteProduct.name}" y no se puede deshacer.`}
        />
      )}
    </div>
  );
}
