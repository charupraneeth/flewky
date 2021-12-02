import express, { Request, Response, NextFunction } from "express";
import { config } from "dotenv";
import path from "path";
import aws from "aws-sdk";

aws.config.update({ region: process.env.SES_REGION });
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

const ses = new aws.SES();

router.post(
  "/",
  [rateLimiterLogin, checkEmail, checkBan, verifyRecaptcha],
  (req: Request, res: Response, next: NextFunction) => {
    const { email }: { email: string } = req.body;
    const code = generateCode();
    const params = mailParams(code, email, req.ip);
    ses.sendEmail(params, async function (err, data) {
      // If something goes wrong, print an error message.
      try {
        if (err) {
          throw err;
        } else {
          console.log("Email sent! Message ID: ", data.MessageId);
          await setEx(email, expiry, code);
          res.json({
            message: "success",
            error: "",
          });
        }
      } catch (error: Error | any) {
        console.error(error);

        if (error.response) {
          error.message = error.response;
        }
        next(error);
      }
    });
  }
);

export default router;
