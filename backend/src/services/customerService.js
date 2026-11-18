import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/apiError.js";
import { Customer } from "../models/customerModel.js";
import { WarrantyRecord } from "../models/warrantyRecordModel.js";
import { WarrantyTicket } from "../models/warrantyTicketModel.js";
import { decorateRecord, decorateTicket } from "../utils/formatters.js";

const findRawCustomer = async (idOrCode) => {
  const q = String(idOrCode || "").trim();
  if (!q) return null;
  if (mongoose.Types.ObjectId.isValid(q)) {
    const byId = await Customer.findById(q);
    if (byId) return byId;
  }
  return Customer.findOne({ customerCode: q.toUpperCase() });
};

const listCustomers = async ({ q = "", category = "all", city = "" } = {}) => {
  const [customers, records, tickets] = await Promise.all([
    Customer.find({}).sort({ createdAt: -1 }).lean(),
    WarrantyRecord.find({}).lean(),
    WarrantyTicket.find({}).lean(),
  ]);

  const enriched = customers.map((c) => {
    const custRecords = records.filter(
      (r) =>
        r.customerCode === c.customerCode ||
        (c.email && r.customerEmail && r.customerEmail.toLowerCase() === c.email.toLowerCase())
    );
    const custTickets = tickets.filter(
      (t) =>
        t.customerCode === c.customerCode ||
        (c.phone && t.customerPhone.replace(/\D/g, "") === c.phone.replace(/\D/g, ""))
    );
    return {
      ...c,
      _id: String(c._id),
      deviceCount: custRecords.length,
      warrantyClaimCount: custTickets.length,
    };
  });

  let filtered = [...enriched];
  if (category && category !== "all") {
    filtered = filtered.filter((c) => c.customerType === category);
  }
  if (city && city.trim()) {
    const cNorm = city.trim().toLowerCase();
    filtered = filtered.filter((c) => (c.city || "").toLowerCase().includes(cNorm));
  }
  if (q && q.trim()) {
    const s = q.trim().toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.fullName.toLowerCase().includes(s) ||
        c.customerCode.toLowerCase().includes(s) ||
        (c.phone || "").toLowerCase().includes(s) ||
        (c.email || "").toLowerCase().includes(s)
    );
  }

  return {
    customers: filtered,
    total: enriched.length,
  };
};

const getCustomerDetail = async (idOrCode) => {
  const doc = await findRawCustomer(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hồ sơ khách hàng.");
  }
  const c = doc.toObject();
  const [records, tickets] = await Promise.all([
    WarrantyRecord.find({
      $or: [
        { customerCode: c.customerCode },
        ...(c.email ? [{ customerEmail: c.email.toLowerCase() }] : []),
      ],
    }).sort({ createdAt: -1 }),
    WarrantyTicket.find({
      $or: [
        { customerCode: c.customerCode },
        ...(c.email ? [{ customerEmail: c.email.toLowerCase() }] : []),
      ],
    }).sort({ createdAt: -1 }),
  ]);

  return {
    ...c,
    _id: String(c._id),
    devices: records.map(decorateRecord),
    tickets: tickets.map(decorateTicket),
  };
};

const createCustomer = async (payload) => {
  if (!payload.fullName || !payload.phone) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Vui lòng nhập đầy đủ Họ tên và Số điện thoại.");
  }
  const rand = Math.floor(10310 + Math.random() * 89000);
  const customerCode =
    (payload.customerCode && payload.customerCode.trim().toUpperCase()) || `KH-${rand}`;

  const doc = await Customer.create({
    customerCode,
    fullName: payload.fullName,
    phone: payload.phone,
    email: payload.email || "",
    customerType: payload.customerType || "canhan",
    rank: payload.customerType === "vip" ? "A+" : payload.customerType === "daily" ? "Enterprise" : "Standard",
    idNumber: payload.idNumber || "",
    city: payload.city || "Hà Nội",
    address: payload.address || "",
    auditLogs: [
      {
        action: "Tạo mới hồ sơ khách hàng",
        description: `Khởi tạo mã định danh ${customerCode}`,
        actor: "Admin CRM",
      },
    ],
  });

  return doc.toObject();
};

const updateCustomer = async (idOrCode, updates) => {
  const doc = await findRawCustomer(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy khách hàng.");
  }
  const allowed = ["fullName", "phone", "email", "customerType", "rank", "idNumber", "city", "address", "status"];
  for (const key of allowed) {
    if (updates[key] !== undefined) doc[key] = updates[key];
  }
  doc.auditLogs.unshift({
    action: "Cập nhật thông tin CRM",
    description: "Điều chỉnh thông tin liên hệ và phân hạng khách hàng",
    actor: "Admin CRM",
    createdAt: new Date(),
  });
  await doc.save();
  return getCustomerDetail(doc._id);
};

const toggleLockCustomer = async (idOrCode) => {
  const doc = await findRawCustomer(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy khách hàng.");
  }
  doc.status = doc.status === "locked" ? "active" : "locked";
  doc.auditLogs.unshift({
    action: doc.status === "locked" ? "Tạm khóa hồ sơ" : "Mở khóa hồ sơ",
    description: `Trạng thái chuyển sang ${doc.status}`,
    actor: "Admin CRM",
    createdAt: new Date(),
  });
  await doc.save();
  return getCustomerDetail(doc._id);
};

const addCustomerNote = async (idOrCode, { content }, authorName = "Chuyên viên CSKH") => {
  const doc = await findRawCustomer(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy khách hàng.");
  }
  if (!content || !content.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Nội dung ghi chú không được để trống.");
  }
  doc.notes.unshift({
    authorName,
    authorRole: "Chăm sóc Khách hàng",
    content: content.trim(),
    createdAt: new Date(),
  });
  await doc.save();
  return getCustomerDetail(doc._id);
};

export const customerService = {
  listCustomers,
  getCustomerDetail,
  createCustomer,
  updateCustomer,
  toggleLockCustomer,
  addCustomerNote,
};
