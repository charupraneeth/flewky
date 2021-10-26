import { Request, Response, NextFunction } from "express";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { redis } from "../redisClient";

const rlLoginClient = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "ln",
  points: 4,
  duration: 60,
  blockDuration: 60 * 5,
});

const rlVerifyClient = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "vy",
  points: 4,
  duration: 60,
  blockDuration: 60 * 2,
});

const rlSocketClient = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "st",
  points: 4,
  duration: 60,
  blockDuration: 60 * 2,
});

const rateLimiterLogin = (req: Request, res: Response, next: NextFunction) => {
  rlLoginClient
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch((_) => {
      res.status(429);
      next(new Error("too many requests"));
    });
};

const rateLimiterVerify = (req: Request, res: Response, next: NextFunction) => {
  rlVerifyClient
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch((_) => {
      res.status(429);
      next(new Error("too many requests"));
    });
};

export { rateLimiterLogin, rateLimiterVerify, rlSocketClient };
