import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("[validate] before parse", { path: req.path });
      req.body = schema.parse(req.body);
      console.log("[validate] after parse", { keys: Object.keys(req.body || {}) });
      next();
    } catch (err: any) {
      console.error("[validate] validation error", err?.errors || err?.message);
      return res.status(400).json({ error: "ValidationError", details: err.errors });
    }
  };
