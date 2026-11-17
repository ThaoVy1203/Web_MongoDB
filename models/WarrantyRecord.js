const mongoose = require('mongoose');

const renewalSubSchema = new mongoose.Schema(
  {
    addedMonths: { type: Number, required: true },
    previousEndDate: { type: Date },
    newEndDate: { type: Date },
    renewedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' }
  },
  { _id: false }
);

const benefitSubSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    badge: { type: String, default: 'ĐƯỢC BẢO HÀNH' },
    badgeType: { type: String, default: 'orange' },
    desc: { type: String, default: '' }
  },
  { _id: false }
);

const warrantyRecordSchema = new mongoose.Schema(
  {
    wbCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    serialNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    imei: { type: String, trim: true, default: '' },
    modelCode: { type: String, trim: true, default: '' },
    productSku: { type: String, trim: true, default: '' },
    productName: { type: String, required: true, trim: true },
    category: { type: String, default: 'Laptop/Máy tính' },
    categoryTag: { type: String, default: 'THIẾT BỊ CHÍNH HÃNG' },
    origin: { type: String, default: 'Chính hãng' },
    customerCode: { type: String, trim: true, default: '' },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, trim: true, lowercase: true, default: '' },
    customerAddress: { type: String, trim: true, default: '' },
    purchaseDate: { type: Date, default: Date.now },
    activatedAt: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    periodMonths: { type: Number, default: 12 },
    packageName: { type: String, default: 'Bảo hành chính hãng WarrantyOps' },
    packageDesc: {
      type: String,
      default: 'Tiếp nhận và thay thế linh kiện chính hãng tại hệ thống trung tâm ủy quyền toàn quốc.'
    },
    purchasePlace: { type: String, default: 'Đại lý ủy quyền chính thức' },
    activationChannel: { type: String, enum: ['QR', 'API', 'WEB', 'ADMIN'], default: 'WEB' },
    statusOverride: { type: String, enum: ['', 'rejected'], default: '' },
    voidReason: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80'
    },
    commitText: { type: String, default: 'Thay thế linh kiện chính hãng trong 48–72h làm việc' },
    exclusionText: {
      type: String,
      default: 'Loại trừ: Rơi vỡ biến dạng, cấn móp vỏ hoặc ngấm chất lỏng.'
    },
    benefits: { type: [benefitSubSchema], default: [] },
    renewalHistory: { type: [renewalSubSchema], default: [] }
  },
  { timestamps: true, bufferCommands: false }
);

module.exports = mongoose.models.WarrantyRecord || mongoose.model('WarrantyRecord', warrantyRecordSchema);
