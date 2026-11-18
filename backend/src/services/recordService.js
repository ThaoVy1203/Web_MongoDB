import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/apiError.js";
import { addMonthsSafe, decorateRecord, decorateTicket } from "../utils/formatters.js";
import { WarrantyRecord } from "../models/warrantyRecordModel.js";
import { WarrantyTicket } from "../models/warrantyTicketModel.js";
import { Customer } from "../models/customerModel.js";

const stripDigits = (str = "") => String(str).replace(/\D/g, "");

const findRawRecordByIdOrCode = async (idOrCode) => {
  const q = String(idOrCode || "").trim();
  if (!q) return null;
  if (mongoose.Types.ObjectId.isValid(q)) {
    const byId = await WarrantyRecord.findById(q);
    if (byId) return byId;
  }
  const upper = q.toUpperCase();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return WarrantyRecord.findOne({
    $or: [{ wbCode: upper }, { serialNumber: upper }, { imei: new RegExp(`^${escaped}$`, "i") }],
  });
};

const generateUniqueWbCode = async (preferred = "") => {
  const clean = String(preferred || "").trim().toUpperCase();
  if (clean) return clean;
  const year = new Date().getFullYear();
  for (let i = 0; i < 6; i += 1) {
    const code = `WB-${year}-${Math.floor(1000 + Math.random() * 8999)}`;
    const exists = await WarrantyRecord.exists({ wbCode: code });
    if (!exists) return code;
  }
  return `WB-${year}-${Date.now().toString().slice(-5)}`;
};

const listRecords = async ({
  status = "all",
  q = "",
  customerCode = "",
  email = "",
  phone = "",
  strictMine = false,
} = {}) => {
  const [docs, tickets] = await Promise.all([
    WarrantyRecord.find({}).sort({ createdAt: -1 }),
    WarrantyTicket.find({}).lean(),
  ]);

  const decoratedAll = docs.map((doc) => {
    const rec = decorateRecord(doc);
    const activeTicket = tickets.find(
      (t) =>
        t.productSerial.toUpperCase() === rec.serialNumber.toUpperCase() &&
        !["Đã trả khách", "Từ chối bảo hành"].includes(t.status)
    );
    return {
      ...rec,
      activeTicketCode: activeTicket ? activeTicket.warrantyCode : null,
      activeTicketStatus: activeTicket ? activeTicket.status : null,
    };
  });

  let scoped = decoratedAll;
  const cleanUserPhone = stripDigits(phone);
  if (strictMine) {
    scoped = decoratedAll.filter(
      (r) =>
        (customerCode && r.customerCode === customerCode) ||
        (email && r.customerEmail && r.customerEmail.toLowerCase() === email.toLowerCase()) ||
        (cleanUserPhone.length >= 9 && stripDigits(r.customerPhone) === cleanUserPhone)
    );
  } else if (customerCode || email) {
    const matched = decoratedAll.filter(
      (r) =>
        (customerCode && r.customerCode === customerCode) ||
        (email && r.customerEmail && r.customerEmail.toLowerCase() === email.toLowerCase())
    );
    if (matched.length > 0) {
      scoped = matched;
    }
  }

  const counts = {
    all: scoped.length,
    active: scoped.filter((r) => r.computedStatus === "active").length,
    expiring: scoped.filter((r) => r.computedStatus === "expiring").length,
    expired: scoped.filter((r) => r.computedStatus === "expired").length,
    rejected: scoped.filter((r) => r.computedStatus === "rejected").length,
  };

  let filtered = [...scoped];
  if (status && status !== "all") {
    filtered = filtered.filter((r) => r.computedStatus === status);
  }
  if (q && q.trim()) {
    const keyword = q.trim().toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.wbCode.toLowerCase().includes(keyword) ||
        r.serialNumber.toLowerCase().includes(keyword) ||
        r.productName.toLowerCase().includes(keyword) ||
        r.customerName.toLowerCase().includes(keyword) ||
        (r.customerPhone || "").toLowerCase().includes(keyword)
    );
  }

  return { records: filtered, counts };
};

const getRecordDetail = async (idOrCode) => {
  const doc = await findRawRecordByIdOrCode(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hồ sơ chứng nhận bảo hành.");
  }
  const rec = decorateRecord(doc);
  const relatedTickets = await WarrantyTicket.find({
    productSerial: rec.serialNumber.toUpperCase(),
  }).sort({ createdAt: -1 });

  return {
    ...rec,
    relatedTickets: relatedTickets.map(decorateTicket),
  };
};

const lookupDevice = async (rawQuery = "") => {
  const query = String(rawQuery || "").trim();
  if (!query) {
    return null;
  }

  const upper = query.toUpperCase();
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let recordDoc = await WarrantyRecord.findOne({
    $or: [{ serialNumber: upper }, { wbCode: upper }, { imei: new RegExp(`^${escaped}$`, "i") }],
  });

  // Hỗ trợ tra cứu bằng SĐT khách hàng (>= 9 chữ số)
  const digits = stripDigits(query);
  if (!recordDoc && digits.length >= 9) {
    const allRecs = await WarrantyRecord.find({}).sort({ createdAt: -1 });
    recordDoc = allRecs.find((r) => stripDigits(r.customerPhone) === digits) || null;
  }

  if (recordDoc) {
    return getRecordDetail(recordDoc._id);
  }

  // Fallback check if user entered an RMA ticket code
  const ticketDoc = await WarrantyTicket.findOne({
    $or: [{ warrantyCode: upper }, { productSerial: upper }],
  }).sort({ createdAt: -1 });

  if (ticketDoc) {
    const linkedRecord = await WarrantyRecord.findOne({
      serialNumber: ticketDoc.productSerial.toUpperCase(),
    });
    if (linkedRecord) {
      return getRecordDetail(linkedRecord._id);
    }

    const pDate = ticketDoc.purchaseDate || ticketDoc.createdAt || new Date();
    const eDate =
      ticketDoc.warrantyExpiryDate || addMonthsSafe(pDate, ticketDoc.warrantyPeriodMonths || 12);

    return {
      ...decorateRecord({
        _id: ticketDoc._id,
        wbCode: ticketDoc.warrantyCode,
        serialNumber: ticketDoc.productSerial,
        productName: ticketDoc.productName,
        category: ticketDoc.category,
        categoryTag: "CHỨNG TỪ PHIẾU BẢO HÀNH",
        origin: "Chính hãng",
        customerCode: ticketDoc.customerCode || "",
        customerName: ticketDoc.customerName,
        customerPhone: ticketDoc.customerPhone,
        customerEmail: ticketDoc.customerEmail || "",
        customerAddress: ticketDoc.customerAddress,
        purchaseDate: pDate,
        endDate: eDate,
        periodMonths: ticketDoc.warrantyPeriodMonths || 12,
        packageName: ticketDoc.servicePackage,
        packageDesc: ticketDoc.issueDescription,
        image:
          "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
        benefits: [],
        renewalHistory: [],
      }),
      relatedTickets: [decorateTicket(ticketDoc)],
    };
  }

  return null;
};

const batchCheckSerials = async (serialsInput = "") => {
  const rawList = Array.isArray(serialsInput)
    ? serialsInput
    : String(serialsInput || "").split(/[\n,;]+/);

  const list = rawList
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);

  const results = [];
  for (const item of list.slice(0, 40)) {
    const found = await lookupDevice(item);
    results.push({
      query: item.toUpperCase(),
      found: Boolean(found),
      wbCode: found ? found.wbCode : "—",
      serialNumber: found ? found.serialNumber : item.toUpperCase(),
      productName: found ? found.productName : "Chưa đăng ký trong kho chứng từ",
      customerName: found ? found.customerName : "—",
      computedStatus: found ? found.computedStatus : "not_found",
      daysRemaining: found ? found.daysRemaining : null,
      endDate: found ? found.endDate : null,
    });
  }
  return results;
};

const createRecord = async (payload, currentUser = null) => {
  const serialUpper = payload.serialNumber.trim().toUpperCase();
  const existing = await WarrantyRecord.findOne({ serialNumber: serialUpper });
  if (existing) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      `Số Serial ${serialUpper} đã được cấp giấy chứng nhận (${existing.wbCode}).`
    );
  }

  const parsedP = payload.purchaseDate ? new Date(payload.purchaseDate) : new Date();
  if (Number.isNaN(parsedP.getTime())) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Ngày mua / kích hoạt không hợp lệ.");
  }

  const months = Number(payload.periodMonths) || 12;
  const endDate = addMonthsSafe(parsedP, months);
  const wbCode = await generateUniqueWbCode(payload.wbCode);

  const isStaff = currentUser && ["admin", "technician"].includes(currentUser.role);
  let resolvedCustomerCode = payload.customerCode || "";
  let resolvedEmail = payload.customerEmail || "";

  // Nếu Admin cấp hộ khách hàng mà chưa gửi customerCode, tự động khớp theo SĐT/Email nếu khách đã có trong CRM
  if (!resolvedCustomerCode && (payload.customerPhone || payload.customerEmail)) {
    const cleanPhone = stripDigits(payload.customerPhone);
    const crmList = await Customer.find({}).lean();
    const matchedCrm = crmList.find(
      (c) =>
        (payload.customerEmail &&
          c.email &&
          c.email.toLowerCase() === payload.customerEmail.toLowerCase()) ||
        (cleanPhone.length >= 9 && stripDigits(c.phone) === cleanPhone)
    );
    if (matchedCrm) {
      resolvedCustomerCode = matchedCrm.customerCode;
      resolvedEmail = resolvedEmail || matchedCrm.email || "";
    }
  }

  if (!resolvedCustomerCode && !isStaff && currentUser?.customerCode) {
    resolvedCustomerCode = currentUser.customerCode;
  }
  if (!resolvedEmail && !isStaff && currentUser?.email) {
    resolvedEmail = currentUser.email;
  }

  const categoryImages = {
    "Điện thoại": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
    "Màn hình": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    "Thiết bị âm thanh": "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80",
    "Laptop/Máy tính": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
  };

  const doc = await WarrantyRecord.create({
    wbCode,
    serialNumber: serialUpper,
    imei: payload.imei || "",
    modelCode: payload.modelCode || "",
    productSku: payload.productSku || "",
    productName: payload.productName,
    category: payload.category || "Laptop/Máy tính",
    categoryTag: (payload.category || "CHỨNG NHẬN CHÍNH HÃNG").toUpperCase(),
    origin: payload.origin || "Chính hãng VN",
    customerCode: resolvedCustomerCode,
    customerName: payload.customerName || (!isStaff && currentUser?.fullname) || "Khách hàng Thành viên",
    customerPhone: payload.customerPhone || (!isStaff && currentUser?.phone) || "",
    customerEmail: resolvedEmail,
    customerAddress: payload.customerAddress || "",
    purchaseDate: parsedP,
    activatedAt: new Date(),
    endDate,
    periodMonths: months,
    packageName: payload.packageName || `Bảo hành Chính hãng ${months} Tháng`,
    packageDesc:
      payload.packageDesc ||
      "Hỗ trợ kiểm tra, thay thế linh kiện chính hãng theo tiêu chuẩn tại hệ thống trung tâm ủy quyền.",
    purchasePlace: payload.purchasePlace || "Cổng Kích Hoạt Trực Tuyến WarrantyOps",
    activationChannel: payload.activationChannel || "WEB",
    notes: payload.notes || "",
    image:
      payload.image ||
      categoryImages[payload.category] ||
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
    benefits: [
      {
        title: "Chứng nhận bảo hành điện tử toàn quốc",
        badge: "ĐÃ XÁC THỰC",
        badgeType: "emerald",
        desc: "Tra cứu trực tiếp bằng mã QR hoặc số Serial tại mọi trạm ủy quyền.",
      },
    ],
  });

  return decorateRecord(doc);
};

const renewRecord = async (idOrCode, { months = 12, note = "" } = {}) => {
  const doc = await findRawRecordByIdOrCode(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hồ sơ bảo hành cần gia hạn.");
  }
  if (doc.statusOverride === "rejected") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Chứng nhận đã bị thu hồi hiệu lực, không thể gia hạn. Vui lòng khôi phục trước."
    );
  }

  const addedMonths = Number(months) || 12;
  const baseDate = doc.endDate && new Date(doc.endDate) > new Date() ? new Date(doc.endDate) : new Date();
  const newEndDate = addMonthsSafe(baseDate, addedMonths);

  doc.renewalHistory.push({
    addedMonths,
    previousEndDate: doc.endDate,
    newEndDate,
    renewedAt: new Date(),
    note: note || `Gia hạn gói bảo vệ mở rộng thêm ${addedMonths} tháng`,
  });
  doc.endDate = newEndDate;
  doc.periodMonths = (doc.periodMonths || 12) + addedMonths;

  await doc.save();
  return decorateRecord(doc);
};

const updateRecord = async (idOrCode, updates = {}) => {
  const doc = await findRawRecordByIdOrCode(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hồ sơ bảo hành.");
  }
  const allowed = [
    "productName",
    "category",
    "imei",
    "modelCode",
    "customerCode",
    "customerName",
    "customerPhone",
    "customerEmail",
    "customerAddress",
    "packageName",
    "packageDesc",
    "statusOverride",
    "voidReason",
    "notes",
  ];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      doc[key] = updates[key];
    }
  }
  if (updates.category) {
    doc.categoryTag = String(updates.category).toUpperCase();
  }
  if (updates.statusOverride === "") {
    doc.voidReason = "";
  }
  if (updates.statusOverride === "rejected" && !doc.voidReason) {
    doc.voidReason = "Thu hồi hiệu lực theo biên bản kiểm định kỹ thuật.";
  }

  await doc.save();
  return decorateRecord(doc);
};

const deleteRecord = async (idOrCode) => {
  const doc = await findRawRecordByIdOrCode(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hồ sơ bảo hành.");
  }
  await WarrantyRecord.findByIdAndDelete(doc._id);
  return { deleted: true };
};

export const recordService = {
  listRecords,
  getRecordDetail,
  lookupDevice,
  batchCheckSerials,
  createRecord,
  renewRecord,
  updateRecord,
  deleteRecord,
};
