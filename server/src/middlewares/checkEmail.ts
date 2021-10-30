import { Request, Response, NextFunction } from "express";
import { isCollegeMail } from "../utils/validateMail";
import ismail from "ismail";

function checkEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { email }: { email: string } = req.body;
    if (!email || !email.trim()) {
      throw new Error("email field cannot be empty");
    }
    const { valid } = ismail(email);
    if (!valid) {
      throw new Error("invalid email address");
    }
    if (!isCollegeMail(email)) {
      throw new Error("invalid college mail");
    }
    next();
  } catch (error) {
    res.status(422);
    next(error);
  }
}

export { checkEmail };
