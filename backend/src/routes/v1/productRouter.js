import express from "express";
import { productController } from "../../controllers/productController.js";
import { optionalAuth } from "../../middlewares/authMiddleware.js";

const Router = express.Router();

Router.get("/", optionalAuth, productController.list);
Router.post("/", optionalAuth, productController.create);
Router.patch("/:id", optionalAuth, productController.update);
Router.delete("/:id", optionalAuth, productController.remove);

export const productRouter = Router;
