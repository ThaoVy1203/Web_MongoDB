const mongoose = require('mongoose');

const benefitSubSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    badge: { type: String, default: 'ĐƯỢC BẢO HÀNH' },
    badgeType: { type: String, default: 'orange' },
    desc: { type: String, default: '' }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    subSku: { type: String, trim: true, default: 'Rev: 2024-A' },
    lotCode: { type: String, trim: true, default: 'LOT-2024-Q3' },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['laptop', 'phone', 'monitor', 'audio', 'component'],
      default: 'laptop'
    },
    categoryLabel: { type: String, default: 'Laptop/Máy tính' },
    specs: { type: String, trim: true, default: '' },
    imageUrl: { type: String, trim: true, default: '' },
    serialType: { type: String, enum: ['SN', 'IMEI'], default: 'SN' },
    serialSample: { type: String, trim: true, default: '' },
    warrantyMonths: { type: Number, default: 12 },
    warrantyPolicyName: { type: String, default: 'Bảo hành chính hãng tiêu chuẩn' },
    price: { type: Number, default: 0 },
    releaseDate: { type: Date, default: Date.now },
    businessStatus: {
      type: String,
      enum: ['selling', 'stop', 'coming'],
      default: 'selling'
    },
    soldCount: { type: Number, default: 100 },
    commonFaultPart: { type: String, default: 'Cáp tín hiệu / Nguồn' },
    commitText: { type: String, default: 'Thay thế linh kiện chính hãng trong 48–72h làm việc' },
    exclusionText: {
      type: String,
      default: 'Loại trừ: Rơi vỡ biến dạng, cấn móp vỏ hoặc ngấm chất lỏng ngoài phạm vi gói bảo vệ.'
    },
    benefits: { type: [benefitSubSchema], default: [] }
  },
  { timestamps: true, bufferCommands: false }
);

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
