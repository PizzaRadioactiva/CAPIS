import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/ApiError";
import { isProduction } from "../lib/env";

// Avoids a hard type dependency on the generated Prisma namespace here; we only need
// to detect the shape of a PrismaClientKnownRequestError (it always has a string `code`).
function isPrismaKnownRequestError(err: unknown): err is { code: string; message: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string" &&
    (err as { constructor?: { name?: string } }).constructor?.name === "PrismaClientKnownRequestError"
  );
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Ruta no encontrada: ${req.method} ${req.path}` } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Datos inválidos",
        details: err.flatten().fieldErrors,
      },
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, details: err.details },
    });
  }

  if (isPrismaKnownRequestError(err)) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: { message: "Ya existe un registro con ese valor único" } });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: { message: "Recurso no encontrado" } });
    }
  }

  // eslint-disable-next-line no-console
  console.error("[UNHANDLED ERROR]", err);

  res.status(500).json({
    error: {
      message: "Ocurrió un error interno. Intentá nuevamente más tarde.",
      ...(isProduction ? {} : { debug: err instanceof Error ? err.message : String(err) }),
    },
  });
}

export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(
  fn: T
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
