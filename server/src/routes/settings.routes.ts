import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    res.json({ settings });
  })
);

const settingsSchema = z.object({
  capsEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  orgName: z.string().trim().min(1).max(100).optional(),
  orgSubtitle: z.string().trim().min(1).max(200).optional(),
});

router.put(
  "/",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const data = settingsSchema.parse(req.body);
    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {
        ...(data.capsEmail !== undefined ? { capsEmail: data.capsEmail || null } : {}),
        ...(data.orgName !== undefined ? { orgName: data.orgName } : {}),
        ...(data.orgSubtitle !== undefined ? { orgSubtitle: data.orgSubtitle } : {}),
      },
      create: {
        id: "singleton",
        capsEmail: data.capsEmail || null,
        orgName: data.orgName ?? "C.A.P.S.",
        orgSubtitle: data.orgSubtitle ?? "Centro de Atención Primaria de la Salud",
      },
    });
    res.json({ settings });
  })
);

export default router;
