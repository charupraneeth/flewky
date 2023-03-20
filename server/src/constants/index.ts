import path from "path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "../../.env") });

export const inProd = process.env.NODE_ENV !== "development";

export const inStaging = process.env.NODE_ENV === "staging";

export const expiry = 60 * 2; // 2 mintues

export const maxReports = 6;

export const corsWhitelist =
  inProd || inStaging
    ? [
        "https://flewky.com",
        "https://www.flewky.com",
        "https://dev.flewky.com",
        "https://dev.flewky.com",
        "https://flewky.netlify.app",
      ]
    : "*";

export const queueName = inProd && !inStaging ? "unmatched" : "dev:unmatched";
