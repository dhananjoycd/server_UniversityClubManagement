import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { env } from "./config/env";
import errorHandler from "./middlewares/errorHandler";
import notFound from "./middlewares/notFound";
import authRouter from "./modules/auth/auth.route";
import apiRouter from "./routes/index";
import sendResponse from "./utils/sendResponse";

const app = express();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(apiLimiter);

app.get("/api/v1/health", (_req, res) => {
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Server is running",
    data: {
      environment: env.NODE_ENV,
      uptime: process.uptime(),
    },
  });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1", apiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;

