import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/apiError.js";
import { decorateTicket } from "../utils/formatters.js";
import { WarrantyTicket } from "../models/warrantyTicketModel.js";
import { WarrantyRecord } from "../models/warrantyRecordModel.js";
import { SERVICE_BRANCHES, TECHNICIANS, analyzeAddressForBranch } from "./aiBranchService.js";
import { buildTimelineForStatus } from "./seedService.js";

const findRawTicket = async (idOrCode) => {
  const q = String(idOrCode || "").trim();
  if (!q) return null;
  if (mongoose.Types.ObjectId.isValid(q)) {
    const byId = await WarrantyTicket.findById(q);
    if (byId) return byId;
  }
  return WarrantyTicket.findOne({
    $or: [{ warrantyCode: q.toUpperCase() }, { productSerial: q.toUpperCase() }],
  });
};

const inferFaultCategory = (text = "", categories = []) => {
  const combined = `${text} ${(categories || []).join(" ")}`.toLowerCase();
  if (/màn hình|oled|hiển thị|sọc|điểm chết|panel|cáp/.test(combined)) return "screen";
  if (/nguồn|sạc|pin|nóng|nhiệt|magsafe|type-c|usb-c/.test(combined)) return "power_battery";
  if (/main|bo mạch|camera|wifi|hub|rj45|cpu|gpu/.test(combined)) return "mainboard";
  return "other";
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
  const linkedRecord = await WarrantyRecord.findOne({ serialNumber: serialUpper });

  const rand = Math.floor(1000 + Math.random() * 8999);
  const warrantyCode =
    (payload.warrantyCode && payload.warrantyCode.trim().toUpperCase()) || `TKT-2026-${rand}`;

  const aiMatch = analyzeAddressForBranch(
    payload.customerAddress || linkedRecord?.customerAddress || "",
    payload.category || linkedRecord?.category || "Laptop/Máy tính",
    payload.issueDescription
  );

  const chosenBranch = aiMatch.matched ? aiMatch.primary : SERVICE_BRANCHES[0];
  const chosenTech =
    (aiMatch.matched && aiMatch.primary.recommendedTech) || TECHNICIANS[0];

  const slaHours = payload.priority === "urgent_24h" ? 24 : 48;
  const now = new Date();
  const slaDeadline = new Date(now.getTime() + slaHours * 3600 * 1000);
  const pDate = payload.purchaseDate
    ? new Date(payload.purchaseDate)
    : linkedRecord?.purchaseDate || now;
  const periodMonths = Number(payload.warrantyPeriodMonths || linkedRecord?.periodMonths || 12);
  const expiryDate =
    linkedRecord?.endDate || new Date(new Date(pDate).getTime() + periodMonths * 30 * 86400000);

  const doc = await WarrantyTicket.create({
    warrantyCode,
    customerCode: payload.customerCode || currentUser?.customerCode || linkedRecord?.customerCode || "",
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    customerEmail: payload.customerEmail || currentUser?.email || linkedRecord?.customerEmail || "",
    customerAddress: payload.customerAddress || linkedRecord?.customerAddress || "",
    productSku: payload.productSku || linkedRecord?.productSku || "",
    productName: payload.productName,
    productSerial: serialUpper,
    category: payload.category || linkedRecord?.category || "Laptop/Máy tính",
    servicePackage: linkedRecord?.packageName || "Bảo hành tiêu chuẩn chính hãng",
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
    priority: payload.priority || "standard_48h",
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
        text: `Đã khởi tạo hồ sơ RMA #${warrantyCode} và tự động định tuyến về ${chosenBranch.name} (Phụ trách: ${chosenTech.name}).`,
        channels: ["Web Portal"],
        createdAt: now,
      },
    ],
    receivedDate: now,
    estimatedReturnDate: slaDeadline,
  });

  return decorateTicket(doc);
};

const updateTicketStatus = async (idOrCode, { status, technicianNotes, repairCost, customerAddress }) => {
  const doc = await findRawTicket(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiếu bảo hành.");
  }

  if (status) {
    doc.status = status;
    doc.timelineSteps = buildTimelineForStatus(status, doc.receivedDate || doc.createdAt);
    if (["Đã sửa xong", "Đã trả khách"].includes(status) && !doc.completedDate) {
      doc.completedDate = new Date();
    }
  }
  if (typeof technicianNotes === "string" && technicianNotes.trim()) {
    doc.technicianNotes = technicianNotes.trim();
  }
  if (repairCost !== undefined && repairCost !== "") {
    doc.repairCost = Number(repairCost) || 0;
  }
  if (typeof customerAddress === "string") {
    doc.customerAddress = customerAddress.trim();
  }

  await doc.save();
  return decorateTicket(doc);
};

const assignTicket = async (idOrCode, { techCode, branchCode, slaDeadline, internalTechNotes }) => {
  const doc = await findRawTicket(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiếu bảo hành.");
  }

  if (techCode) {
    const tech = TECHNICIANS.find((t) => t.code === techCode) || TECHNICIANS[0];
    doc.assignedTechnician = {
      code: tech.code,
      name: tech.name,
      level: tech.level,
      branch: tech.branch,
    };
  }
  if (branchCode) {
    const branch = SERVICE_BRANCHES.find((b) => b.code === branchCode) || SERVICE_BRANCHES[0];
    doc.assignedBranch = {
      code: branch.code,
      name: branch.name,
      address: branch.address,
    };
  }
  if (slaDeadline) doc.slaDeadline = new Date(slaDeadline);
  if (typeof internalTechNotes === "string") doc.internalTechNotes = internalTechNotes.trim();

  await doc.save();
  return decorateTicket(doc);
};

const addTicketPart = async (idOrCode, { partCode, partName, unitPrice = 0, customerPrice = 0 }) => {
  const doc = await findRawTicket(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiếu bảo hành.");
  }
  if (!partName || !partName.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Vui lòng nhập tên linh kiện xuất kho.");
  }

  const cPrice = Number(customerPrice) || 0;
  doc.replacementParts.push({
    partCode: (partCode || `LK-${Math.floor(100 + Math.random() * 899)}`).toUpperCase(),
    partName: partName.trim(),
    spec: "OEM Genuine Module",
    quantity: 1,
    warehouseLocation: "Kho Trung Tâm",
    coveragePolicy: cPrice > 0 ? "Tính phí dịch vụ ngoài BH" : "Miễn phí 100% (Trong hạn BH)",
    issued: true,
    unitPrice: Number(unitPrice) || 0,
    customerPrice: cPrice,
  });

  if (cPrice > 0) {
    doc.repairCost = (doc.repairCost || 0) + cPrice;
  }

  await doc.save();
  return decorateTicket(doc);
};

const rejectTicket = async (idOrCode, { reason }) => {
  const doc = await findRawTicket(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiếu bảo hành.");
  }
  const finalReason = (reason || "Thiết bị vi phạm điều kiện bảo hành chính hãng").trim();
  doc.status = "Từ chối bảo hành";
  doc.rejectionReason = finalReason;
  doc.technicianNotes = `Biên bản từ chối bảo hành: ${finalReason}`;
  doc.timelineSteps = buildTimelineForStatus("Từ chối bảo hành", doc.receivedDate || doc.createdAt);

  doc.messages.push({
    senderRole: "system",
    senderName: "Hệ thống Giám định",
    text: `Thông báo: Phiếu #${doc.warrantyCode} bị từ chối bảo hành miễn phí. Lý do: ${finalReason}.`,
    channels: ["Web Portal"],
  });

  await doc.save();
  return decorateTicket(doc);
};

const confirmReceipt = async (idOrCode) => {
  const doc = await findRawTicket(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiếu bảo hành.");
  }
  doc.status = "Đã trả khách";
  doc.customerConfirmedAt = new Date();
  doc.completedDate = doc.completedDate || new Date();
  doc.timelineSteps = buildTimelineForStatus("Đã trả khách", doc.receivedDate || doc.createdAt);
  doc.messages.push({
    senderRole: "system",
    senderName: "Biên bản Nghiệm thu Điện tử",
    text: `Khách hàng ${doc.customerName} đã xác nhận nhận lại thiết bị hoạt động tốt và đóng hồ sơ RMA.`,
    channels: ["Web Portal"],
  });

  await doc.save();
  return decorateTicket(doc);
};

const addMessage = async (idOrCode, { text, senderName, senderRole, channels }, currentUser = null) => {
  const doc = await findRawTicket(idOrCode);
  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiếu bảo hành.");
  }
  if (!text || !text.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Nội dung tin nhắn không được để trống.");
  }

  const role =
    senderRole || (currentUser?.role === "admin" ? "technician" : "customer");
  const name =
    senderName ||
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
