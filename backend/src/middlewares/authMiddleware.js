import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/apiError.js";
import { jwtConfig } from "../config/jwt.js";

export const authMiddleware = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Vui lòng đăng nhập để tiếp tục."));
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwtConfig.verifyAccessToken(token);
    req.user = decoded;
    return next();
  } catch {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn."));
  }
};

export const optionalAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      req.user = jwtConfig.verifyAccessToken(authHeader.split(" ")[1]);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  return next();
};

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền truy cập chức năng này."));
  }
  return next();
};
