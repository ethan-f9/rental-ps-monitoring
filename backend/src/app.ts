import cors from "cors";
import express, { type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { apiRouter } from "./routes";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  app.use(express.json());

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api", apiRouter);

  return app;
};
