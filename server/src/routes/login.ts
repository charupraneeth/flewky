import express from "express";
import ismail from "ismail";
import { config } from "dotenv";
import path from "path";
config({ path: path.join(__dirname, "../../.env") });

import sgMail from "@sendgrid/mail";
import mailMessage from "../utils/mailMessage";
import generateCode from "../utils/randomCode";
import { setEx } from "../redisClient";
import { expiry } from "../constants";
sgMail.setApiKey(process.env.SENDGRID_API_KEY as any);

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { email }: { email: string } = req.body;
    if (!email || !email.trim()) {
      throw new Error("email field cannot be empty");
    }
    const { valid } = ismail(email);
    if (!valid) {
      throw new Error("invalid email address");
    }

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
});

export default router;
