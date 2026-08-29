import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/ApiError";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import { isLowStock } from "../utils/stockStatus";
import { sendEmail } from "../services/email.service";
import {
  lowStockEmail,
  fullStockEmail,
  outOfStockEmail,
  expiringEmail,
  singleProductEmail,
} from "../templates/email";
import { env } from "../lib/env";

const router = Router();
router.use(requireAuth);

const emailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Demasiadas solicitudes de email. Esperá unos minutos." } },
});

async function resolveRecipient(explicit?: string): Promise<string> {
  if (explicit) return explicit;
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const email = settings?.capsEmail || env.CAPS_EMAIL;
  if (!email) {
    throw ApiError.badRequest("No hay un email de destino configurado. Configuralo en Ajustes.");
  }
  return email;
}

const emailBodySchema = z.object({
  to: z.string().email("Email inválido").optional(),
});

router.post(
  "/email/low-stock",
  emailLimiter,
  requireRole(Role.ADMIN, Role.STAFF),
  asyncHandler(async (req, res) => {
    const { to } = emailBodySchema.parse(req.body);
    const recipient = await resolveRecipient(to);

    const products = await prisma.product.findMany({
      where: { quantity: { gt: 0 } },
      select: { name: true, quantity: true, minimumStock: true, unit: true, expirationDate: true },
    });
    const lowStock = products.filter((p: { quantity: number; minimumStock: number }) =>
      isLowStock(p.quantity, p.minimumStock)
    );

    if (lowStock.length === 0) {
      return res.json({ success: true, sent: false, message: "No hay productos con stock bajo actualmente." });
    }

    const { subject, html } = lowStockEmail(lowStock);
    await sendEmail({ to: recipient, subject, html });
    res.json({ success: true, sent: true, recipient, count: lowStock.length });
  })
);

router.post(
  "/email/full-stock",
  emailLimiter,
  requireRole(Role.ADMIN, Role.STAFF),
  asyncHandler(async (req, res) => {
    const { to } = emailBodySchema.parse(req.body);
    const recipient = await resolveRecipient(to);

    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { name: true, quantity: true, minimumStock: true, unit: true, expirationDate: true },
    });

    const { subject, html } = fullStockEmail(products);
    await sendEmail({ to: recipient, subject, html });
    res.json({ success: true, sent: true, recipient, count: products.length });
  })
);

router.post(
  "/email/out-of-stock",
  emailLimiter,
  requireRole(Role.ADMIN, Role.STAFF),
  asyncHandler(async (req, res) => {
    const { to } = emailBodySchema.parse(req.body);
    const recipient = await resolveRecipient(to);

    const products = await prisma.product.findMany({
      where: { quantity: { lte: 0 } },
      select: { name: true, quantity: true, minimumStock: true, unit: true, expirationDate: true },
    });

    if (products.length === 0) {
      return res.json({ success: true, sent: false, message: "No hay productos sin stock actualmente." });
    }

    const { subject, html } = outOfStockEmail(products);
    await sendEmail({ to: recipient, subject, html });
    res.json({ success: true, sent: true, recipient, count: products.length });
  })
);

router.post(
  "/email/expiring",
  emailLimiter,
  requireRole(Role.ADMIN, Role.STAFF),
  asyncHandler(async (req, res) => {
    const { to } = emailBodySchema.parse(req.body);
    const recipient = await resolveRecipient(to);

    const soon = new Date();
    soon.setDate(soon.getDate() + 60);

    const products = await prisma.product.findMany({
      where: { expirationDate: { lte: soon, not: null } },
      orderBy: { expirationDate: "asc" },
      select: { name: true, quantity: true, minimumStock: true, unit: true, expirationDate: true },
    });

    if (products.length === 0) {
      return res.json({ success: true, sent: false, message: "No hay productos vencidos o por vencer." });
    }

    const { subject, html } = expiringEmail(products);
    await sendEmail({ to: recipient, subject, html });
    res.json({ success: true, sent: true, recipient, count: products.length });
  })
);

router.post(
  "/email/product/:id",
  emailLimiter,
  requireRole(Role.ADMIN, Role.STAFF),
  asyncHandler(async (req, res) => {
    const { to } = emailBodySchema.parse(req.body);
    const recipient = await resolveRecipient(to);

    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) throw ApiError.notFound("Producto no encontrado");

    const { subject, html } = singleProductEmail(product);
    await sendEmail({ to: recipient, subject, html });
    res.json({ success: true, sent: true, recipient });
  })
);

export default router;
