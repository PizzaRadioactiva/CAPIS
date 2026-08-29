import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProductForm } from "@/components/products/ProductForm";
import { useCreateProduct, getApiErrorMessage } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import type { ProductFormValues } from "@/components/products/productFormSchema";

export default function AddProductPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createProduct = useCreateProduct();

  async function handleSubmit(values: ProductFormValues) {
    try {
      const product = await createProduct.mutateAsync({
        ...values,
        categoryId: values.categoryId || undefined,
      });
      toast({ variant: "success", title: "Producto creado", description: `${product.name} se agregó al inventario` });
      navigate(`/stock/${product.id}`);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: getApiErrorMessage(err, "No se pudo crear el producto") });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agregar nuevo producto</CardTitle>
          <CardDescription>Cargá un nuevo medicamento o insumo médico al inventario</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm onSubmit={handleSubmit} submitLabel="Crear producto" isSubmitting={createProduct.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
