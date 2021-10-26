import axios from "axios";
import { Request, Response, NextFunction } from "express";
import { config } from "dotenv";
import path from "path";

config({ path: path.join(__dirname, "../../.env") });

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
  _res: Response,
  next: NextFunction
) {
  console.log(req.body);
  const { captchaToken } = req.body;
  if (!captchaToken || !captchaToken.trim()) {
    return next(new Error("no/invalid captcha"));
  }
  verifyRecaptchaHook(captchaToken, next);
}

export { verifyRecaptcha, verifyRecaptchaHook };
