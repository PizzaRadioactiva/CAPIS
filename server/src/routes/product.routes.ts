import { Router } from "express";
import { Role } from "@prisma/client";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  productCreateSchema,
  productUpdateSchema,
  productQuerySchema,
  stockOperationSchema,
  adjustmentSchema,
} from "../schemas/product.schema";
import * as productService from "../services/product.service";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = productQuerySchema.parse(req.query);
    const result = await productService.listProducts(query);
    res.json(result);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await productService.getProductById(req.params.id);
    res.json({ product });
  })
);

router.post(
  "/",
  requireRole(Role.ADMIN, Role.STAFF),
  asyncHandler(async (req, res) => {
    const data = productCreateSchema.parse(req.body);
    const product = await productService.createProduct(data);
    res.status(201).json({ product });
  })
);

router.put(
  "/:id",
  requireRole(Role.ADMIN, Role.STAFF),
  asyncHandler(async (req, res) => {
    const data = productUpdateSchema.parse(req.body);
    const product = await productService.updateProduct(req.params.id, data);
    res.json({ product });
  })
);

router.delete(
  "/:id",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const result = await productService.deleteProduct(req.params.id);
    res.json(result);
  })
);

router.post(
  "/:id/stock-in",
  requireRole(Role.ADMIN, Role.STAFF),
  asyncHandler(async (req, res) => {
    const data = stockOperationSchema.parse(req.body);
    const product = await productService.stockIn(req.params.id, req.user?.sub, data);
    res.json({ product });
  })
);

router.post(
  "/:id/stock-out",
  requireRole(Role.ADMIN, Role.STAFF),
  asyncHandler(async (req, res) => {
    const data = stockOperationSchema.parse(req.body);
    const product = await productService.stockOut(req.params.id, req.user?.sub, data);
    res.json({ product });
  })
);

router.post(
  "/:id/adjust",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const data = adjustmentSchema.parse(req.body);
    const product = await productService.adjustStock(req.params.id, req.user?.sub, data);
    res.json({ product });
  })
);

export default router;
