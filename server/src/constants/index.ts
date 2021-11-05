import path from "path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "../../.env") });

export const inProd = process.env.NODE_ENV !== "development";

export const inStaging = process.env.NODE_ENV === "staging";

export const expiry = 60 * 2; // 2 mintues

export const maxReports = 6;

export const queueName = inProd ? "unmatched" : "dev:unmatched";
