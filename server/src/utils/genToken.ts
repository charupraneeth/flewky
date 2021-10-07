import { config } from "dotenv";
import path from "path";
config({ path: path.join(__dirname, "../../.env") });
import jwt from "jsonwebtoken";

async function genToken(email: string) {
  const token = jwt.sign(
    {
      data: email,
    },
    process.env.JWT_SECRET as any,
    { expiresIn: "3h" }
  );
  return token;
}

export default genToken;
