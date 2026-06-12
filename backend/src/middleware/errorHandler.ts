import { Request, Response, NextFunction } from "express";
import { fail } from "../types/api";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("[error]", err.message);
  res.status(500).json(fail(err.message || "Internal server error"));
}
