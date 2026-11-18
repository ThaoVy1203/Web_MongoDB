import { StatusCodes } from "http-status-codes";
import { authService } from "../services/authService.js";

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Đăng nhập thành công!",
      data: result.user,
      access_token: result.access_token,
      refresh_token: result.refresh_token,
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Tạo tài khoản thành công!",
      data: result.user,
      access_token: result.access_token,
      refresh_token: result.refresh_token,
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.body?.refresh_token);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Làm mới phiên đăng nhập thành công!",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.userId);
    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user?.userId);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Đã đăng xuất an toàn.",
    });
  } catch (error) {
    next(error);
  }
};

export const authController = {
  login,
  register,
  refreshToken,
  getMe,
  logout,
};
