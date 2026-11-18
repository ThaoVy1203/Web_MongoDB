import express from "express";
import { customerController } from "../../controllers/customerController.js";
import { optionalAuth } from "../../middlewares/authMiddleware.js";

const Router = express.Router();

Router.get("/", optionalAuth, customerController.list);
Router.get("/:id", optionalAuth, customerController.detail);
Router.post("/", optionalAuth, customerController.create);
Router.patch("/:id", optionalAuth, customerController.update);
Router.patch("/:id/toggle-lock", optionalAuth, customerController.toggleLock);
Router.post("/:id/notes", optionalAuth, customerController.addNote);

export const customerRouter = Router;
