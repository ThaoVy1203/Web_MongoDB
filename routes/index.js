const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ==========================================
// 1. ĐỊNH NGHĨA SCHEMA & MODEL HỒ SƠ BÀO HÀNH
// ==========================================
const warrantySchema = new mongoose.Schema(
  {
    warrantyCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    customerName: {
      type: String,
      required: [true, 'Vui lòng nhập tên khách hàng'],
      trim: true
    },
    customerPhone: {
      type: String,
      required: [true, 'Vui lòng nhập số điện thoại khách hàng'],
      trim: true
    },
    customerEmail: {
      type: String,
      trim: true,
      default: ''
    },
    customerAddress: {
      type: String,
      trim: true,
      default: ''
    },
    productName: {
      type: String,
      required: [true, 'Vui lòng nhập tên sản phẩm'],
      trim: true
    },
    productSerial: {
      type: String,
      required: [true, 'Vui lòng nhập số Serial / IMEI'],
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      enum: ['Điện thoại', 'Laptop/Máy tính', 'Thiết bị gia dụng', 'Phụ kiện', 'Khác'],
      default: 'Điện thoại'
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    warrantyPeriodMonths: {
      type: Number,
      default: 12
    },
    warrantyExpiryDate: {
      type: Date
    },
    issueDescription: {
      type: String,
      required: [true, 'Vui lòng nhập mô tả tình trạng lỗi của sản phẩm'],
      trim: true
    },
    status: {
      type: String,
      enum: ['Tiếp nhận', 'Đang kiểm tra', 'Chờ linh kiện', 'Đã sửa xong', 'Đã trả khách', 'Từ chối bảo hành'],
      default: 'Tiếp nhận'
    },
    repairCost: {
      type: Number,
      default: 0
    },
    technicianNotes: {
      type: String,
      trim: true,
      default: 'Chưa có ghi chú xử lý'
    },
    receivedDate: {
      type: Date,
      default: Date.now
    },
    completedDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Tắt chế độ chờ vô hạn của Mongoose nếu chưa kết nối CSDL (bufferCommands: false)
warrantySchema.set('bufferCommands', false);

// Tạo Model Warranty nếu chưa tồn tại
const Warranty = mongoose.models.Warranty || mongoose.model('Warranty', warrantySchema);

// Dữ liệu mẫu khởi tạo theo mockup hình ảnh
const initialSeedData = [
  {
    _id: 'sample_001',
    warrantyCode: 'TKT-2024-8891',
    customerName: 'Trần Anh Tuấn',
    customerPhone: '0912.345.891',
    customerEmail: 'tuan.tran@gmail.com',
    customerAddress: 'Cầu Giấy, Hà Nội',
    productName: 'Dell XPS 15 9530',
    productSerial: 'DL-992810',
    category: 'Laptop/Máy tính',
    issueDescription: 'Sọc màn hình dọc, chớp nháy khi mở gập góc 90 độ',
    status: 'Đang kiểm tra',
    repairCost: 0,
    technicianNotes: 'Đang kiểm tra cáp màn hình eDP',
    receivedDate: new Date(Date.now() - 10 * 60 * 1000)
  },
  {
    _id: 'sample_002',
    warrantyCode: 'TKT-2024-8890',
    customerName: 'Lê Hoàng Nam',
    customerPhone: '0988.776.890',
    customerEmail: 'nam.le@gmail.com',
    customerAddress: 'Quận 1, TP. Hồ Chí Minh',
    productName: 'iPhone 15 Pro Max',
    productSerial: '3589211029',
    category: 'Điện thoại',
    issueDescription: 'Không nhận sạc cáp Type-C, cổng sạc lỏng',
    status: 'Chờ linh kiện',
    repairCost: 0,
    technicianNotes: 'Chờ cụm cáp sạc và mic chính hãng từ kho',
    receivedDate: new Date(Date.now() - 32 * 60 * 1000)
  },
  {
    _id: 'sample_003',
    warrantyCode: 'TKT-2024-8889',
    customerName: 'Đặng Thảo Vy',
    customerPhone: '0903.456.889',
    customerEmail: 'thaovy@gmail.com',
    customerAddress: 'Bình Thạnh, TP. Hồ Chí Minh',
    productName: 'MacBook Air M2 13"',
    productSerial: 'C02GM9PK',
    category: 'Laptop/Máy tính',
    issueDescription: 'Liệt bàn phím, kẹt phím Space và Shift trái',
    status: 'Tiếp nhận',
    repairCost: 0,
    technicianNotes: 'Mới nhận máy từ khách, ngoại quan 99%',
    receivedDate: new Date(Date.now() - 60 * 60 * 1000)
  },
  {
    _id: 'sample_004',
    warrantyCode: 'TKT-2024-8888',
    customerName: 'Vũ Tiến Dũng',
    customerPhone: '0976.223.888',
    customerEmail: 'dung.vu@gmail.com',
    customerAddress: 'Thanh Xuân, Hà Nội',
    productName: 'Samsung Galaxy S24 Ultra',
    productSerial: '9940129381',
    category: 'Điện thoại',
    issueDescription: 'Lỗi lấy nét camera chính x10, mờ và rung quang học',
    status: 'Đang kiểm tra',
    repairCost: 0,
    technicianNotes: 'Cần cân chỉnh lại module thấu kính tiềm vọng',
    receivedDate: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    _id: 'sample_005',
    warrantyCode: 'TKT-2024-8887',
    customerName: 'Phạm Hải Yến',
    customerPhone: '0934.112.887',
    customerEmail: 'yen.pham@gmail.com',
    customerAddress: 'Hải Châu, Đà Nẵng',
    productName: 'Asus ROG Zephyrus G14',
    productSerial: 'AS-R05014-22',
    category: 'Laptop/Máy tính',
    issueDescription: 'Quạt tản nhiệt kêu rè rè, máy nóng quá nhiệt 95°C',
    status: 'Đã trả khách',
    repairCost: 450000,
    technicianNotes: 'Đã thay quạt tản nhiệt GPU, tra keo tản nhiệt kim loại lỏng',
    receivedDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
    completedDate: new Date()
  }
];

// Danh sách thiết bị cảnh báo sắp hết hạn
const expiringDevices = [
  {
    name: 'Sony WH-1000XM5',
    customer: 'Bùi Quốc Huy',
    daysLeft: 2,
    phone: '0912.***.892'
  },
  {
    name: 'iPad Pro M2 11"',
    customer: 'Nguyễn Mai Anh',
    daysLeft: 3,
    phone: '0985.***.112'
  },
  {
    name: 'Smart TV LG OLED 65"',
    customer: 'Hoàng Văn Đức',
    daysLeft: 5,
    phone: '0904.***.773'
  },
  {
    name: 'ThinkPad X1 Carbon Gen 11',
    customer: 'Cty CP Công Nghệ Next',
    daysLeft: 6,
    phone: '024.***.889'
  }
];

// Dữ liệu thống kê mặc định chuẩn theo giao diện
const defaultStats = {
  totalActive: 14820,
  processing: 68,
  slaRate: '96.2%',
  activeCustomers: 9250
};

// Hàm tự động khởi tạo dữ liệu mẫu nếu DB đã kết nối và đang trống
async function seedDefaultDataIfEmpty() {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const count = await Warranty.countDocuments();
    if (count === 0) {
      await Warranty.insertMany(initialSeedData.map(({ _id, ...rest }) => rest));
      console.log('✅ Đã nạp thành công 5 hồ sơ mẫu chuẩn theo giao diện WarrantyOps vào MongoDB!');
    }
  } catch (err) {
    console.warn('⚠️ Lỗi khi nạp dữ liệu mẫu vào DB:', err.message);
  }
}

// ==========================================
// 2. CÁC ROUTES ĐIỀU HƯỚNG
// ==========================================

// Danh sách sản phẩm của tài khoản CUST-88392-HCM theo thiết kế mẫu
let myCustomerProducts = [
  {
    id: 'prod_001',
    serial: 'DLXPS-99281-VN',
    origin: 'Chính hãng',
    statusBadge: 'Còn hạn 142 ngày',
    statusType: 'orange',
    categoryTag: 'MÁY TÍNH XÁCH TAY CAO CẤP',
    categoryColor: 'red',
    purchaseDate: '15/10/2023',
    name: 'Dell XPS 15 9530 OLED (i9-13900H / 32GB)',
    packageName: 'ProSupport Plus tận nơi 24/7',
    packageDesc: 'Đặc quyền: Kỹ thuật viên kiểm tra tại gia trong 4 giờ, bảo hành rơi vỡ ngập nước (Complete Care).',
    lifecycleLabel: 'Vòng đời bảo hành (730 ngày)',
    percentPassed: 80,
    actionText: 'Gửi yêu cầu bảo hành',
    actionUrl: '/gui-yeu-cau?serial=DLXPS-99281-VN',
    docUrl: '/tra-cuu?serial=DLXPS-99281-VN',
    renewUrl: 'javascript:alert("Gia hạn thêm gói ProSupport 12 tháng: 1.850.000 VNĐ");',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
    type: 'active'
  },
  {
    id: 'prod_002',
    serial: 'SN-DU27-44019-VN',
    origin: 'Ngoại vi',
    statusBadge: 'Còn hạn (Đến 18/06/2026)',
    statusType: 'amber',
    categoryTag: 'MÀN HÌNH CHUYÊN NGHIỆP 4K',
    categoryColor: 'orange',
    purchaseDate: '18/06/2023',
    name: 'Dell UltraSharp U2723QE IPS Black',
    packageName: 'Tiêu chuẩn hãng 36 tháng',
    packageDesc: 'Cam kết Premium Panel Exchange: Đổi mới trực tiếp trong 24h nếu xuất hiện 01 điểm sáng chết.',
    lifecycleLabel: 'Vòng đời bảo hành (1095 ngày)',
    percentPassed: 33,
    actionText: 'Gửi yêu cầu bảo hành',
    actionUrl: '/gui-yeu-cau?serial=SN-DU27-44019-VN',
    docUrl: '/tra-cuu?serial=SN-DU27-44019-VN',
    detailLinkText: 'Xem chi tiết điều khoản panel',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    type: 'active'
  },
  {
    id: 'prod_003',
    serial: 'SN-LP90-11209-KR',
    origin: 'Phụ kiện',
    statusBadge: 'Đã hết hạn (Quá hạn 65 ngày)',
    statusType: 'red',
    categoryTag: 'BÀN PHÍM CƠ CHERRY MX BLUE',
    categoryColor: 'grey',
    purchaseDate: '10/01/2022',
    name: 'Leopold FC900R PD White Grey',
    packageName: 'Gói cơ sở 24 tháng (Đã kết thúc)',
    packageDesc: 'Linh kiện tiêu hao (Switch, mạch PCB) được hỗ trợ kiểm tra kỹ thuật tính phí ưu đãi thành viên 30%.',
    highlightTag: 'Trung tâm tiếp nhận sửa chữa trọn đời',
    lifecycleLabel: '',
    percentPassed: 100,
    actionText: 'Đăng ký bảo trì / sửa chữa dịch vụ',
    actionUrl: '/gui-yeu-cau?serial=SN-LP90-11209-KR',
    docUrl: '/tra-cuu?serial=SN-LP90-11209-KR',
    historyLinkText: 'Xem lịch sử bảo hành đã qua',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    type: 'expired'
  }
];

/**
 * GET /san-pham-cua-toi : Trang Quản lý Sản phẩm của tôi
 */
router.get('/san-pham-cua-toi', (req, res) => {
  const { filter, search, success, error } = req.query;
  let products = [...myCustomerProducts];

  if (filter === 'active') {
    products = products.filter(p => p.type === 'active');
  } else if (filter === 'expiring') {
    products = products.filter(p => p.type === 'expiring');
  } else if (filter === 'expired') {
    products = products.filter(p => p.type === 'expired');
  }

  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.serial.toLowerCase().includes(q) ||
      p.categoryTag.toLowerCase().includes(q)
    );
  }

  const activeCount = myCustomerProducts.filter(p => p.type === 'active').length;
  const expiringCount = myCustomerProducts.filter(p => p.type === 'expiring').length;
  const expiredCount = myCustomerProducts.filter(p => p.type === 'expired').length;

  res.render('san-pham-cua-toi', {
    products,
    currentFilter: filter || 'all',
    searchQuery: search || '',
    stats: {
      total: myCustomerProducts.length,
      active: activeCount,
      expiring: expiringCount,
      expired: expiredCount
    },
    successMessage: success || null,
    errorMessage: error || null
  });
});

/**
 * POST /san-pham/register : Đăng ký Serial / IMEI thiết bị mới
 */
router.post('/san-pham/register', (req, res) => {
  const { serial, productName, category, purchaseDate } = req.body;
  if (!serial || !productName) {
    return res.redirect('/san-pham-cua-toi?error=Vui lòng nhập đầy đủ Số Serial và Tên sản phẩm!');
  }

  const s = serial.trim().toUpperCase();
  const existing = myCustomerProducts.find(p => p.serial === s);
  if (existing) {
    return res.redirect('/san-pham-cua-toi?error=Thiết bị với số Serial này đã được đăng ký trước đó!');
  }

  myCustomerProducts.unshift({
    id: 'prod_' + Date.now(),
    serial: s,
    origin: 'Chính hãng',
    statusBadge: 'Còn hạn 365 ngày',
    statusType: 'orange',
    categoryTag: (category || 'THIẾT BỊ MỚI ĐĂNG KÝ').toUpperCase(),
    categoryColor: 'orange',
    purchaseDate: purchaseDate || new Date().toLocaleDateString('vi-VN'),
    name: productName.trim(),
    packageName: 'Bảo hành chính hãng WarrantyOps',
    packageDesc: 'Cam kết tiếp nhận xử lý nhanh tại hệ thống 3 trạm ủy quyền toàn quốc.',
    lifecycleLabel: 'Vòng đời bảo hành (365 ngày)',
    percentPassed: 5,
    actionText: 'Gửi yêu cầu bảo hành',
    actionUrl: `/gui-yeu-cau?serial=${encodeURIComponent(s)}`,
    docUrl: `/tra-cuu?serial=${encodeURIComponent(s)}`,
    detailLinkText: 'Xem điều khoản chi tiết',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    type: 'active'
  });

  res.redirect(`/san-pham-cua-toi?success=${encodeURIComponent(`Đã đăng ký thiết bị [${s}] thành công vào danh mục tài sản của bạn!`)}`);
});

/**
 * GET /dang-nhap : Trang Đăng nhập / Đăng ký WarrantyOps
 */
router.get('/dang-nhap', (req, res) => {
  const { tab, message, error } = req.query;
  res.render('dang-nhap', {
    activeTab: tab === 'register' ? 'register' : 'login',
    successMessage: message || null,
    errorMessage: error || null
  });
});

router.get('/login', (req, res) => {
  res.redirect('/dang-nhap');
});

router.get('/dang-ky', (req, res) => {
  res.redirect('/dang-nhap?tab=register');
});

router.post('/dang-nhap', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.redirect('/dang-nhap?error=' + encodeURIComponent('Vui lòng nhập đầy đủ thông tin đăng nhập!'));
  }
  if (email.toLowerCase().includes('admin')) {
    return res.redirect('/admin');
  }
  res.redirect('/?success=' + encodeURIComponent('Đăng nhập thành công! Chào mừng bạn quay trở lại WarrantyOps.'));
});

router.post('/dang-ky', (req, res) => {
  const { fullname, email, password, confirmPassword } = req.body;
  if (!fullname || !email || !password) {
    return res.redirect('/dang-nhap?tab=register&error=' + encodeURIComponent('Vui lòng điền đầy đủ các trường thông tin!'));
  }
  if (password !== confirmPassword) {
    return res.redirect('/dang-nhap?tab=register&error=' + encodeURIComponent('Mật khẩu xác nhận không khớp!'));
  }
  res.redirect('/dang-nhap?message=' + encodeURIComponent('Đăng ký tài khoản thành công! Vui lòng đăng nhập vào hệ thống.'));
});

/**
 * GET /gui-yeu-cau : Trang Gửi Yêu Cầu Dịch Vụ Kỹ Thuật & Bảo Hành Trực Tuyến
 */
router.get('/gui-yeu-cau', (req, res) => {
  const { success, error } = req.query;
  res.render('gui-yeu-cau', {
    successMessage: success || null,
    errorMessage: error || null
  });
});

/**
 * GET /theo-doi : Trang Theo dõi bảo hành / Theo dõi tiến độ trực tiếp
 */
router.get('/theo-doi', (req, res) => {
  const { ticket } = req.query;
  res.render('theo-doi', {
    activeTicket: ticket || 'TKT-2024-0419'
  });
});

router.get('/theo-doi-bao-hanh', (req, res) => {
  res.redirect('/theo-doi');
});

/**
 * GET /admin & /dashboard : Trang Dashboard Quản trị & Vận hành Bảo hành
 */
router.get('/admin', async (req, res) => {
  res.render('admin-dashboard');
});

router.get('/admin/dashboard', (req, res) => {
  res.redirect('/admin');
});

router.get('/dashboard', (req, res) => {
  res.redirect('/admin');
});

/**
 * GET /admin/khach-hang : Trang Quản lý Khách hàng của Admin
 */
router.get('/admin/khach-hang', async (req, res) => {
  res.render('admin-khach-hang');
});

router.get('/admin/customers', (req, res) => {
  res.redirect('/admin/khach-hang');
});

router.get('/admin/quan-ly-khach-hang', (req, res) => {
  res.redirect('/admin/khach-hang');
});

/**
 * GET /admin/ho-so-khach-hang : Trang Hồ sơ chi tiết Khách hàng của Admin
 */
router.get('/admin/ho-so-khach-hang', async (req, res) => {
  res.render('admin-ho-so-khach-hang');
});

router.get('/admin/khach-hang/ho-so', (req, res) => {
  res.redirect('/admin/ho-so-khach-hang');
});

router.get('/admin/khach-hang/:id', (req, res) => {
  res.render('admin-ho-so-khach-hang');
});

/**
 * GET /admin/san-pham : Trang Quản lý Sản phẩm của Admin
 */
router.get('/admin/san-pham', async (req, res) => {
  res.render('admin-san-pham');
});

router.get('/admin/quan-ly-san-pham', (req, res) => {
  res.redirect('/admin/san-pham');
});

router.get('/admin/products', (req, res) => {
  res.redirect('/admin/san-pham');
});

/**
 * GET /admin/ho-so-bao-hanh : Trang Quản lý Hồ sơ Bảo hành của Admin
 */
router.get('/admin/ho-so-bao-hanh', async (req, res) => {
  res.render('admin-ho-so-bao-hanh');
});

router.get('/admin/bao-hanh', (req, res) => {
  res.redirect('/admin/ho-so-bao-hanh');
});

router.get('/admin/warranty', (req, res) => {
  res.redirect('/admin/ho-so-bao-hanh');
});

/**
 * GET /admin/yeu-cau-bao-hanh : Trang Quản lý Yêu cầu & Xử lý Bảo hành (Ticket/RMA)
 */
router.get('/admin/yeu-cau-bao-hanh', async (req, res) => {
  res.render('admin-yeu-cau-bao-hanh');
});

router.get('/admin/xu-ly-phieu', (req, res) => {
  res.redirect('/admin/yeu-cau-bao-hanh');
});

router.get('/admin/yeu-cau', (req, res) => {
  res.redirect('/admin/yeu-cau-bao-hanh');
});

router.get('/admin/tickets', (req, res) => {
  res.redirect('/admin/yeu-cau-bao-hanh');
});

router.get('/admin/rma', (req, res) => {
  res.redirect('/admin/yeu-cau-bao-hanh');
});

/**
 * GET /admin/thong-ke : Trang Thống kê & Báo cáo Hoạt động Bảo hành
 */
router.get('/admin/thong-ke', async (req, res) => {
  res.render('admin-thong-ke');
});

router.get('/admin/bao-cao', (req, res) => {
  res.redirect('/admin/thong-ke');
});

router.get('/admin/reports', (req, res) => {
  res.redirect('/admin/thong-ke');
});

router.get('/admin/analytics', (req, res) => {
  res.redirect('/admin/thong-ke');
});

/**
 * GET /tra-cuu : Trang Tra cứu Thông tin & Thời hạn Bảo hành sản phẩm
 */
/**
 * GET /tra-cuu : Trang Tra cứu Thông tin & Thời hạn Bảo hành sản phẩm
 */
router.get('/tra-cuu', async (req, res) => {
  const { serial, search, code } = req.query;
  const rawQuery = (serial || search || code || '').trim();
  const hasExplicitQuery = Boolean(rawQuery);
  const queryStr = (hasExplicitQuery ? rawQuery : 'DLXPS-99281-VN').trim();
  const qLower = queryStr.toLowerCase();
  
  let deviceResult = null;
  let notFound = false;

  // Danh mục dữ liệu mẫu các dòng sản phẩm
  const dellXpsData = {
    productName: 'Dell XPS 15 9530 OLED (2023)',
    category: 'Laptop & Ultrabook',
    modelCode: 'XPS-9530-2023',
    warrantyCode: 'WB-2023-8812',
    rawSerial: 'DLXPS-99281-VN',
    maskedSerial: 'DLXPS-99***-VN',
    servicePackage: 'Dell ProSupport Plus 24/7',
    status: 'CÒN HẠN BẢO HÀNH',
    daysRemaining: 142,
    totalDays: 365,
    daysPassed: 223,
    percentPassed: 61.1,
    purchaseDate: '15/10/2023',
    purchasePlace: 'Đại lý ủy quyền',
    activateDate: '16/10/2023',
    activateType: 'Kích hoạt trực tuyến',
    expiryDate: '16/10/2024',
    warrantyDurationText: 'Bảo hành 1 năm chính hãng',
    commitText: 'Thay thế linh kiện chính hãng tại nhà trong 72h làm việc',
    benefits: [
      {
        title: 'Tấm nền OLED 3.5K',
        badge: 'ĐƯỢC BẢO HÀNH',
        badgeType: 'orange',
        desc: 'Bảo hành lỗi điểm chết > 3 điểm, sọc hiển thị, ám màn hình lưu ảnh Burn-in.'
      },
      {
        title: 'Bo mạch chủ (Mainboard)',
        badge: 'ĐƯỢC BẢO HÀNH',
        badgeType: 'orange',
        desc: 'Xử lý hỏng hóc nguồn, chip âm thanh, GPU RTX 4060, kết nối Thunderbolt 4.'
      },
      {
        title: 'Pin dung lượng 86Wh',
        badge: 'ĐỔI MỚI 1:1',
        badgeType: 'dark',
        desc: 'Đổi pin mới nếu độ chai vượt quá 25% trong vòng 12 tháng đầu tiên.'
      }
    ],
    exclusionText: 'Loại trừ: Rơi vỡ biến dạng, cấn móp vỏ nhôm hoặc ngấm chất lỏng.',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=400&q=80'
  };

  const macBookData = {
    productName: 'MacBook Pro 14" M3 Pro (2023)',
    category: 'Laptop & Ultrabook',
    modelCode: 'A2992-M3PRO',
    warrantyCode: 'WB-2023-7740',
    rawSerial: 'APMAC-77402-PRO',
    maskedSerial: 'APMAC-77***-PRO',
    servicePackage: 'AppleCare+ Enterprise 24/7',
    status: 'CÒN HẠN BẢO HÀNH',
    daysRemaining: 735,
    totalDays: 1095,
    daysPassed: 360,
    percentPassed: 32.8,
    purchaseDate: '10/11/2023',
    purchasePlace: 'Apple Store Trực tuyến',
    activateDate: '10/11/2023',
    activateType: 'Kích hoạt iCloud chính chủ',
    expiryDate: '10/11/2026',
    warrantyDurationText: 'Bảo hành 3 năm gói AppleCare+',
    commitText: 'Bảo hành toàn cầu tại mọi trung tâm Apple Authorized Service Provider',
    benefits: [
      {
        title: 'Màn hình Liquid Retina XDR',
        badge: 'ĐƯỢC BẢO HÀNH',
        badgeType: 'orange',
        desc: 'Bảo hành hỏng ProMotion 120Hz, điểm sáng, đốm phản quang, cáp màn hình.'
      },
      {
        title: 'Chip Apple M3 Pro & Logic Board',
        badge: 'ĐƯỢC BẢO HÀNH',
        badgeType: 'orange',
        desc: 'Bảo hành bộ xử lý SoC, RAM hợp nhất và chip quản lý nguồn SMC.'
      },
      {
        title: 'Bàn phím Magic Keyboard & Touch ID',
        badge: 'ĐỔI MỚI 1:1',
        badgeType: 'dark',
        desc: 'Bảo hành kẹt phím, lún phím, lỗi cảm biến vân tay Touch ID.'
      }
    ],
    exclusionText: 'Loại trừ: Sản phẩm đã can thiệp phần cứng trái phép ngoài ủy quyền.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80'
  };

  const samsungData = {
    productName: 'Samsung Galaxy S24 Ultra 5G (2024)',
    category: 'Điện thoại thông minh',
    modelCode: 'SM-S928B/DS',
    warrantyCode: 'WB-2024-3310',
    rawSerial: 'SSGAL-33109-ULT',
    maskedSerial: 'SSGAL-33***-ULT',
    servicePackage: 'Samsung Care+ Toàn diện 24/7',
    status: 'CÒN HẠN BẢO HÀNH',
    daysRemaining: 245,
    totalDays: 365,
    daysPassed: 120,
    percentPassed: 32.8,
    purchaseDate: '25/01/2024',
    purchasePlace: 'Samsung Brand Shop',
    activateDate: '26/01/2024',
    activateType: 'Kích hoạt Knox Server',
    expiryDate: '26/01/2025',
    warrantyDurationText: 'Bảo hành 1 năm chính hãng',
    commitText: 'Tiếp nhận và giao trả thiết bị tận nơi miễn phí 24/7',
    benefits: [
      {
        title: 'Màn hình Dynamic AMOLED 2X',
        badge: 'ĐƯỢC BẢO HÀNH',
        badgeType: 'orange',
        desc: 'Bảo hành kính Gorilla Armor, lỗi cảm ứng đa điểm, tần số quét 120Hz.'
      },
      {
        title: 'Cụm 4 Camera Zoom 100x',
        badge: 'ĐƯỢC BẢO HÀNH',
        badgeType: 'orange',
        desc: 'Bảo hành chống rung quang học OIS, cảm biến 200MP và ống kính tiềm vọng.'
      },
      {
        title: 'Bút S-Pen tích hợp Bluetooth',
        badge: 'ĐỔI MỚI 1:1',
        badgeType: 'dark',
        desc: 'Đổi mới bút S-Pen nếu mất kết nối hoặc pin con quay hồi chuyển lỗi.'
      }
    ],
    exclusionText: 'Loại trừ: Sản phẩm biến dạng do tác động ngoại lực nghiêm trọng.',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=400&q=80'
  };

  const ultraSharpData = {
    productName: 'Dell UltraSharp U2723QE IPS Black (2023)',
    category: 'Màn hình chuyên nghiệp',
    modelCode: 'U2723QE-4K-IPS',
    warrantyCode: 'WB-2023-4401',
    rawSerial: 'SN-DU27-44019-VN',
    maskedSerial: 'SN-DU27-44***-VN',
    servicePackage: 'Tiêu chuẩn hãng 36 tháng',
    status: 'CÒN HẠN BẢO HÀNH',
    daysRemaining: 1095,
    totalDays: 1095,
    daysPassed: 365,
    percentPassed: 33.3,
    purchaseDate: '18/06/2023',
    purchasePlace: 'Đại lý ủy quyền Dell',
    activateDate: '18/06/2023',
    activateType: 'Kích hoạt trực tuyến',
    expiryDate: '18/06/2026',
    warrantyDurationText: 'Bảo hành 3 năm chính hãng',
    commitText: 'Đổi mới trực tiếp trong 24h nếu xuất hiện 01 điểm sáng chết',
    benefits: [
      {
        title: 'Tấm nền IPS Black 4K HDR',
        badge: 'ĐƯỢC BẢO HÀNH',
        badgeType: 'orange',
        desc: 'Bảo hành lỗi điểm chết, hở sáng quá mức, sọc màn hình hoặc lệch màu.'
      },
      {
        title: 'Bo mạch điều khiển & Cổng USB-C Hub 90W',
        badge: 'ĐƯỢC BẢO HÀNH',
        badgeType: 'orange',
        desc: 'Xử lý lỗi nhận diện hình ảnh Type-C, cổng RJ45 Ethernet và nguồn cấp 90W.'
      },
      {
        title: 'Chân đế công thái học & Phụ kiện cáp',
        badge: 'ĐỔI MỚI 1:1',
        badgeType: 'dark',
        desc: 'Hỗ trợ thay thế chân đế hoặc dây cáp tín hiệu nếu phát sinh lỗi kỹ thuật.'
      }
    ],
    exclusionText: 'Loại trừ: Rơi vỡ nứt tấm nền, cấn móp vỏ hoặc chập điện do thiên tai.',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80'
  };

  const leopoldData = {
    productName: 'Leopold FC900R PD White Grey (Cherry MX)',
    category: 'Bàn phím cơ cao cấp',
    modelCode: 'FC900R-PD-WGY',
    warrantyCode: 'WB-2022-1120',
    rawSerial: 'SN-LP90-11209-KR',
    maskedSerial: 'SN-LP90-11***-KR',
    servicePackage: 'Gói cơ sở 24 tháng (Đã kết thúc)',
    status: 'HẾT HẠN BẢO HÀNH',
    daysRemaining: 0,
    totalDays: 730,
    daysPassed: 795,
    percentPassed: 100,
    purchaseDate: '10/01/2022',
    purchasePlace: 'Hệ thống Gaming Gear chính hãng',
    activateDate: '10/01/2022',
    activateType: 'Kích hoạt điện tử',
    expiryDate: '10/01/2024',
    warrantyDurationText: 'Đã hết hạn bảo hành (Quá hạn 65 ngày)',
    commitText: 'Hỗ trợ sửa chữa và thay thế switch/mạch PCB tính phí ưu đãi thành viên',
    benefits: [
      {
        title: 'Switch Cherry MX & Bo mạch PCB',
        badge: 'HỖ TRỢ DỊCH VỤ',
        badgeType: 'dark',
        desc: 'Hỗ trợ vệ sinh, bôi trơn và thay thế switch Cherry Blue/Red kẹt phím.'
      },
      {
        title: 'Keycap PBT Double-Shot 1.5mm',
        badge: 'HỖ TRỢ THAY THẾ',
        badgeType: 'dark',
        desc: 'Cung cấp nút bấm thay thế nếu gãy chân hoặc mài mòn theo thời gian.'
      },
      {
        title: 'Cáp kết nối rời Mini-USB & Cổng cắm',
        badge: 'SỬA CHỮA',
        badgeType: 'dark',
        desc: 'Khắc phục lỏng chân tiếp xúc hoặc đứt ngầm dây cáp dẫn tín hiệu.'
      }
    ],
    exclusionText: 'Loại trừ: Sản phẩm tự ý mod mạch sai quy cách hoặc đổ chất lỏng.',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80'
  };

  // Khớp chuỗi tìm kiếm theo các mẫu
  if (qLower.includes('dlxps') || qLower.includes('9530') || qLower.includes('8812')) {
    deviceResult = dellXpsData;
  } else if (qLower.includes('mac') || qLower.includes('apmac') || qLower.includes('c02gm')) {
    deviceResult = macBookData;
  } else if (qLower.includes('ssgal') || qLower.includes('samsung') || qLower.includes('33109') || qLower.includes('s24')) {
    deviceResult = samsungData;
  } else if (qLower.includes('du27') || qLower.includes('u2723qe') || qLower.includes('ultrasharp')) {
    deviceResult = ultraSharpData;
  } else if (qLower.includes('lp90') || qLower.includes('lp96') || qLower.includes('leopold') || qLower.includes('fc900r')) {
    deviceResult = leopoldData;
  } else if (!hasExplicitQuery) {
    // Mặc định ban đầu vào trang
    deviceResult = dellXpsData;
  }

  // Tìm trong danh mục myCustomerProducts nếu chưa có kết quả
  if (!deviceResult && hasExplicitQuery) {
    const custProd = myCustomerProducts.find(p => 
      p.serial.toLowerCase().includes(qLower) || 
      p.name.toLowerCase().includes(qLower) ||
      (p.id && p.id.toLowerCase() === qLower)
    );

    if (custProd) {
      const isExpired = custProd.type === 'expired';
      deviceResult = {
        productName: custProd.name,
        category: custProd.categoryTag || 'Thiết bị người dùng',
        modelCode: custProd.serial,
        warrantyCode: 'WB-' + custProd.serial.slice(0, 8),
        rawSerial: custProd.serial,
        maskedSerial: custProd.serial.slice(0, 4) + '***' + custProd.serial.slice(-3),
        servicePackage: custProd.packageName || 'WarrantyOps Bảo hành chính hãng',
        status: isExpired ? 'HẾT HẠN BẢO HÀNH' : 'CÒN HẠN BẢO HÀNH',
        daysRemaining: isExpired ? 0 : 180,
        totalDays: 365,
        daysPassed: isExpired ? 400 : 185,
        percentPassed: custProd.percentPassed || (isExpired ? 100 : 50),
        purchaseDate: custProd.purchaseDate || '15/10/2023',
        purchasePlace: 'Đại lý phân phối ủy quyền',
        activateDate: custProd.purchaseDate || '15/10/2023',
        activateType: 'Kích hoạt điện tử',
        expiryDate: isExpired ? '10/01/2024' : '15/10/2025',
        warrantyDurationText: custProd.statusBadge || 'Bảo hành chính hãng',
        commitText: 'Thay thế linh kiện chính hãng tại nhà trong 72h làm việc',
        benefits: [
          {
            title: 'Linh kiện phần cứng chính',
            badge: isExpired ? 'HỖ TRỢ DỊCH VỤ' : 'ĐƯỢC BẢO HÀNH',
            badgeType: isExpired ? 'dark' : 'orange',
            desc: custProd.packageDesc || 'Hỗ trợ sửa chữa và thay thế linh kiện chính hãng.'
          }
        ],
        exclusionText: 'Loại trừ: Rơi vỡ biến dạng, cấn móp vỏ hoặc ngấm chất lỏng.',
        image: custProd.image || 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=400&q=80'
      };
    }
  }

  // Tìm trong cơ sở dữ liệu MongoDB
  if (!deviceResult && hasExplicitQuery && mongoose.connection.readyState === 1) {
    try {
      const safeEscaped = queryStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const dbTicket = await Warranty.findOne({
        $or: [
          { warrantyCode: new RegExp(safeEscaped, 'i') },
          { productSerial: new RegExp(safeEscaped, 'i') },
          { customerPhone: queryStr }
        ]
      });

      if (dbTicket) {
        const pDate = dbTicket.purchaseDate ? new Date(dbTicket.purchaseDate) : new Date(dbTicket.receivedDate || Date.now());
        const expDate = dbTicket.warrantyExpiryDate ? new Date(dbTicket.warrantyExpiryDate) : new Date(pDate.getTime() + 365*24*60*60*1000);
        const now = new Date();
        const totalMs = Math.max(1, expDate.getTime() - pDate.getTime());
        const passedMs = Math.max(0, now.getTime() - pDate.getTime());
        const percent = Math.min(100, Math.max(0, (passedMs / totalMs) * 100));
        const daysLeft = Math.max(0, Math.ceil((expDate.getTime() - now.getTime()) / (1000*60*60*24)));
        const daysPassed = Math.floor(passedMs / (1000*60*60*24));

        deviceResult = {
          productName: dbTicket.productName,
          category: dbTicket.category || 'Thiết bị điện tử',
          modelCode: 'MODEL-' + dbTicket.warrantyCode,
          warrantyCode: dbTicket.warrantyCode,
          rawSerial: dbTicket.productSerial,
          maskedSerial: dbTicket.productSerial.slice(0, 4) + '****' + dbTicket.productSerial.slice(-2),
          servicePackage: 'WarrantyOps ProSupport 24/7',
          status: daysLeft > 0 ? 'CÒN HẠN BẢO HÀNH' : 'HẾT HẠN BẢO HÀNH',
          daysRemaining: daysLeft,
          totalDays: Math.ceil(totalMs / (1000*60*60*24)),
          daysPassed: daysPassed,
          percentPassed: parseFloat(percent.toFixed(1)),
          purchaseDate: pDate.toLocaleDateString('vi-VN'),
          purchasePlace: 'Hệ thống đại lý phân phối',
          activateDate: pDate.toLocaleDateString('vi-VN'),
          activateType: 'Kích hoạt điện tử',
          expiryDate: expDate.toLocaleDateString('vi-VN'),
          warrantyDurationText: `Thời hạn ${dbTicket.warrantyPeriodMonths || 12} tháng chính hãng`,
          commitText: 'Thay thế linh kiện chính hãng tại nhà trong 72h làm việc',
          benefits: [
            {
              title: 'Màn hình & Linh kiện hiển thị',
              badge: 'ĐƯỢC BẢO HÀNH',
              badgeType: 'orange',
              desc: 'Bảo hành toàn bộ lỗi phần cứng, sọc hiển thị, điểm ảnh.'
            },
            {
              title: 'Bo mạch chủ & Chipset',
              badge: 'ĐƯỢC BẢO HÀNH',
              badgeType: 'orange',
              desc: 'Bảo hành phần cứng bo mạch, nguồn điện và các cổng kết nối.'
            },
            {
              title: 'Pin & Bộ sạc nguồn',
              badge: 'ĐỔI MỚI 1:1',
              badgeType: 'dark',
              desc: 'Đổi mới miễn phí nếu chai pin bất thường trong kỳ bảo hành.'
            }
          ],
          exclusionText: 'Loại trừ: Rơi vỡ biến dạng, cấn móp vỏ hoặc ngấm chất lỏng.',
          image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=400&q=80'
        };
      }
    } catch (e) {
      console.warn('Lỗi tìm kiếm DB trên trang tra cứu:', e.message);
    }
  }

  // Nếu người dùng nhập mã tìm kiếm nhưng không khớp bất kỳ thiết bị nào
  if (hasExplicitQuery && !deviceResult) {
    notFound = true;
  }

  res.render('tra-cuu', {
    device: deviceResult,
    searchQuery: hasExplicitQuery ? rawQuery : 'DLXPS-99281-VN',
    notFound: notFound
  });
});

/**
 * GET / : Trang chủ Dashboard WarrantyOps
 */
router.get('/', async (req, res) => {
  const { search, status, success, error } = req.query;

  // Nếu MongoDB chưa kết nối, hiển thị ngay dữ liệu mẫu mà không làm chậm/đơ trang
  if (mongoose.connection.readyState !== 1) {
    let filteredWarranties = [...initialSeedData];

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filteredWarranties = filteredWarranties.filter(
        w => w.warrantyCode.toLowerCase().includes(q) ||
             w.customerName.toLowerCase().includes(q) ||
             w.productSerial.toLowerCase().includes(q) ||
             w.productName.toLowerCase().includes(q) ||
             w.customerPhone.includes(q)
      );
    }

    if (status && status.trim() !== '') {
      filteredWarranties = filteredWarranties.filter(w => w.status === status.trim());
    }

    const activeTicket = (filteredWarranties && filteredWarranties.length > 0)
      ? filteredWarranties[0]
      : initialSeedData[0];

    return res.render('index', {
      warranties: filteredWarranties,
      activeTicket,
      hasSearched: Boolean(search && search.trim() !== ''),
      searchQuery: search || '',
      statusFilter: status || '',
      stats: defaultStats,
      expiringDevices,
      successMessage: success || null,
      errorMessage: error || null
    });
  }

  // Nếu MongoDB đã kết nối thành công:
  try {
    await seedDefaultDataIfEmpty();

    const filter = {};

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { warrantyCode: searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { productSerial: searchRegex },
        { productName: searchRegex }
      ];
    }

    if (status && status.trim() !== '') {
      filter.status = status.trim();
    }

    let warranties = await Warranty.find(filter).sort({ createdAt: -1 });

    const totalCount = await Warranty.countDocuments();
    const processingCount = await Warranty.countDocuments({ status: { $in: ['Tiếp nhận', 'Đang kiểm tra', 'Chờ linh kiện'] } });

    const activeList = warranties.length > 0 ? warranties : initialSeedData;
    const activeTicket = activeList[0];

    res.render('index', {
      warranties: activeList,
      activeTicket,
      hasSearched: Boolean(search && search.trim() !== ''),
      searchQuery: search || '',
      statusFilter: status || '',
      stats: {
        totalActive: 14820 + (totalCount > 5 ? totalCount - 5 : 0),
        processing: processingCount > 0 ? (68 + processingCount - 4) : 68,
        slaRate: '96.2%',
        activeCustomers: 9250
      },
      expiringDevices,
      successMessage: success || null,
      errorMessage: error || null
    });
  } catch (err) {
    console.error('Lỗi khi tải Dashboard:', err);
    res.render('index', {
      warranties: initialSeedData,
      searchQuery: '',
      statusFilter: '',
      stats: defaultStats,
      expiringDevices,
      successMessage: null,
      errorMessage: 'Lỗi truy vấn cơ sở dữ liệu: ' + err.message
    });
  }
});

/**
 * GET /sync-mongodb : Đồng bộ hóa lại dữ liệu MongoDB
 */
router.get('/sync-mongodb', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.redirect('/?error=Chưa thể đồng bộ vì chưa kết nối được máy chủ MongoDB (127.0.0.1:27017)!');
  }

  try {
    await seedDefaultDataIfEmpty();
    res.redirect('/?success=Đã đồng bộ cơ sở dữ liệu MongoDB thành công!');
  } catch (err) {
    res.redirect(`/?error=Lỗi khi đồng bộ: ${encodeURIComponent(err.message)}`);
  }
});

/**
 * POST /warranty/create : Tạo mới hồ sơ tiếp nhận bảo hành
 */
router.post('/warranty/create', async (req, res) => {
  const referer = req.headers.referer || '/';
  const isFromGuiYeuCau = referer.includes('gui-yeu-cau');
  const redirectBase = isFromGuiYeuCau ? '/gui-yeu-cau' : '/';

  const {
    warrantyCode,
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    productName,
    productSerial,
    category,
    purchaseDate,
    warrantyPeriodMonths,
    issueDescription,
    status,
    technicianNotes,
    repairCost,
    pickup_mode,
    preferredTime,
    borrowLaptop
  } = req.body;

  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const code = warrantyCode && warrantyCode.trim() !== ''
    ? warrantyCode.trim().toUpperCase()
    : `TKT-2024-${randomCode}`;

  let note = technicianNotes || 'Mới tiếp nhận sản phẩm';
  if (pickup_mode) {
    note += ` [Hình thức: ${pickup_mode === 'onsite' ? 'Nhân viên đến tận nhà' : 'Tự mang đến trung tâm'}]`;
  }
  if (preferredTime) {
    note += ` [Khung giờ hẹn: ${preferredTime}]`;
  }
  if (borrowLaptop === 'yes') {
    note += ` [Đăng ký mượn máy laptop dự phòng]`;
  }

  // Chế độ Offline nếu MongoDB chưa kết nối: lưu vào bộ nhớ tạm để trải nghiệm người dùng không bị gián đoạn
  if (mongoose.connection.readyState !== 1) {
    initialSeedData.unshift({
      _id: 'mock_' + Date.now(),
      warrantyCode: code,
      customerName: customerName || 'Khách hàng',
      customerPhone: customerPhone || '0900000000',
      customerEmail: customerEmail || '',
      customerAddress: customerAddress || '',
      productName: productName || 'Thiết bị điện tử',
      productSerial: productSerial ? productSerial.trim().toUpperCase() : 'SN-' + Date.now(),
      category: category || 'Điện thoại',
      purchaseDate: new Date(),
      warrantyPeriodMonths: 12,
      warrantyExpiryDate: new Date(Date.now() + 365*24*60*60*1000),
      issueDescription: issueDescription || 'Yêu cầu bảo hành',
      status: 'Tiếp nhận',
      technicianNotes: note + ' (Chế độ Demo/Offline)',
      repairCost: 0,
      receivedDate: new Date()
    });

    return res.redirect(`${redirectBase}?success=${encodeURIComponent(`Đã khởi tạo yêu cầu bảo hành [${code}] thành công!`)}`);
  }

  // Chế độ Online khi MongoDB đã kết nối:
  try {
    const existing = await Warranty.findOne({ warrantyCode: code });
    if (existing) {
      return res.redirect(`${redirectBase}?error=${encodeURIComponent(`Mã bảo hành [${code}] đã tồn tại trong hệ thống!`)}`);
    }

    const pDate = purchaseDate ? new Date(purchaseDate) : new Date();
    const period = parseInt(warrantyPeriodMonths, 10) || 12;
    const expiryDate = new Date(pDate);
    expiryDate.setMonth(expiryDate.getMonth() + period);

    const newWarranty = new Warranty({
      warrantyCode: code,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      productName,
      productSerial: productSerial ? productSerial.trim().toUpperCase() : '',
      category: category || 'Điện thoại',
      purchaseDate: pDate,
      warrantyPeriodMonths: period,
      warrantyExpiryDate: expiryDate,
      issueDescription,
      status: status || 'Tiếp nhận',
      technicianNotes: note,
      repairCost: repairCost ? Number(repairCost) : 0,
      receivedDate: new Date()
    });

    await newWarranty.save();
    res.redirect(`${redirectBase}?success=${encodeURIComponent(`Đã tiếp nhận hồ sơ bảo hành mới với mã [${code}] thành công!`)}`);
  } catch (err) {
    console.error('Lỗi khi tạo hồ sơ bảo hành:', err);
    res.redirect(`${redirectBase}?error=${encodeURIComponent('Lỗi khi tạo hồ sơ: ' + err.message)}`);
  }
});

/**
 * POST /warranty/update/:id : Cập nhật trạng thái & ghi chú kỹ thuật
 */
router.post('/warranty/update/:id', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.redirect('/?error=Chưa kết nối CSDL MongoDB! Vui lòng khởi động MongoDB để cập nhật dữ liệu.');
  }

  try {
    const { id } = req.params;
    const { status, technicianNotes, repairCost } = req.body;

    const updateData = {
      status,
      technicianNotes,
      repairCost: repairCost ? Number(repairCost) : 0
    };

    if (['Đã sửa xong', 'Đã trả khách'].includes(status)) {
      updateData.completedDate = new Date();
    }

    await Warranty.findByIdAndUpdate(id, updateData);
    res.redirect('/?success=Cập nhật tiến độ bảo hành thành công!');
  } catch (err) {
    console.error('Lỗi khi cập nhật hồ sơ:', err);
    res.redirect(`/?error=Lỗi khi cập nhật: ${encodeURIComponent(err.message)}`);
  }
});

/**
 * POST /warranty/delete/:id : Xóa hồ sơ bảo hành
 */
router.post('/warranty/delete/:id', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.redirect('/?error=Chưa kết nối CSDL MongoDB! Vui lòng khởi động MongoDB để xóa dữ liệu.');
  }

  try {
    const { id } = req.params;
    await Warranty.findByIdAndDelete(id);
    res.redirect('/?success=Đã xóa hồ sơ bảo hành thành công!');
  } catch (err) {
    console.error('Lỗi khi xóa hồ sơ:', err);
    res.redirect(`/?error=Lỗi khi xóa hồ sơ: ${encodeURIComponent(err.message)}`);
  }
});

module.exports = router;
