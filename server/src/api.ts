import express from "express";

import login from "./routes/login";
import verify from "./routes/verify";

const router = express.Router();

router.use("/login", login);
router.use("/verify", verify);

export default router;
