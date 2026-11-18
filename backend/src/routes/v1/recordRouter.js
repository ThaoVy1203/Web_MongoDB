import express from "express";
import { recordController } from "../../controllers/recordController.js";
import { recordValidation } from "../../validations/recordValidation.js";
import { optionalAuth } from "../../middlewares/authMiddleware.js";

const Router = express.Router();

Router.get("/lookup", recordController.lookup);
Router.post("/batch-check", recordValidation.batchCheck, recordController.batchCheck);
Router.get("/", optionalAuth, recordController.list);
Router.get("/:id", recordController.detail);
Router.post("/", optionalAuth, recordValidation.create, recordController.create);
Router.post("/:id/renew", optionalAuth, recordValidation.renew, recordController.renew);
Router.patch("/:id", optionalAuth, recordController.update);
Router.delete("/:id", optionalAuth, recordController.remove);

export const recordRouter = Router;
