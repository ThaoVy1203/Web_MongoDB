import { StatusCodes } from "http-status-codes";
import { productService } from "../services/productService.js";

const list = async (req, res, next) => {
  try {
    const result = await productService.listProducts(req.query);
    res.status(StatusCodes.OK).json({
      success: true,
      data: result.products,
      total: result.total,
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const created = await productService.createProduct(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: `Đã thêm sản phẩm ${created.sku} vào danh mục!`,
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const updated = await productService.updateProduct(req.params.id, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Cập nhật sản phẩm thành công!",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Đã xóa sản phẩm khỏi danh mục.",
    });
  } catch (error) {
    next(error);
  }
};

export const productController = {
  list,
  create,
  update,
  remove,
};
