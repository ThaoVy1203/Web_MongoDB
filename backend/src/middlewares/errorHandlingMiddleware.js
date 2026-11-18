import { StatusCodes } from "http-status-codes";
import { env } from "../config/env.js";

const DUPLICATE_FIELD_LABELS = {
  serialNumber: "Số Serial",
  wbCode: "Mã chứng nhận bảo hành",
  warrantyCode: "Mã phiếu bảo hành",
  email: "Email",
  phone: "Số điện thoại",
  customerCode: "Mã khách hàng",
  sku: "Mã SKU sản phẩm",
};

export const notFoundHandler = (req, _res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = StatusCodes.NOT_FOUND;
  next(error);
};

export const errorHandlingMiddleware = (err, _req, res, _next) => {
  if (typeof err === "string") {
    err = new Error(err);
  }

  let statusCode = err.statusCode || err.status || StatusCodes.INTERNAL_SERVER_ERROR;
  let message = err.message || "Lỗi hệ thống máy chủ.";

  const duplicateCode = err.code === 11000 || err.cause?.code === 11000;

  if (err.type === "entity.parse.failed" || (err instanceof SyntaxError && err.status === 400)) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Dữ liệu JSON gửi lên không đúng định dạng.";
  } else if (duplicateCode) {
    statusCode = StatusCodes.CONFLICT;
    const rawKey =
      Object.keys(err.keyPattern || err.keyValue || err.cause?.keyPattern || {})[0] || "";
    const label = DUPLICATE_FIELD_LABELS[rawKey] || "Dữ liệu";
    message = `${label} đã tồn tại trên hệ thống.`;
  } else if (err.name === "ValidationError") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = Object.values(err.errors || {})
      .map((item) => item.message)
      .join(", ");
  } else if (err.name === "CastError") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = `Định dạng định danh (${err.path || "id"}) không hợp lệ.`;
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.";
  }

  const responseError = {
    success: false,
    statusCode,
    message,
  };

  if (["dev", "development"].includes(env.NODE_ENV)) {
    responseError.stack = err.stack;
  }

  res.status(statusCode).json(responseError);
};
