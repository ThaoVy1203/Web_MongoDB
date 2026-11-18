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

const stripPhoneDigits = (str = "") => String(str).replace(/\D/g, "");

const generateUniqueCustomerCode = async () => {
  for (let i = 0; i < 6; i += 1) {
    const code = `KH-${Math.floor(10000 + Math.random() * 89999)}`;
    const [uExists, cExists] = await Promise.all([
      User.exists({ customerCode: code }),
      Customer.exists({ customerCode: code }),
    ]);
    if (!uExists && !cExists) return code;
  }
  return `KH-${Date.now().toString().slice(-6)}`;
};

const login = async ({ identifier, email, password }) => {
  const raw = String(identifier || email || "").trim().toLowerCase();
  const cleanPhone = stripPhoneDigits(raw);

  let user = null;
  if (raw === "admin01" || raw === "admin") {
    user = await User.findOne({ role: "admin" }).select("+password");
  } else if (cleanPhone.length >= 8 && !raw.includes("@")) {
    const candidates = await User.find({}).select("+password");
    user =
      candidates.find(
        (u) => stripPhoneDigits(u.phone) === cleanPhone || u.email.toLowerCase() === raw
      ) || null;
  } else {
    user = await User.findOne({
      $or: [{ email: raw }, { staffCode: raw.toUpperCase() }, { customerCode: raw.toUpperCase() }],
    }).select("+password");
  }

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Tài khoản hoặc mật khẩu không chính xác.");
  }

  if (user.isActive === false) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Tài khoản này đang bị tạm khóa. Vui lòng liên hệ quản trị viên.");
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
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail);

  if (!isPhoneOnly && !isEmailValid) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Vui lòng nhập Email hoặc Số điện thoại hợp lệ.");
  }

  const normalizedEmail = isPhoneOnly
    ? `${stripPhoneDigits(rawEmail)}@member.warrantyops.vn`
    : rawEmail.toLowerCase();
  const normalizedPhone = stripPhoneDigits(phone) ? phone.trim() : isPhoneOnly ? rawEmail : "";
  const cleanPhone = stripPhoneDigits(normalizedPhone);

  const existingEmail = await User.findOne({ email: normalizedEmail });
  if (existingEmail) {
    throw new ApiError(StatusCodes.CONFLICT, "Email hoặc số điện thoại này đã được đăng ký.");
  }

  if (cleanPhone.length >= 8) {
    const allUsers = await User.find({ phone: { $ne: "" } }).select("phone").lean();
    if (allUsers.some((u) => stripPhoneDigits(u.phone) === cleanPhone)) {
      throw new ApiError(StatusCodes.CONFLICT, "Số điện thoại này đã được sử dụng cho tài khoản khác.");
    }
  }

  const customerCode = await generateUniqueCustomerCode();

  const createdUser = await User.create({
    customerCode,
    fullname: fullname.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
    role: "customer",
    tier: "Member",
    loyaltyPoints: 200,
    isActive: true,
  });

  await Customer.create({
    customerCode,
    fullName: fullname.trim(),
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
    throw new ApiError(StatusCodes.BAD_REQUEST, "Thiếu refresh token.");
  }
  let decoded;
  try {
    decoded = jwtConfig.verifyRefreshToken(token);
  } catch {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token không hợp lệ hoặc đã hết hạn.");
  }

  const user = await User.findById(decoded.userId).select("+refresh_token");
  if (!user || user.refresh_token !== token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Phiên đăng nhập đã hết hiệu lực.");
  }
  if (user.isActive === false) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Tài khoản này đang bị tạm khóa.");
  }

  const payload = buildPayload(user);
  const access_token = jwtConfig.generateAccessToken(payload);
  const refresh_token = jwtConfig.generateRefreshToken(payload);
  await User.findByIdAndUpdate(user._id, { refresh_token });

  return { access_token, refresh_token };
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy thông tin người dùng.");
  }
  if (user.isActive === false) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Tài khoản này đang bị tạm khóa.");
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
