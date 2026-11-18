import express from "express";
import { StatusCodes } from "http-status-codes";
import { IS_DB_CONNECTED } from "../../config/mongodb.js";
import { authRouter } from "./authRouter.js";
import { recordRouter } from "./recordRouter.js";
import { ticketRouter } from "./ticketRouter.js";
import { customerRouter } from "./customerRouter.js";
import { productRouter } from "./productRouter.js";
import { analyticsRouter } from "./analyticsRouter.js";
import { analyticsController } from "../../controllers/analyticsController.js";
import { seedInitialDatabase } from "../../services/seedService.js";

const Router = express.Router();

Router.get("/status", (_req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: "WarrantyOps APIs V1 ready!",
    dbConnected: IS_DB_CONNECTED(),
  });
});

Router.post("/ai/suggest-branch", analyticsController.suggestBranch);

Router.post("/seed", async (_req, res, next) => {
  try {
    await seedInitialDatabase({ force: false });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Đồng bộ dữ liệu khởi tạo MongoDB thành công!",
    });
  } catch (error) {
    next(error);
  }
});

Router.use("/auth", authRouter);
Router.use("/records", recordRouter);
Router.use("/tickets", ticketRouter);
Router.use("/customers", customerRouter);
Router.use("/products", productRouter);
Router.use("/analytics", analyticsRouter);

export const APIs_V1 = {
  Router,
};
