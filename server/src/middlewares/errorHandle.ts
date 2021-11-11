import { Request, Response, NextFunction } from "express";
import { inProd, inStaging } from "../constants";

function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404);
  const error = new Error("🔍 - Not Found - " + req.originalUrl);
  next(error);
}

/* eslint-disable no-unused-vars */
function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  /* eslint-enable no-unused-vars */
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: "failed",
    error: err.message || "internal server error",
    stack: inProd || inStaging ? "🥞" : err.stack,
  });
}

export { errorHandler, notFound };
