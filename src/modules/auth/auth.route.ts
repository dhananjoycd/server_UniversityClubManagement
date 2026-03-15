import express, { Router } from "express";
import { toNodeHandler } from "better-auth/node";

import { auth } from "../../config/betterAuth";
import { authController } from "./auth.controller";

const authRouter = Router();

const authJsonParser = express.json();

authRouter.post("/register", authJsonParser, authController.register);
authRouter.post("/login", authJsonParser, authController.login);
authRouter.post("/logout", authController.logout);
authRouter.get("/session", authController.getSession);
authRouter.use(toNodeHandler(auth));

export default authRouter;
