import express from "express";
import { authController } from "../../controllers/authController.js";
import { authValidation } from "../../validations/authValidation.js";
import { authMiddleware, optionalAuth } from "../../middlewares/authMiddleware.js";

const Router = express.Router();

Router.post("/login", authValidation.login, authController.login);
Router.post("/register", authValidation.register, authController.register);
Router.post("/refresh-token", authValidation.refreshToken, authController.refreshToken);
Router.get("/me", authMiddleware, authController.getMe);
Router.post("/logout", optionalAuth, authController.logout);

export const authRouter = Router;
