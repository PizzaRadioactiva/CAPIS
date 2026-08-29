import { MovementType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/ApiError";
import { computeStockStatus, isLowStock } from "../utils/stockStatus";
import { z } from "zod";
import {
  productCreateSchema,
  productQuerySchema,
  stockOperationSchema,
  adjustmentSchema,
} from "../schemas/product.schema";

type ProductCreateInput = z.infer<typeof productCreateSchema>;
type ProductQuery = z.infer<typeof productQuerySchema>;
type StockOperationInput = z.infer<typeof stockOperationSchema>;
type AdjustmentInput = z.infer<typeof adjustmentSchema>;

function cleanOptional(value?: string | null | unknown): string | null {
  if (typeof value !== "string") return null;
  return value.length > 0 ? value : null;
}

export function serializeProduct(product: any) {
  return {
    ...product,
    status: computeStockStatus({
      quantity: product.quantity,
      minimumStock: product.minimumStock,
      expirationDate: product.expirationDate,
    }),
  };
}

export async function listProducts(query: ProductQuery) {
  const { search, categoryId, status, sortBy, sortOrder, page, pageSize } = query;

  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { genericName: { contains: search, mode: "insensitive" } },
      { manufacturer: { contains: search, mode: "insensitive" } },
      { batchNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 60);

  if (status && status !== "ALL") {
    switch (status) {
      case "OUT_OF_STOCK":
        where.quantity = { lte: 0 };
        break;
      case "EXPIRED":
        where.expirationDate = { lt: now };
        break;
      case "EXPIRING_SOON":
        where.expirationDate = { gte: now, lte: soon };
        break;
      // LOW_STOCK is filtered in JS below since it compares two columns (quantity vs minimumStock)
    }
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sortBy === "expirationDate"
      ? { expirationDate: sortOrder }
      : sortBy === "quantity"
      ? { quantity: sortOrder }
      : sortBy === "updatedAt"
      ? { updatedAt: sortOrder }
      : { name: sortOrder };

  if (status === "LOW_STOCK") {
    // Compare two columns: fetch matching rows (minus pagination), filter in JS, then paginate manually.
    const all = await prisma.product.findMany({ where, orderBy, include: { category: true } });
    const filtered = all.filter((p: { quantity: number; minimumStock: number }) =>
      isLowStock(p.quantity, p.minimumStock)
    );
    const start = (page - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);
    return {
      items: pageItems.map(serializeProduct),
      pagination: {
        page,
        pageSize,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize) || 1,
      },
    };
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: true },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map(serializeProduct),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      movements: {
        orderBy: { createdAt: "desc" },
        take: 25,
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  if (!product) throw ApiError.notFound("Producto no encontrado");
  return serializeProduct(product);
}

export async function createProduct(data: ProductCreateInput) {
  const product = await prisma.product.create({
    data: {
      name: data.name,
      genericName: cleanOptional(data.genericName),
      categoryId: cleanOptional(data.categoryId as string | null),
      description: cleanOptional(data.description),
      manufacturer: cleanOptional(data.manufacturer),
      quantity: data.quantity,
      minimumStock: data.minimumStock,
      unit: data.unit,
      batchNumber: cleanOptional(data.batchNumber),
      expirationDate: data.expirationDate,
      supplier: cleanOptional(data.supplier),
      notes: cleanOptional(data.notes),
    },
    include: { category: true },
  });

  if (data.quantity > 0) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: MovementType.STOCK_IN,
        quantity: data.quantity,
        reason: "Carga inicial de stock",
      },
    });
  }

  return serializeProduct(product);
}

export async function updateProduct(id: string, data: Partial<ProductCreateInput>) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Producto no encontrado");

  const updateData: Prisma.ProductUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.genericName !== undefined) updateData.genericName = cleanOptional(data.genericName);
  if (data.categoryId !== undefined) {
    updateData.category = data.categoryId
      ? { connect: { id: data.categoryId as string } }
      : { disconnect: true };
  }
  if (data.description !== undefined) updateData.description = cleanOptional(data.description);
  if (data.manufacturer !== undefined) updateData.manufacturer = cleanOptional(data.manufacturer);
  if (data.minimumStock !== undefined) updateData.minimumStock = data.minimumStock;
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.batchNumber !== undefined) updateData.batchNumber = cleanOptional(data.batchNumber);
  if (data.expirationDate !== undefined) updateData.expirationDate = data.expirationDate;
  if (data.supplier !== undefined) updateData.supplier = cleanOptional(data.supplier);
  if (data.notes !== undefined) updateData.notes = cleanOptional(data.notes);

  // Direct quantity edits (not via stock-in/out) are treated as adjustments handled separately.

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });

  return serializeProduct(product);
}

export async function deleteProduct(id: string) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Producto no encontrado");
  await prisma.product.delete({ where: { id } });
  return { success: true };
}

export async function stockIn(id: string, userId: string | undefined, input: StockOperationInput) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const product = await tx.product.findUnique({ where: { id } });
    if (!product) throw ApiError.notFound("Producto no encontrado");

    const updateData: Prisma.ProductUpdateInput = {
      quantity: { increment: input.quantity },
    };
    if (input.batchNumber) updateData.batchNumber = input.batchNumber;
    if (input.expirationDate) updateData.expirationDate = input.expirationDate;

    const updated = await tx.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    await tx.stockMovement.create({
      data: {
        productId: id,
        userId,
        type: MovementType.STOCK_IN,
        quantity: input.quantity,
        reason: input.reason,
        notes: cleanOptional(input.notes),
      },
    });

    return serializeProduct(updated);
  });
}

export async function stockOut(id: string, userId: string | undefined, input: StockOperationInput) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const product = await tx.product.findUnique({ where: { id } });
    if (!product) throw ApiError.notFound("Producto no encontrado");

    if (input.quantity > product.quantity) {
      throw ApiError.badRequest(
        `No hay suficiente stock. Disponible: ${product.quantity}, solicitado: ${input.quantity}`
      );
    }

    const updated = await tx.product.update({
      where: { id },
      data: { quantity: { decrement: input.quantity } },
      include: { category: true },
    });

    await tx.stockMovement.create({
      data: {
        productId: id,
        userId,
        type: MovementType.STOCK_OUT,
        quantity: input.quantity,
        reason: input.reason,
        notes: cleanOptional(input.notes),
      },
    });

    return serializeProduct(updated);
  });
}

export async function adjustStock(id: string, userId: string | undefined, input: AdjustmentInput) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const product = await tx.product.findUnique({ where: { id } });
    if (!product) throw ApiError.notFound("Producto no encontrado");

    const diff = input.quantity - product.quantity;

    const updated = await tx.product.update({
      where: { id },
      data: { quantity: input.quantity },
      include: { category: true },
    });

    await tx.stockMovement.create({
      data: {
        productId: id,
        userId,
        type: MovementType.ADJUSTMENT,
        quantity: diff,
        reason: input.reason,
        notes: cleanOptional(input.notes),
      },
    });

    return serializeProduct(updated);
  });
}
