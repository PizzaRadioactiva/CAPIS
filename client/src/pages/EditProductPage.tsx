import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProductForm } from "@/components/products/ProductForm";
import { useProduct, useUpdateProduct, getApiErrorMessage } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductFormValues } from "@/components/products/productFormSchema";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: product, isLoading } = useProduct(id);
  const updateProduct = useUpdateProduct(id!);

  async function handleSubmit(values: ProductFormValues) {
    try {
      await updateProduct.mutateAsync({ ...values, categoryId: values.categoryId || undefined });
      toast({ variant: "success", title: "Producto actualizado" });
      navigate(`/stock/${id}`);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: getApiErrorMessage(err, "No se pudo actualizar el producto") });
    }
  }

  if (isLoading || !product) {
    return <Skeleton className="mx-auto h-96 max-w-3xl rounded-xl" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Editar producto</CardTitle>
          <CardDescription>
            Actualizá la información de <strong>{product.name}</strong>. Para cambiar la cantidad usá "Agregar stock" o
            "Descontar stock" desde el detalle del producto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm
            defaultValues={product}
            onSubmit={handleSubmit}
            submitLabel="Guardar cambios"
            isSubmitting={updateProduct.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
