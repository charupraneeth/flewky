import express, { Request, Response, NextFunction } from "express";
import { config } from "dotenv";
import path from "path";
config({ path: path.join(__dirname, "../../.env") });

import sgMail from "@sendgrid/mail";
import mailMessage from "../utils/mailMessage";
import generateCode from "../utils/randomCode";
import { setEx } from "../redisClient";
import { expiry } from "../constants";
import { verifyRecaptcha } from "../middlewares/captcha";
import { rateLimiterLogin } from "../middlewares/rateLimit";
import { checkEmail } from "../middlewares/checkEmail";
import { checkBan } from "../middlewares/checkBan";
sgMail.setApiKey(process.env.SENDGRID_API_KEY as any);

const router = express.Router();

router.post(
  "/",
  [rateLimiterLogin, checkEmail, checkBan, verifyRecaptcha],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email }: { email: string } = req.body;
      const code = generateCode();
      const msg = mailMessage(code, email);
      // await sgMail.send(msg);
      await setEx(email, expiry, code);
      res.json({
        message: "success",
        error: "",
      });
    } catch (error: Error | any) {
      console.error(error);

      if (error.response) {
        error.message = error.response;
      }
      next(error);
    }
  }
);

export default router;
