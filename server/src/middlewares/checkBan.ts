import { Request, Response, NextFunction } from "express";
import { maxReports } from "../constants";
import { redis } from "../redisClient";

async function checkBan(req: Request, res: Response, next: NextFunction) {
  const { email }: { email: string } = req.body;
  const reports = await redis.get(`ban:${email}`);
  if (reports && parseInt(reports) >= maxReports) {
    res.status(401);
    const error = new Error("email banned");
    return next(error);
  }
  next();
}

export { checkBan };
