const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Nạp các biến môi trường từ tệp .env
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();

// Kết nối cơ sở dữ liệu MongoDB
connectDB();

// Cấu hình Middleware phân tích cú pháp dữ liệu gửi lên từ form & JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Bỏ qua yêu cầu favicon.ico để tránh kích hoạt lỗi 404
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Cấu hình thư mục chứa tài nguyên tĩnh (CSS, JS, Hình ảnh)
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình Template Engine EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Sử dụng Routes chính
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

// Xử lý Route 404 - Không tìm thấy trang (Chuyển hướng về trang chủ)
app.use((req, res) => {
  res.redirect('/');
});

// Xử lý lỗi toàn cục hệ thống (500)
app.use((err, req, res, next) => {
  console.error('❌ Lỗi hệ thống:', err.stack);
  res.status(500).send('Đã có lỗi xảy ra trên máy chủ! Vui lòng thử lại sau.');
});

// Khởi chạy Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🛡️  HỆ THỐNG QUẢN LÝ BẢO HÀNH SẢN PHẨM (MONGODB)`);
  console.log(`🚀 Máy chủ đang chạy tại: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

module.exports = app;
