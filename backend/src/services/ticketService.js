import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/apiError.js";
import { addMonthsSafe, decorateTicket } from "../utils/formatters.js";
import { WarrantyTicket } from "../models/warrantyTicketModel.js";
import { WarrantyRecord } from "../models/warrantyRecordModel.js";
import { SERVICE_BRANCHES, TECHNICIANS, analyzeAddressForBranch } from "./aiBranchService.js";
import { buildTimelineForStatus } from "./seedService.js";

const ALLOWED_CATEGORIES = [
  "Điện thoại",
  "Laptop/Máy tính",
  "Màn hình",
  "Thiết bị âm thanh",
  "Linh kiện",
  "Thiết bị gia dụng",
  "Phụ kiện",
  "Khác",
];

const TERMINAL_STATUSES = ["Đã trả khách", "Từ chối bảo hành"];

const findRawTicket = async (idOrCode) => {
  const q = String(idOrCode || "").trim();
  if (!q) return null;
  if (mongoose.Types.ObjectId.isValid(q)) {
    const byId = await WarrantyTicket.findById(q);
    if (byId) return byId;
  }
  return WarrantyTicket.findOne({
    $or: [{ warrantyCode: q.toUpperCase() }, { productSerial: q.toUpperCase() }],
  }).sort({ createdAt: -1 });
};

const inferFaultCategory = (text = "", categories = []) => {
  const combined = `${text} ${(categories || []).join(" ")}`.toLowerCase();
  if (/màn hình|oled|hiển thị|sọc|điểm chết|panel|cáp/.test(combined)) return "screen";
  if (/nguồn|sạc|pin|nóng|nhiệt|magsafe|type-c|usb-c/.test(combined)) return "power_battery";
  if (/main|bo mạch|camera|wifi|hub|rj45|cpu|gpu/.test(combined)) return "mainboard";
  return "other";
};

const generateUniqueWarrantyCode = async (preferred = "") => {
  const clean = String(preferred || "").trim().toUpperCase();
  if (clean) return clean;
  const year = new Date().getFullYear();
  for (let i = 0; i < 6; i += 1) {
    const code = `TKT-${year}-${Math.floor(1000 + Math.random() * 8999)}`;
    const exists = await WarrantyTicket.exists({ warrantyCode: code });
    if (!exists) return code;
  }
  return `TKT-${year}-${Date.now().toString().slice(-5)}`;
};

const mergeTimelineTimestamps = (prevSteps = [], nextStatus, receivedDate) => {
  const rebuilt = buildTimelineForStatus(nextStatus, receivedDate || new Date());
  const prevByStep = new Map((prevSteps || []).map((s) => [s.step, s]));
  const now = new Date();
  return rebuilt.map((stepObj) => {
    const prev = prevByStep.get(stepObj.step);
    if (prev && prev.state === "completed" && stepObj.state === "completed") {
      return { ...stepObj, timestamp: prev.timestamp || stepObj.timestamp };
    }
    if (stepObj.state === "active" || (prev && prev.state !== "completed" && stepObj.state === "completed")) {
      return { ...stepObj, timestamp: now };
    }
    return stepObj;
  });
};

const listTickets = async ({ queue = "all", status = "", q = "" } = {}) => {
  const docs = await WarrantyTicket.find({}).sort({ receivedDate: -1, createdAt: -1 });
  const all = docs.map(decorateTicket);

  const queueCounts = {
    all: all.length,
    waiting: all.filter((t) => t.status === "Tiếp nhận").length,
    processing: all.filter((t) => ["Đang kiểm tra", "Đang sửa chữa"].includes(t.status)).length,
    parts: all.filter((t) => t.status === "Chờ linh kiện").length,
    approval: all.filter((t) => t.status === "Chờ duyệt").length,
    done: all.filter((t) => ["Đã sửa xong", "Đã trả khách", "Từ chối bảo hành"].includes(t.status)).length,
  };

  let filtered = [...all];
  if (status && status.trim()) {
    filtered = filtered.filter((t) => t.status === status.trim());
  } else if (queue === "waiting") {
    filtered = filtered.filter((t) => t.status === "Tiếp nhận");
  } else if (queue === "processing") {
    filtered = filtered.filter((t) => ["Đang kiểm tra", "Đang sửa chữa"].includes(t.status));
  } else if (queue === "parts") {
    filtered = filtered.filter((t) => t.status === "Chờ linh kiện");
  } else if (queue === "approval") {
    filtered = filtered.filter((t) => t.status === "Chờ duyệt");
  } else if (queue === "done") {
    filtered = filtered.filter((t) =>
      ["Đã sửa xong", "Đã trả khách", "Từ chối bảo hành"].includes(t.status)
    );
  }

  if (q && q.trim()) {
    const s = q.trim().toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.warrantyCode.toLowerCase().includes(s) ||
        t.productName.toLowerCase().includes(s) ||
        t.productSerial.toLowerCase().includes(s) ||
        t.customerName.toLowerCase().includes(s) ||
        (t.customerPhone || "").toLowerCase().includes(s) ||
        (t.customerAddress || "").toLowerCase().includes(s)
    );
  }

  return {
    tickets: filtered,
    queueCounts,
    branches: SERVICE_BRANCHES,
    technicians: TECHNICIANS,
  };
};

const getTicketDetail = async (idOrCode) => {
  const doc = await findRawTicket(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiếu yêu cầu bảo hành.");
  }
  const ticket = decorateTicket(doc);
  const aiSuggestion = analyzeAddressForBranch(
    ticket.customerAddress,
    ticket.category,
    ticket.issueDescription
  );
  return {
    ...ticket,
    aiSuggestion,
  };
};

const createTicket = async (payload, currentUser = null) => {
  const serialUpper = payload.productSerial.trim().toUpperCase();
  const linkedRecord = await WarrantyRecord.findOne({
    $or: [{ serialNumber: serialUpper }, { wbCode: serialUpper }, { imei: payload.productSerial.trim() }],
  });

  const warrantyCode = await generateUniqueWarrantyCode(payload.warrantyCode);
  const rawCategory = payload.category || linkedRecord?.category || "Laptop/Máy tính";
  const safeCategory = ALLOWED_CATEGORIES.includes(rawCategory) ? rawCategory : "Khác";

  const aiMatch = analyzeAddressForBranch(
    payload.customerAddress || linkedRecord?.customerAddress || "",
    safeCategory,
    payload.issueDescription
  );

  // Cho phép người dùng chọn chi nhánh ưu tiên (VD: chọn trạm dự phòng hoặc từ AI card)
  const manualBranch = payload.preferredBranchCode
    ? SERVICE_BRANCHES.find((b) => b.code === payload.preferredBranchCode)
    : null;
  const chosenBranch = manualBranch || (aiMatch.matched ? aiMatch.primary : SERVICE_BRANCHES[0]);
  const chosenTech =
    TECHNICIANS.find((t) => t.branchCode === chosenBranch.code) ||
    (aiMatch.matched && aiMatch.primary.recommendedTech) ||
    TECHNICIANS[0];

  const now = new Date();
  const isOutOfWarranty =
    linkedRecord &&
    (linkedRecord.statusOverride === "rejected" ||
      (linkedRecord.endDate && new Date(linkedRecord.endDate).getTime() < now.getTime()));

  const finalPriority = isOutOfWarranty ? "out_of_warranty" : payload.priority || "standard_48h";
  const slaHours = finalPriority === "urgent_24h" ? 24 : finalPriority === "out_of_warranty" ? 72 : 48;
  const slaDeadline = new Date(now.getTime() + slaHours * 3600 * 1000);

  const parsedP = payload.purchaseDate
    ? new Date(payload.purchaseDate)
    : linkedRecord?.purchaseDate || now;
  const pDate = Number.isNaN(parsedP.getTime()) ? now : parsedP;
  const periodMonths = Number(payload.warrantyPeriodMonths || linkedRecord?.periodMonths || 12);
  const expiryDate = linkedRecord?.endDate || addMonthsSafe(pDate, periodMonths);

  const isStaff = currentUser && ["admin", "technician"].includes(currentUser.role);
  const resolvedCustomerCode =
    payload.customerCode ||
    linkedRecord?.customerCode ||
    (!isStaff ? currentUser?.customerCode : "") ||
    "";
  const resolvedCustomerEmail =
    payload.customerEmail ||
    linkedRecord?.customerEmail ||
    (!isStaff ? currentUser?.email : "") ||
    "";

  const outOfWarrantyNote = isOutOfWarranty
    ? " Lưu ý: Thiết bị đã hết hạn hoặc bị thu hồi bảo hành — tiếp nhận theo diện dịch vụ ngoài bảo hành."
    : "";

  const doc = await WarrantyTicket.create({
    warrantyCode,
    customerCode: resolvedCustomerCode,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    customerEmail: resolvedCustomerEmail,
    customerAddress: payload.customerAddress || linkedRecord?.customerAddress || "",
    productSku: payload.productSku || linkedRecord?.productSku || "",
    productName: payload.productName,
    productSerial: linkedRecord?.serialNumber || serialUpper,
    category: safeCategory,
    servicePackage: isOutOfWarranty
      ? "Sửa chữa dịch vụ ngoài bảo hành"
      : linkedRecord?.packageName || "Bảo hành tiêu chuẩn chính hãng",
    purchaseDate: pDate,
    warrantyPeriodMonths: periodMonths,
    warrantyExpiryDate: expiryDate,
    issueCategories: payload.issueCategories || [],
    issueDescription: payload.issueDescription,
    faultCategory:
      payload.faultCategory || inferFaultCategory(payload.issueDescription, payload.issueCategories),
    attachments: payload.attachments || [],
    pickupMode: payload.pickupMode || "center",
    preferredTime: payload.preferredTime || "Trong giờ hành chính (08:30 - 17:30)",
    customerDeliveryNotes: payload.customerDeliveryNotes || "",
    borrowLaptop: Boolean(payload.borrowLaptop),
    priority: finalPriority,
    slaHours,
    slaDeadline,
    status: "Tiếp nhận",
    assignedBranch: {
      code: chosenBranch.code,
      name: chosenBranch.name,
      address: chosenBranch.address,
    },
    assignedTechnician: {
      code: chosenTech.code,
      name: chosenTech.name,
      level: chosenTech.level,
      branch: chosenTech.branch,
    },
    timelineSteps: buildTimelineForStatus("Tiếp nhận", now),
    messages: [
      {
        senderRole: "system",
        senderName: "Trợ lý Điều phối WarrantyOps",
        text: `Đã khởi tạo hồ sơ RMA #${warrantyCode} và định tuyến về ${chosenBranch.name} (Phụ trách: ${chosenTech.name}).${outOfWarrantyNote}`,
        channels: ["Web Portal"],
        createdAt: now,
      },
    ],
    receivedDate: now,
    estimatedReturnDate: slaDeadline,
  });

  return decorateTicket(doc);
};

const updateTicketStatus = async (idOrCode, body = {}) => {
  const { status, technicianNotes, repairCost, customerAddress } = body || {};
  const doc = await findRawTicket(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiếu bảo hành.");
  }

  if (repairCost !== undefined && repairCost !== "") {
    const parsedCost = Number(repairCost);
    if (Number.isNaN(parsedCost) || parsedCost < 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Chi phí sửa chữa không được âm.");
    }
    doc.repairCost = parsedCost;
  }

  if (status) {
    doc.status = status;
    doc.timelineSteps = mergeTimelineTimestamps(
      doc.timelineSteps,
      status,
      doc.receivedDate || doc.createdAt
    );
    if (["Đã sửa xong", "Đã trả khách"].includes(status) && !doc.completedDate) {
      doc.completedDate = new Date();
    }
  }
  if (typeof technicianNotes === "string" && technicianNotes.trim()) {
    doc.technicianNotes = technicianNotes.trim();
  }
  if (typeof customerAddress === "string") {
    doc.customerAddress = customerAddress.trim();
  }

  await doc.save();
  return decorateTicket(doc);
};

const assignTicket = async (idOrCode, body = {}) => {
  const { techCode, branchCode, slaDeadline, internalTechNotes } = body || {};
  const doc = await findRawTicket(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiếu bảo hành.");
  }

  if (techCode) {
    const tech = TECHNICIANS.find((t) => t.code === techCode);
    if (!tech) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Mã kỹ thuật viên không hợp lệ: ${techCode}`);
    }
    doc.assignedTechnician = {
      code: tech.code,
      name: tech.name,
      level: tech.level,
      branch: tech.branch,
    };
  }
  if (branchCode) {
    const branch = SERVICE_BRANCHES.find((b) => b.code === branchCode);
    if (!branch) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Mã chi nhánh không hợp lệ: ${branchCode}`);
    }
    doc.assignedBranch = {
      code: branch.code,
      name: branch.name,
      address: branch.address,
    };
  }
  if (slaDeadline) {
    const d = new Date(slaDeadline);
    if (Number.isNaN(d.getTime())) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Mốc thời gian SLA không hợp lệ.");
    }
    doc.slaDeadline = d;
  }
  if (typeof internalTechNotes === "string") {
    doc.internalTechNotes = internalTechNotes.trim();
  }

  await doc.save();
  return decorateTicket(doc);
};

const addTicketPart = async (idOrCode, body = {}) => {
  const { partCode, partName, unitPrice = 0, customerPrice = 0, quantity = 1 } = body || {};
  const doc = await findRawTicket(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiếu bảo hành.");
  }
  if (TERMINAL_STATUSES.includes(doc.status)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Không thể xuất thêm linh kiện cho phiếu đã đóng.");
  }
  if (!partName || !partName.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Vui lòng nhập tên linh kiện xuất kho.");
  }

  const uPrice = Number(unitPrice) || 0;
  const cPrice = Number(customerPrice) || 0;
  const qty = Math.max(1, Number(quantity) || 1);
  if (uPrice < 0 || cPrice < 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Đơn giá linh kiện không được âm.");
  }

  doc.replacementParts.push({
    partCode: (partCode || `LK-${Math.floor(100 + Math.random() * 899)}`).toUpperCase(),
    partName: partName.trim(),
    spec: "OEM Genuine Module",
    quantity: qty,
    warehouseLocation: doc.assignedBranch?.name || "Kho Trung Tâm",
    coveragePolicy: cPrice > 0 ? "Tính phí dịch vụ ngoài BH" : "Miễn phí 100% (Trong hạn BH)",
    issued: true,
    unitPrice: uPrice,
    customerPrice: cPrice,
  });

  if (cPrice > 0) {
    doc.repairCost = (doc.repairCost || 0) + cPrice * qty;
  }

  await doc.save();
  return decorateTicket(doc);
};

const rejectTicket = async (idOrCode, body = {}) => {
  const { reason } = body || {};
  const doc = await findRawTicket(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiếu bảo hành.");
  }
  if (doc.status === "Đã trả khách") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Phiếu đã bàn giao hoàn tất, không thể chuyển sang từ chối.");
  }

  const finalReason = (reason || "Thiết bị vi phạm điều kiện bảo hành chính hãng").trim();
  doc.status = "Từ chối bảo hành";
  doc.rejectionReason = finalReason;
  doc.technicianNotes = doc.technicianNotes
    ? `${doc.technicianNotes}\n[Từ chối bảo hành]: ${finalReason}`
    : `Biên bản từ chối bảo hành: ${finalReason}`;
  doc.timelineSteps = mergeTimelineTimestamps(
    doc.timelineSteps,
    "Từ chối bảo hành",
    doc.receivedDate || doc.createdAt
  );

  doc.messages.push({
    senderRole: "system",
    senderName: "Hệ thống Giám định",
    text: `Thông báo: Phiếu #${doc.warrantyCode} bị từ chối bảo hành miễn phí. Lý do: ${finalReason}.`,
    channels: ["Web Portal"],
  });

  await doc.save();
  return decorateTicket(doc);
};

const confirmReceipt = async (idOrCode, body = {}) => {
  const { csatScore, feedback = "" } = body || {};
  const doc = await findRawTicket(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiếu bảo hành.");
  }
  if (doc.status === "Từ chối bảo hành") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Không thể nghiệm thu phiếu đã bị từ chối bảo hành.");
  }
  if (doc.status === "Tiếp nhận") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Phiếu mới ở bước tiếp nhận, chưa thể xác nhận nghiệm thu nhận máy."
    );
  }
  if (doc.status === "Đã trả khách") {
    return decorateTicket(doc);
  }

  if (csatScore !== undefined && csatScore !== null) {
    const score = Math.min(5, Math.max(1, Math.round(Number(csatScore) || 5)));
    doc.csatScore = score;
  }

  doc.status = "Đã trả khách";
  doc.customerConfirmedAt = new Date();
  doc.completedDate = doc.completedDate || new Date();
  doc.timelineSteps = mergeTimelineTimestamps(
    doc.timelineSteps,
    "Đã trả khách",
    doc.receivedDate || doc.createdAt
  );
  const feedbackNote = feedback && feedback.trim() ? ` Nhận xét: "${feedback.trim()}".` : "";
  const ratingNote = doc.csatScore ? ` (Đánh giá: ${doc.csatScore}/5★)` : "";
  doc.messages.push({
    senderRole: "system",
    senderName: "Biên bản Nghiệm thu Điện tử",
    text: `Khách hàng ${doc.customerName} đã xác nhận nhận lại thiết bị hoạt động tốt và đóng hồ sơ RMA.${ratingNote}${feedbackNote}`,
    channels: ["Web Portal"],
  });

  await doc.save();
  return decorateTicket(doc);
};

const addMessage = async (idOrCode, body = {}, currentUser = null) => {
  const { text, senderName, senderRole, channels } = body || {};
  const doc = await findRawTicket(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiếu bảo hành.");
  }
  if (!text || !text.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Nội dung tin nhắn không được để trống.");
  }

  let role = "customer";
  if (currentUser && ["admin", "technician"].includes(currentUser.role)) {
    role = "technician";
  } else if (!currentUser && senderRole === "technician") {
    role = "technician";
  }

  const name =
    (role === "technician" && senderName) ||
    currentUser?.fullname ||
    (role === "technician" ? doc.assignedTechnician?.name || "Kỹ thuật viên" : doc.customerName);

  doc.messages.push({
    senderRole: role,
    senderName: name,
    text: text.trim(),
    channels: Array.isArray(channels) && channels.length ? channels : ["Web Portal"],
    createdAt: new Date(),
  });

  await doc.save();
  return decorateTicket(doc);
};

const deleteTicket = async (idOrCode) => {
  const doc = await findRawTicket(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiếu bảo hành.");
  }
  await WarrantyTicket.findByIdAndDelete(doc._id);
  return { deleted: true };
};

export const ticketService = {
  listTickets,
  getTicketDetail,
  createTicket,
  updateTicketStatus,
  assignTicket,
  addTicketPart,
  rejectTicket,
  confirmReceipt,
  addMessage,
  deleteTicket,
};
