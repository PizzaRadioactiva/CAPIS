import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import { isLowStock } from "../utils/stockStatus";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + 60);

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const [allProducts, totalUnitsAgg, outOfStockCount, expiredCount, expiringSoonCount, movementsToday, recentMovements, categories] =
      await Promise.all([
        prisma.product.findMany({ select: { id: true, quantity: true, minimumStock: true, categoryId: true } }),
        prisma.product.aggregate({ _sum: { quantity: true } }),
        prisma.product.count({ where: { quantity: { lte: 0 } } }),
        prisma.product.count({ where: { expirationDate: { lt: now } } }),
        prisma.product.count({ where: { expirationDate: { gte: now, lte: soon } } }),
        prisma.stockMovement.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.stockMovement.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          include: { product: { select: { name: true, unit: true } }, user: { select: { name: true } } },
        }),
        prisma.category.findMany({ include: { _count: { select: { products: true } } } }),
      ]);

    const lowStockCount = allProducts.filter((p: { quantity: number; minimumStock: number }) =>
      isLowStock(p.quantity, p.minimumStock)
    ).length;

    const categoryDistribution = categories
      .map((c: { name: string; _count: { products: number } }) => ({ name: c.name, value: c._count.products }))
      .filter((c: { value: number }) => c.value > 0)
      .sort((a: { value: number }, b: { value: number }) => b.value - a.value);

    const lowStockProducts = await prisma.product.findMany({
      where: { quantity: { gt: 0 } },
      select: { id: true, name: true, quantity: true, minimumStock: true, unit: true },
    });
    const topLowStock = lowStockProducts
      .filter((p: { quantity: number; minimumStock: number }) => isLowStock(p.quantity, p.minimumStock))
      .sort(
        (a: { quantity: number; minimumStock: number }, b: { quantity: number; minimumStock: number }) =>
          a.quantity / a.minimumStock - b.quantity / b.minimumStock
      )
      .slice(0, 6);

    // Movements per day for last 14 days
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);
    const recentMovementRows = await prisma.stockMovement.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true, type: true, quantity: true },
    });
    const dayMap = new Map<string, { in: number; out: number }>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(fourteenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { in: 0, out: 0 });
    }
    for (const m of recentMovementRows) {
      const key = m.createdAt.toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (!entry) continue;
      if (m.type === "STOCK_IN") entry.in += m.quantity;
      else if (m.type === "STOCK_OUT") entry.out += m.quantity;
    }
    const movementTimeline = Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v }));

    res.json({
      kpis: {
        totalProducts: allProducts.length,
        totalUnits: totalUnitsAgg._sum.quantity ?? 0,
        lowStockCount,
        outOfStockCount,
        expiredCount,
        expiringSoonCount,
        movementsToday,
      },
      categoryDistribution,
      topLowStock,
      recentMovements,
      movementTimeline,
    });
  })
);

export default router;
