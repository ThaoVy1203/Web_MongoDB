import express from "express";
import { analyticsController } from "../../controllers/analyticsController.js";

const Router = express.Router();

Router.get("/overview", analyticsController.overview);
Router.get("/reports", analyticsController.reports);
Router.get("/export/:type", analyticsController.exportCsv);

export const analyticsRouter = Router;
