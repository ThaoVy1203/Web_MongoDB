import { StatusCodes } from "http-status-codes";
import { env } from "../config/env.js";

export const notFoundHandler = (req, _res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = StatusCodes.NOT_FOUND;
  next(error);
};

export const errorHandlingMiddleware = (err, _req, res, _next) => {
  if (typeof err === "string") {
    err = new Error(err);
  }

  let statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal Server Error";

  if (err.code === 11000) {
    statusCode = StatusCodes.CONFLICT;
    const field = Object.keys(err.keyPattern || {})[0] || "Dữ liệu";
    message = `${field} đã tồn tại trên hệ thống.`;
  } else if (err.name === "ValidationError") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = Object.values(err.errors || {})
      .map((item) => item.message)
      .join(", ");
  } else if (err.name === "CastError") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = `Định dạng ${err.path} không hợp lệ: ${err.value}`;
  }

  const responseError = {
    success: false,
    statusCode,
    message,
  };

  if (env.NODE_ENV === "dev") {
    responseError.stack = err.stack;
  }

  res.status(statusCode).json(responseError);
};
