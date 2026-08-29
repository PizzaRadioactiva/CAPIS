import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/ApiError";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    res.json({ categories });
  })
);

router.post(
  "/",
  requireRole(Role.ADMIN, Role.STAFF),
  asyncHandler(async (req, res) => {
    const data = categorySchema.parse(req.body);
    const category = await prisma.category.create({
      data: { name: data.name, description: data.description || null },
    });
    res.status(201).json({ category });
  })
);

router.put(
  "/:id",
  requireRole(Role.ADMIN, Role.STAFF),
  asyncHandler(async (req, res) => {
    const data = categorySchema.partial().parse(req.body);
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
      },
    });
    res.json({ category });
  })
);

router.delete(
  "/:id",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const inUse = await prisma.product.count({ where: { categoryId: req.params.id } });
    if (inUse > 0) {
      throw ApiError.conflict(`No se puede eliminar: hay ${inUse} producto(s) usando esta categoría`);
    }
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);

export default router;
