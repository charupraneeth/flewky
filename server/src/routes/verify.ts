import express from "express";
import ismail from "ismail";
import { rateLimiterVerify } from "../middlewares/rateLimit";
// import { verifyRecaptcha } from "../middlewares";
import { del, get } from "../redisClient";
import genToken from "../utils/genToken";

const router = express.Router();

router.post("/", rateLimiterVerify, async (req, res, next) => {
  try {
    const { email, code }: { email: string; code: string } = req.body;
    if (!email || !email.trim()) {
      throw new Error("email field cannot be empty");
    }
    if (!code || !code.trim()) {
      throw new Error("code cannot be empty");
    }
    const { valid } = ismail(email);
    if (!valid) {
      throw new Error("invalid email address");
    }
    const actualCode = await get(email);
    if (!actualCode) {
      throw new Error("code expired or not found, try again");
    }
    if (actualCode !== code) {
      throw new Error("invalid code");
    }
    // return jwt token
    const token = genToken(email);
    console.log(token);
    del(email);
    res.json({
      message: "success",
      data: token,
      error: "",
    });
  } catch (error: Error | any) {
    if (error.response) {
      error.message = error.response;
    }
    next(error);
  }
});

export default router;
