import express, { Request, Response, NextFunction } from "express";
import { config } from "dotenv";
import path from "path";
import Core from "@alicloud/pop-core";

config({ path: path.join(__dirname, "../../.env") });

import generateCode from "../utils/randomCode";
import { setEx } from "../redisClient";
import { expiry } from "../constants";
import { verifyRecaptcha } from "../middlewares/captcha";
import { rateLimiterLogin } from "../middlewares/rateLimit";
import { checkEmail } from "../middlewares/checkEmail";
import { checkBan } from "../middlewares/checkBan";
import mailParams from "../utils/mailParams";

const router = express.Router();

const client = new Core({
  accessKeyId: process.env.DM_ACCESS_KEY_ID!,
  accessKeySecret: process.env.DM_SECRET_ACCESS_KEY!,
  endpoint: process.env.DM_ENDPOINT!,
  apiVersion: process.env.DM_API_VERSION!,
});

router.post(
  "/",
  [rateLimiterLogin, checkEmail, checkBan, verifyRecaptcha],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email }: { email: string } = req.body;
      const code = generateCode();
      const params = mailParams(code, email, req.ip);
      const mailResponse = await client.request("SingleSendMail", params, {
        method: "POST",
      });
      console.log(mailResponse);
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
