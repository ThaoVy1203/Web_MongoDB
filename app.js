const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { attachCurrentUser } = require('./middleware/auth');

// Nạp biến môi trường từ .env
dotenv.config();

const app = express();

// Kết nối cơ sở dữ liệu MongoDB
connectDB();

// Middleware phân tích JSON & Form
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Bỏ qua favicon.ico
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Tài nguyên tĩnh
app.use(express.static(path.join(__dirname, 'public')));

// Gắn thông tin phiên đăng nhập vào req.user & res.locals.currentUser
app.use(attachCurrentUser);

// Cấu hình Template Engine EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Đăng ký các phân hệ Routes
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const indexRouter = require('./routes/index');

app.use('/', authRouter);
app.use('/', adminRouter);
app.use('/', indexRouter);

// Xử lý Route 404
app.use((req, res) => {
  res.redirect('/');
});

// Xử lý lỗi toàn cục (500)
app.use((err, req, res, next) => {
  console.error('❌ Lỗi hệ thống:', err.stack);
  res.status(500).send('Đã có lỗi xảy ra trên máy chủ! Vui lòng thử lại sau.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🛡️  HỆ THỐNG QUẢN LÝ BẢO HÀNH SẢN PHẨM (MONGODB)`);
  console.log(`🚀 Máy chủ đang chạy tại: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

module.exports = app;
