const mongoose = require('mongoose');

/**
 * Kết nối đến cơ sở dữ liệu MongoDB
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/warranty_management';
  
  try {
    // Cấu hình thời gian chờ kết nối tối đa 2.5 giây để tránh ứng dụng bị đơ (hang) khi chưa bật DB
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2500
    });
    
    console.log(`✅ [MongoDB] Đã kết nối thành công tới Database: ${conn.connection.name}`);
    console.log(`📡 [MongoDB] Host: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️  [MongoDB] Chưa thể kết nối tới cơ sở dữ liệu (${error.message})`);
    console.warn(`💡 [Hướng dẫn khắc phục]:`);
    console.warn(`   1. Nếu dùng MongoDB trên máy: Hãy khởi động dịch vụ MongoDB hoặc mở MongoDB Compass.`);
    console.warn(`   2. Nếu dùng MongoDB Atlas (Cloud): Hãy cập nhật chuỗi MONGODB_URI trong file .env.`);
    console.warn(`   👉 Máy chủ vẫn đang chạy bình thường ở chế độ Dữ liệu mẫu (Mock data) để bạn xem và thao tác giao diện!`);
    // KHÔNG dùng process.exit(1) để web server không bị sập
  }
};

module.exports = connectDB;
