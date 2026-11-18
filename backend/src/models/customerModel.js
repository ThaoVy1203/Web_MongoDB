import mongoose from "mongoose";

const noteSubSchema = new mongoose.Schema(
  {
    authorName: { type: String, default: "Admin CSKH" },
    authorRole: { type: String, default: "Chuyên viên CSKH" },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const auditSubSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    description: { type: String, default: "" },
    actor: { type: String, default: "Hệ thống" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const customerSchema = new mongoose.Schema(
  {
    customerCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    customerType: { type: String, enum: ["canhan", "vip", "daily"], default: "canhan" },
    rank: { type: String, default: "Standard" },
    idNumber: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "Hà Nội" },
    address: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["active", "locked"], default: "active" },
    assignedSpecialist: {
      name: { type: String, default: "Nguyễn Hoàng Long" },
      ext: { type: String, default: "104" },
      phone: { type: String, default: "0909.104.888" },
    },
    notes: { type: [noteSubSchema], default: [] },
    auditLogs: { type: [auditSubSchema], default: [] },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

export const Customer = mongoose.models.Customer || mongoose.model("Customer", customerSchema);
