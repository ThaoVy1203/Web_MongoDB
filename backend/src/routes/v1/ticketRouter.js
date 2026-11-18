import express from "express";
import { ticketController } from "../../controllers/ticketController.js";
import { ticketValidation } from "../../validations/ticketValidation.js";
import { optionalAuth } from "../../middlewares/authMiddleware.js";

const Router = express.Router();

Router.get("/", optionalAuth, ticketController.list);
Router.get("/:id", optionalAuth, ticketController.detail);
Router.post("/", optionalAuth, ticketValidation.create, ticketController.create);
Router.patch("/:id/status", optionalAuth, ticketController.updateStatus);
Router.patch("/:id/assign", optionalAuth, ticketController.assign);
Router.post("/:id/parts", optionalAuth, ticketController.addPart);
Router.post("/:id/reject", optionalAuth, ticketController.reject);
Router.post("/:id/confirm-receipt", optionalAuth, ticketController.confirmReceipt);
Router.post("/:id/messages", optionalAuth, ticketController.addMessage);
Router.delete("/:id", optionalAuth, ticketController.remove);

export const ticketRouter = Router;
