import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/apiError.js";
import { jwtConfig } from "../config/jwt.js";
import { User } from "../models/userModel.js";
import { Customer } from "../models/customerModel.js";

const buildPayload = (user) => ({
  userId: String(user._id),
  fullname: user.fullname,
  email: user.email,
  phone: user.phone || "",
  customerCode: user.customerCode || "",
  role: user.role || "customer",
  tier: user.tier || "Standard",
});

const login = async ({ identifier, email, password }) => {
  const raw = String(identifier || email || "").trim().toLowerCase();
  const cleanPhone = raw.replace(/\D/g, "");

  let query = { email: raw };
  if (raw === "admin01" || raw === "admin") {
    query = { role: "admin" };
  } else if (cleanPhone.length >= 8 && !raw.includes("@")) {
    query = {
      $or: [{ phone: new RegExp(cleanPhone.slice(-8)) }, { email: raw }],
    };
  } else {
    query = {
      $or: [{ email: raw }, { staffCode: raw.toUpperCase() }, { customerCode: raw.toUpperCase() }],
    };
  }

  const user = await User.findOne(query).select("+password");
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Tài khoản hoặc mật khẩu không chính xác.");
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Tài khoản hoặc mật khẩu không chính xác.");
  }

  const payload = buildPayload(user);
  const access_token = jwtConfig.generateAccessToken(payload);
  const refresh_token = jwtConfig.generateRefreshToken(payload);

  await User.findByIdAndUpdate(user._id, { refresh_token });

  return {
    user: user.toJSON(),
    access_token,
    refresh_token,
  };
};

const register = async ({ fullname, email, phone = "", password }) => {
  const rawEmail = String(email).trim();
  const isPhoneOnly = /^[0-9+.\-\s]{8,15}$/.test(rawEmail);
  const normalizedEmail = isPhoneOnly
    ? `${rawEmail.replace(/\D/g, "")}@member.warrantyops.vn`
    : rawEmail.toLowerCase();
  const normalizedPhone = phone.trim() || (isPhoneOnly ? rawEmail : "");

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, "Email hoặc số điện thoại này đã được đăng ký.");
  }

  const rand = Math.floor(10000 + Math.random() * 89999);
  const customerCode = `KH-${rand}`;

  const createdUser = await User.create({
    customerCode,
    fullname,
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
    role: "customer",
    tier: "Member",
    loyaltyPoints: 200,
  });

  await Customer.create({
    customerCode,
    fullName: fullname,
    phone: normalizedPhone || "Chưa cập nhật",
    email: normalizedEmail,
    customerType: "canhan",
    rank: "Standard",
    auditLogs: [
      {
        action: "Khởi tạo tài khoản số",
        description: "Đăng ký tài khoản trực tuyến qua cổng WarrantyOps",
        actor: "Web Portal",
      },
    ],
  }).catch(() => null);

  const payload = buildPayload(createdUser);
  const access_token = jwtConfig.generateAccessToken(payload);
  const refresh_token = jwtConfig.generateRefreshToken(payload);

  await User.findByIdAndUpdate(createdUser._id, { refresh_token });

  return {
    user: createdUser.toJSON(),
    access_token,
    refresh_token,
  };
};

const refreshToken = async (token) => {
  if (!token) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Refresh token is required.");
  }
  try {
    const decoded = jwtConfig.verifyRefreshToken(token);
    const user = await User.findById(decoded.userId).select("+refresh_token");
    if (!user || user.refresh_token !== token) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token không hợp lệ.");
    }

    const payload = buildPayload(user);
    const access_token = jwtConfig.generateAccessToken(payload);
    const refresh_token = jwtConfig.generateRefreshToken(payload);
    await User.findByIdAndUpdate(user._id, { refresh_token });

    return { access_token, refresh_token };
  } catch {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token không hợp lệ hoặc đã hết hạn.");
  }
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy thông tin người dùng.");
  }
  return user.toJSON();
};

const logout = async (userId) => {
  if (userId) {
    await User.findByIdAndUpdate(userId, { refresh_token: null });
  }
  return { ok: true };
};

export const authService = {
  login,
  register,
  refreshToken,
  getMe,
  logout,
};
