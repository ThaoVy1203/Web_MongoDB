import mongoose from "mongoose";

const partSubSchema = new mongoose.Schema(
  {
    partCode: { type: String, required: true },
    partName: { type: String, required: true },
    spec: { type: String, default: "Linh kiện OEM chính hãng" },
    quantity: { type: Number, default: 1 },
    warehouseLocation: { type: String, default: "Kho Trung tâm" },
    coveragePolicy: { type: String, default: "Miễn phí 100% (Trong hạn BH)" },
    issued: { type: Boolean, default: true },
    unitPrice: { type: Number, default: 0 },
    customerPrice: { type: Number, default: 0 },
  },
  { _id: false }
);

const timelineSubSchema = new mongoose.Schema(
  {
    step: { type: Number, default: 1 },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    actor: { type: String, default: "Hệ thống WarrantyOps" },
    state: { type: String, enum: ["completed", "active", "pending"], default: "completed" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const messageSubSchema = new mongoose.Schema(
  {
    senderRole: {
      type: String,
      enum: ["customer", "technician", "admin", "system"],
      default: "customer",
    },
    senderName: { type: String, required: true },
    text: { type: String, required: true },
    channels: { type: [String], default: ["Web Portal"] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const attachmentSubSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    fileType: { type: String, default: "document" },
    sizeLabel: { type: String, default: "1.2 MB" },
    url: { type: String, default: "" },
  },
  { _id: false }
);

const warrantyTicketSchema = new mongoose.Schema(
  {
    warrantyCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    customerCode: { type: String, trim: true, default: "" },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, trim: true, default: "" },
    customerAddress: { type: String, trim: true, default: "" },
    productSku: { type: String, trim: true, default: "" },
    productName: { type: String, required: true, trim: true },
    productSerial: { type: String, required: true, trim: true, uppercase: true },
    category: {
      type: String,
      enum: ["Điện thoại", "Laptop/Máy tính", "Màn hình", "Thiết bị âm thanh", "Linh kiện", "Thiết bị gia dụng", "Phụ kiện", "Khác"],
      default: "Laptop/Máy tính",
    },
    servicePackage: { type: String, default: "Bảo hành tiêu chuẩn chính hãng" },
    purchaseDate: { type: Date, default: Date.now },
    warrantyPeriodMonths: { type: Number, default: 12 },
    warrantyExpiryDate: { type: Date },
    issueCategories: { type: [String], default: [] },
    issueDescription: { type: String, required: true, trim: true },
    faultCategory: {
      type: String,
      enum: ["screen", "power_battery", "mainboard", "other"],
      default: "other",
    },
    rootCauseType: {
      type: String,
      enum: ["oem_defect", "user_damage", "environment"],
      default: "oem_defect",
    },
    attachments: { type: [attachmentSubSchema], default: [] },
    pickupMode: { type: String, enum: ["center", "onsite"], default: "center" },
    preferredTime: { type: String, default: "Trong giờ hành chính (08:30 - 17:30)" },
    customerDeliveryNotes: { type: String, default: "" },
    borrowLaptop: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ["urgent_24h", "standard_48h", "out_of_warranty"],
      default: "standard_48h",
    },
    slaHours: { type: Number, default: 48 },
    slaDeadline: { type: Date },
    status: {
      type: String,
      enum: [
        "Tiếp nhận",
        "Đang kiểm tra",
        "Chờ linh kiện",
        "Chờ duyệt",
        "Đang sửa chữa",
        "Đã sửa xong",
        "Đã trả khách",
        "Từ chối bảo hành",
      ],
      default: "Tiếp nhận",
    },
    rejectionReason: { type: String, default: "" },
    assignedBranch: {
      code: { type: String, default: "HN-CG" },
      name: { type: String, default: "Trạm Hà Nội — Cầu Giấy" },
      address: { type: String, default: "Tầng 2, Tòa Technosoft, Phố Duy Tân, Cầu Giấy, Hà Nội" },
    },
    assignedTechnician: {
      code: { type: String, default: "KTV-01" },
      name: { type: String, default: "Lê Minh Trí" },
      level: { type: String, default: "Bậc 5/5" },
      branch: { type: String, default: "TTBH Hà Nội" },
    },
    errorCode: { type: String, default: "DIAG_PENDING" },
    repairLevel: { type: String, default: "Level 2 — Module Replacement" },
    repairCost: { type: Number, default: 0 },
    technicianNotes: {
      type: String,
      trim: true,
      default: "Mới tiếp nhận hồ sơ & thiết bị, đang chờ kỹ thuật viên chẩn đoán.",
    },
    internalTechNotes: { type: String, trim: true, default: "" },
    replacementParts: { type: [partSubSchema], default: [] },
    timelineSteps: { type: [timelineSubSchema], default: [] },
    messages: { type: [messageSubSchema], default: [] },
    csatScore: { type: Number, default: 5 },
    receivedDate: { type: Date, default: Date.now },
    estimatedReturnDate: { type: Date },
    completedDate: { type: Date },
    customerConfirmedAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

export const WarrantyTicket =
  mongoose.models.WarrantyTicket || mongoose.model("WarrantyTicket", warrantyTicketSchema);
