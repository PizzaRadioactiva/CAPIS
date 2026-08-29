import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/ApiError";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import { hashPassword } from "../lib/auth";

const router = Router();
router.use(requireAuth);
router.use(requireRole(Role.ADMIN));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    res.json({ users });
  })
);

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.nativeEnum(Role).default(Role.STAFF),
});

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data: z.infer<typeof createUserSchema> = createUserSchema.parse(req.body);
    const email: string = data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw ApiError.conflict("Ya existe un usuario con ese email");

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: { name: data.name, email, passwordHash, role: data.role },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    res.status(201).json({ user });
  })
);

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  role: z.nativeEnum(Role).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data: z.infer<typeof updateUserSchema> = updateUserSchema.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.password) {
      const passwordHash: string = await hashPassword(data.password);
      updateData.passwordHash = passwordHash;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    res.json({ user });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (req.user?.sub === req.params.id) {
      throw ApiError.badRequest("No podés eliminar tu propio usuario");
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);

export default router;
