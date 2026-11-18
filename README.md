# WarrantyOps — Digital Warranty Vault & Smart RMA Operations Platform

Hệ thống quản lý chứng từ/giấy bảo hành điện tử, cảnh báo bảo hành sắp hết hạn, phân tích AI gợi ý trạm tiếp nhận gần địa chỉ trên phiếu và điều phối xử lý bảo hành (RMA) với kiến trúc Monorepo **React + Tailwind CSS** và **Express v5 + MongoDB**.

## Kiến trúc Monorepo

```text
Web_MongoDB/
├── backend/                  # Express v5 + Mongoose RESTful API (/v1)
│   ├── src/
│   │   ├── config/           # env.js, jwt.js, mongodb.js
│   │   ├── controllers/      # auth, record, ticket, customer, product, analytics
│   │   ├── middlewares/      # JWT authMiddleware, errorHandlingMiddleware
│   │   ├── models/           # User, Customer, Product, WarrantyRecord, WarrantyTicket
│   │   ├── routes/v1/        # REST endpoints (/v1/auth, /records, /tickets, /customers, /products, /analytics, /ai)
│   │   ├── services/         # Business logic, aiBranchService, analyticsService, seedService
│   │   ├── validations/      # Joi request validators
│   │   └── server.js
│   └── .env.example
└── frontend/                 # React 19 + Vite 6 + Tailwind CSS v4 + Framer Motion
    ├── src/
    │   ├── api/              # Axios client & API modules
    │   ├── components/       # PortalLayout, AdminLayout, Modal, CertificateStudioModal (QR)
    │   ├── context/          # AuthContext, ToastContext
    │   ├── pages/portal/     # Home, Lookup, MyDevices, SubmitRequest, TrackTicket, Auth
    │   └── pages/admin/      # Dashboard, Records, Tickets, Customers, CustomerDetail, Products, Analytics
    └── .env.example
```

## Tính năng chính

### Cổng Khách hàng (Portal)
- **Không gian Hồ sơ (`/`)**: Tìm kiếm nhanh chứng từ/phiếu, cảnh báo thiết bị sắp hết hạn, tích hợp AI gợi ý chi nhánh gần nhất từ địa chỉ trên giấy bảo hành.
- **Tra cứu & Chứng nhận (`/lookup`)**: Xác thực Serial / IMEI / mã giấy bảo hành (`WB-...`) / mã phiếu (`TKT-...`) và xuất thẻ chứng nhận QR Studio.
- **Sổ Thiết bị (`/my-devices`)**: Quản lý tài sản đã kích hoạt, đăng ký Serial mới, gia hạn bảo hành `+12T` và tạo nhanh yêu cầu sửa chữa.
- **Gửi Yêu cầu Bảo hành (`/submit-request`)**: Chọn thiết bị, phân loại lỗi, tự động phân tích địa chỉ bằng AI để chọn trạm tiếp nhận tối ưu.
- **Theo dõi Tiến độ (`/track`)**: Timeline xử lý 6 bước, bảng linh kiện thay thế, trao đổi trực tiếp với KTV và xác nhận nghiệm thu bàn giao.
- **Tài khoản (`/auth`)**: Đăng nhập / đăng ký với JWT Access & Refresh Token.

### Bàn Điều hành Quản trị (Admin Operations Suite)
- **Tổng quan (`/admin`)**: KPI vận hành, lọc theo khung thời gian, tỷ trọng nhóm lỗi, công suất 5 trạm ủy quyền và danh sách chứng nhận sắp hết hạn.
- **Kho Chứng nhận BH (`/admin/records`)**: Cấp mới chứng nhận, gia hạn `+12T`, mở Studio Thẻ QR, kiểm tra hàng loạt (Batch Check Serial) và xóa hồ sơ.
- **Điều phối Phiếu RMA (`/admin/tickets`)**: Giao diện Master-Detail xử lý trạng thái, áp dụng 1-click trạm & KTV theo đề xuất AI, xuất kho linh kiện, phản hồi khách hàng và từ chối bảo hành.
- **Hồ sơ Khách hàng CRM (`/admin/customers` & `/admin/customers/:id`)**: Quản lý phân hạng VIP/Cá nhân/Đại lý, khóa/mở khóa, xem danh sách chứng nhận & lịch sử RMA, ghi chú nội bộ CSKH và Audit Trail.
- **Danh mục Thiết bị & SKU (`/admin/products`)**: Quản lý SKU, cấu hình, thời hạn bảo hành mặc định, giá niêm yết và theo dõi tỷ lệ phát sinh lỗi.
- **Báo cáo & Phân tích (`/admin/analytics`)**: Biểu đồ nguyên nhân lỗi (OEM / Người dùng / Môi trường), Top 5 SKU tỷ lệ lỗi cao, bảng SLA Scorecard kỹ thuật viên, in PDF và xuất CSV UTF-8.

## Hướng dẫn Cài đặt & Chạy Dự án

### 1. Cài đặt Backend (`http://localhost:5000/v1`)
```bash
cd backend
cp .env.example .env
# Cập nhật MONGO_URI trong backend/.env (MongoDB local hoặc MongoDB Atlas)
npm install
npm run seed   # (Tùy chọn - server cũng tự seed khi khởi động nếu DB trống)
npm run dev
```

### 2. Cài đặt Frontend (`http://localhost:5173`)
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

*(Lưu ý: Trên Windows PowerShell nếu bị chặn script `npm.ps1`, dùng `npm.cmd` hoặc chạy `node ./src/server.js` trực tiếp).*

## Tài khoản Mẫu (Seed Data)
- **Admin**: `admin@warrantyops.com` / `admin123`
- **Khách hàng VIP**: `tuan.tran@gmail.com` / `123456`
