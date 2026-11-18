import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { CONNECT_DB } from "./config/mongodb.js";
import { APIs_V1 } from "./routes/v1/index.js";
import { seedInitialDatabase } from "./services/seedService.js";
import {
  errorHandlingMiddleware,
  notFoundHandler,
} from "./middlewares/errorHandlingMiddleware.js";

const app = express();

const START_SERVER = () => {
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
      credentials: true,
    })
  );
  app.use(express.json({ limit: "5mb" }));

  app.use("/v1", APIs_V1.Router);

  app.use(notFoundHandler);
  app.use(errorHandlingMiddleware);

  app.listen(env.APP_PORT, env.APP_HOST, () => {
    console.log(`🚀 WarrantyOps API Server listening on http://${env.APP_HOST}:${env.APP_PORT}/v1`);
  });
};

CONNECT_DB()
  .then(() => seedInitialDatabase({ force: false }))
  .then(() => START_SERVER())
  .catch((error) => {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  });
