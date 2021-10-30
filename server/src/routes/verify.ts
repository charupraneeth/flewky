import express, { NextFunction, Request, Response } from "express";
import ismail from "ismail";
import { checkEmail } from "../middlewares/checkEmail";
import { rateLimiterVerify } from "../middlewares/rateLimit";
// import { verifyRecaptcha } from "../middlewares";
import { del, get } from "../redisClient";
import genToken from "../utils/genToken";

const router = express.Router();

router.post(
  "/",
  [rateLimiterVerify, checkEmail],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, code }: { email: string; code: string } = req.body;

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
      await del(email);
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
  }
);

export default router;
