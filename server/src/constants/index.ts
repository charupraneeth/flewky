import path from "path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "../../.env") });

export const inProd = process.env.NODE_ENV !== "development";

export const expiry = 60 * 2; // 2 mintues

export const maxReports = 6;
