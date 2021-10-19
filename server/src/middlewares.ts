import { Request, Response, NextFunction } from "express";
import { config } from "dotenv";
import axios from "axios";
import path from "path";

config({ path: path.join(__dirname, "../.env") });

function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404);
  const error = new Error("🔍 - Not Found - " + req.originalUrl);
  next(error);
}

/* eslint-disable no-unused-vars */
function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  /* eslint-enable no-unused-vars */
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: "failed",
    error: err.message || "internal server error",
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
  });
}

export interface CaptchaResponse {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  "error-codes": string[];
}

async function verifyRecaptchaHook(
  captchaToken: string,
  next: NextFunction | any
) {
  const details = {
    secret: process.env.RECAPTCHA_SECRET_KEY,
    response: captchaToken,
  };
  try {
    const { data } = await axios({
      method: "POST",
      url: "https://www.google.com/recaptcha/api/siteverify",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        accept: "application/json",
      },
      data: new URLSearchParams(details as any),
    });
    console.log("verifying captcha");

    console.log(data);
    if (!data.success) {
      console.log(data["error-codes"]);
      const error = new Error("invalid captcha!!");
      next(error);
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
}

async function verifyRecaptcha(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log(req.body);

  const { captchaToken } = req.body;
  verifyRecaptchaHook(captchaToken, next);
}

export { notFound, errorHandler, verifyRecaptcha, verifyRecaptchaHook };
