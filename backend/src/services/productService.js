import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/apiError.js";
import { Product } from "../models/productModel.js";
import { WarrantyTicket } from "../models/warrantyTicketModel.js";

const CATEGORY_LABELS = {
  laptop: "Laptop/Máy tính",
  phone: "Điện thoại",
  monitor: "Màn hình",
  audio: "Thiết bị âm thanh",
  component: "Linh kiện",
};

const listProducts = async ({ q = "", category = "all", status = "all" } = {}) => {
  const [products, tickets] = await Promise.all([
    Product.find({}).sort({ createdAt: -1 }).lean(),
    WarrantyTicket.find({}).lean(),
  ]);

  const decorated = products.map((p) => {
    const claimCount = tickets.filter(
      (t) =>
        (t.productSku && t.productSku.toUpperCase() === p.sku.toUpperCase()) ||
        t.productName.toLowerCase().includes(p.name.slice(0, 12).toLowerCase())
    ).length;
    const sold = Math.max(20, p.soldCount || 100);
    const defectRate = Number(((claimCount / sold) * 100 + 0.8).toFixed(2));
    return {
      ...p,
      _id: String(p._id),
      claimCount,
      defectRate,
    };
  });

  let filtered = [...decorated];
  if (category && category !== "all") {
    filtered = filtered.filter((p) => p.category === category);
  }
  if (status && status !== "all") {
    filtered = filtered.filter((p) => p.businessStatus === status);
  }
  if (q && q.trim()) {
    const s = q.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.sku.toLowerCase().includes(s) ||
        p.name.toLowerCase().includes(s) ||
        (p.specs || "").toLowerCase().includes(s) ||
        (p.serialSample || "").toLowerCase().includes(s)
    );
  }

  return {
    products: filtered,
    total: decorated.length,
  };
};

const createProduct = async (payload) => {
  if (!payload.sku || !payload.name) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Vui lòng nhập Mã SKU và Tên sản phẩm.");
  }
  const cat = payload.category || "laptop";
  const doc = await Product.create({
    sku: payload.sku.trim().toUpperCase(),
    name: payload.name.trim(),
    category: cat,
    categoryLabel: payload.categoryLabel || CATEGORY_LABELS[cat] || "Thiết bị công nghệ",
    specs: payload.specs || "",
    imageUrl:
      payload.imageUrl ||
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
    serialType: cat === "phone" ? "IMEI" : "SN",
    serialSample: payload.serialSample || `${payload.sku.slice(0, 5).toUpperCase()}-2026-VN`,
    warrantyMonths: Number(payload.warrantyMonths) || 12,
    warrantyPolicyName:
      payload.warrantyPolicyName || `Bảo hành Chính hãng ${Number(payload.warrantyMonths) || 12} Tháng`,
    price: Number(payload.price) || 0,
    businessStatus: payload.businessStatus || "selling",
    commonFaultPart: payload.commonFaultPart || "Module nguồn / Cáp tín hiệu",
  });
  return doc.toObject();
};

const updateProduct = async (id, updates) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "ID sản phẩm không hợp lệ.");
  }
  const updated = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!updated) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy sản phẩm.");
  }
  return updated.toObject();
};

const deleteProduct = async (id) => {
  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy sản phẩm cần xóa.");
  }
  return { deleted: true };
};

export const productService = {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
