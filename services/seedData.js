const { hashPassword } = require('../middleware/auth');

const addDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const addHours = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000);

function buildTimelineForStatus(status, baseDate = new Date()) {
  const stepMap = {
    'Tiếp nhận': 1,
    'Đang kiểm tra': 2,
    'Chờ linh kiện': 3,
    'Chờ duyệt': 3,
    'Đang sửa chữa': 4,
    'Đã sửa xong': 5,
    'Đã trả khách': 6,
    'Từ chối bảo hành': 2
  };
  const current = stepMap[status] || 1;
  const defs = [
    { step: 1, title: 'Tiếp nhận hồ sơ & Thiết bị', desc: 'Ghi nhận thông tin phiếu bảo hành và kiểm tra ngoại quan ban đầu.' },
    { step: 2, title: 'Chẩn đoán kỹ thuật chuyên sâu', desc: 'Kỹ thuật viên đo kiểm phần cứng và xác định nguyên nhân lỗi.' },
    { step: 3, title: 'Điều phối linh kiện & Phê duyệt', desc: 'Đối chiếu điều kiện bảo hành và xuất kho linh kiện chính hãng.' },
    { step: 4, title: 'Sửa chữa & Thay thế linh kiện', desc: 'Tiến hành thay thế module lỗi theo quy chuẩn kỹ thuật hãng.' },
    { step: 5, title: 'Kiểm định chất lượng (QC)', desc: 'Chạy bài kiểm tra hiệu năng, nhiệt độ và độ ổn định 100%.' },
    { step: 6, title: 'Bàn giao thiết bị hoàn tất', desc: 'Hoàn trả thiết bị cho khách hàng kèm biên bản nghiệm thu điện tử.' }
  ];

  return defs.map((d, idx) => {
    let state = 'pending';
    if (status === 'Đã trả khách') {
      state = 'completed';
    } else if (d.step < current) {
      state = 'completed';
    } else if (d.step === current) {
      state = 'active';
    }
    return {
      step: d.step,
      title: d.title,
      description: status === 'Từ chối bảo hành' && d.step === 2
        ? 'Thiết bị không đủ điều kiện bảo hành miễn phí theo quy định hãng.'
        : d.desc,
      actor: d.step === 1 ? 'Quầy Tiếp Nhận' : 'Phòng Kỹ Thuật WarrantyOps',
      state,
      timestamp: new Date(new Date(baseDate).getTime() + idx * 2 * 60 * 60 * 1000)
    };
  });
}

function createInitialSeed() {
  const users = [
    {
      _id: 'usr_admin_01',
      customerCode: 'ADM-0001',
      fullname: 'Quản trị viên hệ thống',
      email: 'admin@warrantyops.com',
      phone: '0900000001',
      passwordHash: hashPassword('admin123'),
      role: 'admin',
      address: 'Tầng 2, Tòa Technosoft, Phố Duy Tân, Cầu Giấy, Hà Nội',
      tier: 'Administrator',
      loyaltyPoints: 9999,
      staffCode: 'ADM-01',
      isActive: true
    },
    {
      _id: 'usr_cust_01',
      customerCode: 'KH-10294',
      fullname: 'Trần Anh Tuấn',
      email: 'tuan.tran@gmail.com',
      phone: '0912345891',
      passwordHash: hashPassword('123456'),
      role: 'customer',
      address: 'Số 45 Trần Thái Tông, Cầu Giấy, Hà Nội',
      tier: 'VIP Gold',
      loyaltyPoints: 1450,
      isActive: true
    },
    {
      _id: 'usr_cust_02',
      customerCode: 'KH-10296',
      fullname: 'Đặng Thảo Vy',
      email: 'thaovy@gmail.com',
      phone: '0903456889',
      passwordHash: hashPassword('123456'),
      role: 'customer',
      address: '204 Phan Văn Trị, Phường 11, Bình Thạnh, TP. Hồ Chí Minh',
      tier: 'Member',
      loyaltyPoints: 620,
      isActive: true
    }
  ];

  const customers = [
    {
      _id: 'cust_001',
      customerCode: 'KH-10294',
      shortId: '1094',
      fullName: 'Trần Anh Tuấn',
      phone: '0912.345.891',
      email: 'tuan.tran@gmail.com',
      customerType: 'vip',
      rank: 'A+',
      idNumber: '001092018821',
      city: 'Hà Nội',
      address: 'Số 45 Trần Thái Tông, Cầu Giấy, Hà Nội',
      status: 'active',
      assignedSpecialist: { name: 'Nguyễn Hoàng Long', ext: '104', phone: '0909.104.888' },
      notes: [
        {
          _id: 'note_01',
          authorName: 'Nguyễn Hoàng Long',
          authorRole: 'Chuyên viên VIP Care',
          content: 'Khách hàng ưu tiên nhận máy trong giờ hành chính, cần chuẩn bị sẵn máy laptop dự phòng khi sửa quá 24h.',
          createdAt: addDays(-5)
        },
        {
          _id: 'note_02',
          authorName: 'Lê Minh Trí',
          authorRole: 'Trưởng nhóm Kỹ thuật',
          content: 'Đã xác nhận gói ProSupport Plus còn hiệu lực cho máy Dell XPS 15 9530.',
          createdAt: addDays(-1)
        }
      ],
      auditLogs: [
        { _id: 'aud_01', action: 'Tạo phiếu RMA #TKT-2024-8891', description: 'Tiếp nhận kiểm tra lỗi cáp màn hình eDP Dell XPS 15', actor: 'Quầy Tiếp Nhận HN', createdAt: addHours(-2) },
        { _id: 'aud_02', action: 'Kích hoạt bảo hành #WB-2023-4401', description: 'Đăng ký màn hình Dell UltraSharp U2723QE', actor: 'Hệ thống Web', createdAt: addDays(-120) },
        { _id: 'aud_03', action: 'Nâng hạng VIP Enterprise (A+)', description: 'Đạt mốc 3 thiết bị chính hãng đang quản lý', actor: 'CRM Auto-Rule', createdAt: addDays(-180) }
      ],
      joinedAt: addDays(-420)
    },
    {
      _id: 'cust_002',
      customerCode: 'KH-10295',
      shortId: '1095',
      fullName: 'Lê Hoàng Nam',
      phone: '0988.776.890',
      email: 'nam.le@gmail.com',
      customerType: 'canhan',
      rank: 'A',
      idNumber: '079095004312',
      city: 'TP. Hồ Chí Minh',
      address: '112 Lê Lợi, Bến Thành, Quận 1, TP. Hồ Chí Minh',
      status: 'active',
      assignedSpecialist: { name: 'Trần Thu Hà', ext: '108', phone: '0909.108.888' },
      notes: [
        {
          _id: 'note_03',
          authorName: 'Trần Thu Hà',
          authorRole: 'CSKH TP.HCM',
          content: 'Đã thông báo lịch về linh kiện cụm sạc iPhone 15 Pro Max qua Zalo.',
          createdAt: addHours(-5)
        }
      ],
      auditLogs: [
        { _id: 'aud_04', action: 'Tạo phiếu RMA #TKT-2024-8890', description: 'Tiếp nhận kiểm tra cổng sạc Type-C', actor: 'Trạm Q.1 HCM', createdAt: addHours(-6) }
      ],
      joinedAt: addDays(-355)
    },
    {
      _id: 'cust_003',
      customerCode: 'KH-10296',
      shortId: '1096',
      fullName: 'Đặng Thảo Vy',
      phone: '0903.456.889',
      email: 'thaovy@gmail.com',
      customerType: 'canhan',
      rank: 'A',
      idNumber: '079198009110',
      city: 'TP. Hồ Chí Minh',
      address: '204 Phan Văn Trị, Phường 11, Bình Thạnh, TP. Hồ Chí Minh',
      status: 'active',
      assignedSpecialist: { name: 'Trần Thu Hà', ext: '108', phone: '0909.108.888' },
      notes: [],
      auditLogs: [
        { _id: 'aud_05', action: 'Đăng ký thiết bị MacBook Air M2', description: 'Kích hoạt bảo hành điện tử qua cổng Web', actor: 'Đặng Thảo Vy', createdAt: addDays(-237) }
      ],
      joinedAt: addDays(-240)
    },
    {
      _id: 'cust_004',
      customerCode: 'KH-10297',
      shortId: '1097',
      fullName: 'Vũ Tiến Dũng',
      phone: '0976.223.888',
      email: 'dung.vu@gmail.com',
      customerType: 'canhan',
      rank: 'B+',
      idNumber: '001094022918',
      city: 'Hà Nội',
      address: '88 Lê Văn Lương, Nhân Chính, Thanh Xuân, Hà Nội',
      status: 'active',
      assignedSpecialist: { name: 'Nguyễn Hoàng Long', ext: '104', phone: '0909.104.888' },
      notes: [],
      auditLogs: [],
      joinedAt: addDays(-363)
    },
    {
      _id: 'cust_005',
      customerCode: 'KH-10298',
      shortId: '1098',
      fullName: 'Phạm Hải Yến',
      phone: '0934.112.887',
      email: 'yen.pham@gmail.com',
      customerType: 'canhan',
      rank: 'A',
      idNumber: '048196003215',
      city: 'Đà Nẵng',
      address: '54 Bạch Đằng, Thạch Thang, Hải Châu, Đà Nẵng',
      status: 'active',
      assignedSpecialist: { name: 'Lê Văn Minh', ext: '112', phone: '0909.112.888' },
      notes: [],
      auditLogs: [],
      joinedAt: addDays(-180)
    },
    {
      _id: 'cust_006',
      customerCode: 'KH-10299',
      shortId: '1099',
      fullName: 'Công ty CP Công Nghệ Next',
      phone: '024.3889.9988',
      email: 'it-admin@nextcorp.vn',
      customerType: 'daily',
      rank: 'A+',
      idNumber: 'MST-0108923411',
      city: 'Hà Nội',
      address: 'Tầng 12, Keangnam Landmark, Nam Từ Liêm, Hà Nội',
      status: 'active',
      assignedSpecialist: { name: 'Nguyễn Hoàng Long', ext: '104', phone: '0909.104.888' },
      notes: [
        {
          _id: 'note_04',
          authorName: 'Nguyễn Hoàng Long',
          authorRole: 'Quản lý Đại lý',
          content: 'Đối tác doanh nghiệp hợp đồng SLA 24h tận nơi.',
          createdAt: addDays(-30)
        }
      ],
      auditLogs: [],
      joinedAt: addDays(-510)
    }
  ];

  const products = [
    {
      _id: 'prd_001',
      sku: 'LAP-DELL-XPS15',
      subSku: 'Rev: 2024-OLED',
      lotCode: 'LOT-2024-Q1',
      name: 'Dell XPS 15 9530 OLED (i9-13900H / 32GB)',
      category: 'laptop',
      categoryLabel: 'Laptop & Máy trạm',
      specs: 'Intel Core i9-13900H • 32GB DDR5 • 1TB SSD • 15.6" 3.5K OLED • RTX 4060',
      imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
      serialType: 'SN',
      serialSample: 'DLXPS-99281-VN',
      warrantyMonths: 24,
      warrantyPolicyName: 'Dell ProSupport Plus 24/7',
      price: 54990000,
      releaseDate: addDays(-400),
      businessStatus: 'selling',
      soldCount: 420,
      commonFaultPart: 'Cáp màn hình eDP / Tấm nền OLED',
      commitText: 'Thay thế linh kiện chính hãng tận nơi trong 24–48h làm việc',
      exclusionText: 'Loại trừ: Can thiệp phần cứng ngoài hệ thống ủy quyền.',
      benefits: [
        { title: 'Tấm nền OLED 3.5K', badge: 'ĐƯỢC BẢO HÀNH', badgeType: 'orange', desc: 'Bảo hành điểm chết > 3 điểm, sọc hiển thị, cáp tín hiệu eDP.' },
        { title: 'Bo mạch chủ & GPU RTX 4060', badge: 'ĐƯỢC BẢO HÀNH', badgeType: 'orange', desc: 'Bảo hành toàn diện chipset, mạch nguồn và cổng Thunderbolt 4.' },
        { title: 'Pin dung lượng 86Wh', badge: 'ĐỔI MỚI 1:1', badgeType: 'dark', desc: 'Đổi pin mới nếu chai vượt 25% trong 12 tháng đầu.' }
      ]
    },
    {
      _id: 'prd_002',
      sku: 'LAP-MAC-M3PRO14',
      subSku: 'Rev: A2992-VN',
      lotCode: 'LOT-2024-Q2',
      name: 'MacBook Pro 14" M3 Pro (18GB / 512GB)',
      category: 'laptop',
      categoryLabel: 'Laptop & Máy trạm',
      specs: 'Apple M3 Pro 11-core • 18GB Unified • 512GB SSD • Liquid Retina XDR',
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
      serialType: 'SN',
      serialSample: 'APMAC-77402-PRO',
      warrantyMonths: 36,
      warrantyPolicyName: 'AppleCare+ Enterprise 36T',
      price: 49990000,
      releaseDate: addDays(-340),
      businessStatus: 'selling',
      soldCount: 580,
      commonFaultPart: 'Cơ cấu phím Magic Keyboard',
      commitText: 'Bảo hành chuẩn AASP toàn quốc với linh kiện Apple chính hãng',
      exclusionText: 'Loại trừ: Thiết bị khóa kích hoạt iCloud không chính chủ.',
      benefits: [
        { title: 'Màn hình Liquid Retina XDR', badge: 'ĐƯỢC BẢO HÀNH', badgeType: 'orange', desc: 'Bảo hành ProMotion 120Hz, đèn nền Mini-LED và cáp màn hình.' },
        { title: 'Logic Board & Chip M3 Pro', badge: 'ĐƯỢC BẢO HÀNH', badgeType: 'orange', desc: 'Thay thế nguyên cụm bo mạch chính hãng Apple.' },
        { title: 'Magic Keyboard & Touch ID', badge: 'ĐỔI MỚI 1:1', badgeType: 'dark', desc: 'Xử lý kẹt phím, lún phím và cảm biến vân tay.' }
      ]
    },
    {
      _id: 'prd_003',
      sku: 'PHN-SAM-S24U',
      subSku: 'Rev: SM-S928B',
      lotCode: 'LOT-2024-Q1',
      name: 'Samsung Galaxy S24 Ultra 5G 256GB',
      category: 'phone',
      categoryLabel: 'Điện thoại & Tablet',
      specs: 'Snapdragon 8 Gen 3 • 12GB RAM • 256GB • Dynamic AMOLED 2X • S-Pen',
      imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
      serialType: 'IMEI',
      serialSample: 'SSGAL-33109-ULT',
      warrantyMonths: 12,
      warrantyPolicyName: 'Samsung Care+ Toàn diện',
      price: 29990000,
      releaseDate: addDays(-300),
      businessStatus: 'selling',
      soldCount: 790,
      commonFaultPart: 'Module chống rung OIS Camera Tele',
      commitText: 'Tiếp nhận ưu tiên và hoàn trả trong 24h tại các trạm trung tâm',
      exclusionText: 'Loại trừ: Biến dạng khung Titan do va đập cơ học vượt ngưỡng.',
      benefits: [
        { title: 'Màn hình Dynamic AMOLED 2X', badge: 'ĐƯỢC BẢO HÀNH', badgeType: 'orange', desc: 'Bảo hành cảm ứng, sọc màn hình và tần số quét 120Hz.' },
        { title: 'Cụm Camera 200MP & Tele OIS', badge: 'ĐƯỢC BẢO HÀNH', badgeType: 'orange', desc: 'Cân chỉnh và thay mới module lấy nét quang học.' },
        { title: 'Bút S-Pen Bluetooth', badge: 'ĐỔI MỚI 1:1', badgeType: 'dark', desc: 'Đổi mới bút S-Pen nếu lỗi kết nối Bluetooth.' }
      ]
    },
    {
      _id: 'prd_004',
      sku: 'PHN-APL-IP15PM',
      subSku: 'Rev: A3106-VN',
      lotCode: 'LOT-2023-Q4',
      name: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên',
      category: 'phone',
      categoryLabel: 'Điện thoại & Tablet',
      specs: 'Apple A17 Pro • 256GB • Super Retina XDR 6.7" • USB-C',
      imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
      serialType: 'IMEI',
      serialSample: '3589211029',
      warrantyMonths: 12,
      warrantyPolicyName: 'Bảo hành chính hãng Apple VN/A 12T',
      price: 31990000,
      releaseDate: addDays(-370),
      businessStatus: 'selling',
      soldCount: 950,
      commonFaultPart: 'Cụm cổng sạc USB-C & Mic dưới',
      commitText: 'Kiểm định chuẩn Apple Diagnostics trong 2 giờ làm việc',
      exclusionText: 'Loại trừ: Vào chất lỏng hoặc cấn vỡ kính lưng.',
      benefits: [
        { title: 'Màn hình OLED ProMotion', badge: 'ĐƯỢC BẢO HÀNH', badgeType: 'orange', desc: 'Bảo hành cảm ứng và hiển thị chính hãng.' },
        { title: 'Cụm cổng sạc Type-C & Nguồn', badge: 'ĐƯỢC BẢO HÀNH', badgeType: 'orange', desc: 'Thay thế cáp nguồn / cổng sạc chính hãng.' }
      ]
    },
    {
      _id: 'prd_005',
      sku: 'MON-DELL-U2723QE',
      subSku: 'Rev: A03-IPS',
      lotCode: 'LOT-2023-Q3',
      name: 'Dell UltraSharp U2723QE 27" 4K IPS Black',
      category: 'monitor',
      categoryLabel: 'Màn hình đồ họa',
      specs: '27" 4K UHD • IPS Black 2000:1 • 98% DCI-P3 • USB-C Hub 90W',
      imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
      serialType: 'SN',
      serialSample: 'SN-DU27-44019-VN',
      warrantyMonths: 36,
      warrantyPolicyName: 'Premium Panel Exchange 36T',
      price: 13890000,
      releaseDate: addDays(-480),
      businessStatus: 'selling',
      soldCount: 640,
      commonFaultPart: 'Cổng USB-C Power Delivery 90W',
      commitText: 'Đổi mới tấm nền trong 24h nếu phát sinh từ 01 điểm sáng chết',
      exclusionText: 'Loại trừ: Nứt vỡ tấm nền vật lý hoặc chập sét lan truyền.',
      benefits: [
        { title: 'Tấm nền IPS Black 4K', badge: 'ĐỔI MỚI 1:1', badgeType: 'orange', desc: 'Cam kết Premium Panel Exchange chính hãng 36 tháng.' },
        { title: 'Bo mạch USB-C Hub 90W & RJ45', badge: 'ĐƯỢC BẢO HÀNH', badgeType: 'orange', desc: 'Bảo hành toàn bộ cổng kết nối và mạch nguồn tích hợp.' }
      ]
    },
    {
      _id: 'prd_006',
      sku: 'GEAR-LEO-FC900R',
      subSku: 'Rev: PD-MXBLUE',
      lotCode: 'LOT-2022-KR',
      name: 'Leopold FC900R PD White Grey (Cherry MX)',
      category: 'component',
      categoryLabel: 'Phụ kiện & Linh kiện',
      specs: 'Fullsize 104 phím • PBT Double-Shot • Switch Cherry MX Blue • Mini-USB',
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
      serialType: 'SN',
      serialSample: 'SN-LP90-11209-KR',
      warrantyMonths: 24,
      warrantyPolicyName: 'Bảo hành nhà phân phối 24T',
      price: 3450000,
      releaseDate: addDays(-850),
      businessStatus: 'stop',
      soldCount: 310,
      commonFaultPart: 'Switch Cherry MX / Mạch nhận phím',
      commitText: 'Hỗ trợ bảo trì và thay switch trọn đời sản phẩm',
      exclusionText: 'Loại trừ: Đổ chất lỏng hoặc tự ý hàn mod mạch sai quy cách.',
      benefits: [
        { title: 'Bo mạch PCB & Controller', badge: 'HỖ TRỢ DỊCH VỤ', badgeType: 'dark', desc: 'Kiểm tra và phục hồi đường mạch tín hiệu.' },
        { title: 'Switch Cherry MX Đức', badge: 'THAY THẾ ƯU ĐÃI', badgeType: 'dark', desc: 'Giảm 30% chi phí thay thế switch lẻ cho thành viên.' }
      ]
    }
  ];

  const warrantyRecords = [
    {
      _id: 'wr_001',
      wbCode: 'WB-2024-8812',
      serialNumber: 'DLXPS-99281-VN',
      modelCode: 'XPS-9530-2024',
      productSku: 'LAP-DELL-XPS15',
      productName: 'Dell XPS 15 9530 OLED (i9-13900H / 32GB)',
      category: 'Laptop/Máy tính',
      categoryTag: 'MÁY TÍNH XÁCH TAY CAO CẤP',
      origin: 'Chính hãng',
      customerCode: 'KH-10294',
      customerName: 'Trần Anh Tuấn',
      customerPhone: '0912.345.891',
      customerEmail: 'tuan.tran@gmail.com',
      customerAddress: 'Số 45 Trần Thái Tông, Cầu Giấy, Hà Nội',
      purchaseDate: addDays(-360),
      activatedAt: addDays(-359),
      endDate: addDays(5),
      periodMonths: 12,
      packageName: 'ProSupport Plus tận nơi 24/7',
      packageDesc: 'Kỹ thuật viên kiểm tra tận nơi trong 4 giờ, hỗ trợ máy dự phòng khi chờ linh kiện.',
      purchasePlace: 'Đại lý ủy quyền Dell Việt Nam',
      activationChannel: 'QR',
      statusOverride: '',
      voidReason: '',
      notes: 'Thiết bị VIP cần lưu ý sắp hết hạn 12 tháng đầu.',
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
      commitText: 'Thay thế linh kiện chính hãng tại nhà trong 48–72h làm việc',
      exclusionText: 'Loại trừ: Rơi vỡ biến dạng, cấn móp vỏ nhôm ngoài phạm vi gói.',
      benefits: products[0].benefits,
      renewalHistory: []
    },
    {
      _id: 'wr_002',
      wbCode: 'WB-2023-4401',
      serialNumber: 'SN-DU27-44019-VN',
      modelCode: 'U2723QE-4K-IPS',
      productSku: 'MON-DELL-U2723QE',
      productName: 'Dell UltraSharp U2723QE IPS Black',
      category: 'Màn hình',
      categoryTag: 'MÀN HÌNH CHUYÊN NGHIỆP 4K',
      origin: 'Chính hãng',
      customerCode: 'KH-10294',
      customerName: 'Trần Anh Tuấn',
      customerPhone: '0912.345.891',
      customerEmail: 'tuan.tran@gmail.com',
      customerAddress: 'Số 45 Trần Thái Tông, Cầu Giấy, Hà Nội',
      purchaseDate: addDays(-365),
      activatedAt: addDays(-365),
      endDate: addDays(730),
      periodMonths: 36,
      packageName: 'Tiêu chuẩn hãng 36 tháng (Premium Panel)',
      packageDesc: 'Đổi mới trực tiếp trong 24h nếu xuất hiện từ 01 điểm sáng chết.',
      purchasePlace: 'Đại lý ủy quyền Dell Việt Nam',
      activationChannel: 'API',
      statusOverride: '',
      voidReason: '',
      notes: '',
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
      commitText: products[4].commitText,
      exclusionText: products[4].exclusionText,
      benefits: products[4].benefits,
      renewalHistory: []
    },
    {
      _id: 'wr_003',
      wbCode: 'WB-2022-1120',
      serialNumber: 'SN-LP90-11209-KR',
      modelCode: 'FC900R-PD-WGY',
      productSku: 'GEAR-LEO-FC900R',
      productName: 'Leopold FC900R PD White Grey',
      category: 'Phụ kiện',
      categoryTag: 'BÀN PHÍM CƠ CHERRY MX BLUE',
      origin: 'Phụ kiện',
      customerCode: 'KH-10294',
      customerName: 'Trần Anh Tuấn',
      customerPhone: '0912.345.891',
      customerEmail: 'tuan.tran@gmail.com',
      customerAddress: 'Số 45 Trần Thái Tông, Cầu Giấy, Hà Nội',
      purchaseDate: addDays(-795),
      activatedAt: addDays(-795),
      endDate: addDays(-65),
      periodMonths: 24,
      packageName: 'Gói cơ sở 24 tháng (Đã hết hạn)',
      packageDesc: 'Hỗ trợ kiểm tra kỹ thuật và thay switch ưu đãi 30% phí linh kiện.',
      purchasePlace: 'Hệ thống Gaming Gear chính hãng',
      activationChannel: 'WEB',
      statusOverride: '',
      voidReason: '',
      notes: 'Có thể gia hạn gói bảo dưỡng mở rộng.',
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
      commitText: products[5].commitText,
      exclusionText: products[5].exclusionText,
      benefits: products[5].benefits,
      renewalHistory: []
    },
    {
      _id: 'wr_004',
      wbCode: 'WB-2023-7740',
      serialNumber: 'APMAC-77402-PRO',
      modelCode: 'A2992-M3PRO',
      productSku: 'LAP-MAC-M3PRO14',
      productName: 'MacBook Pro 14" M3 Pro (2023)',
      category: 'Laptop/Máy tính',
      categoryTag: 'APPLE MACBOOK PRO',
      origin: 'Chính hãng',
      customerCode: 'KH-10296',
      customerName: 'Đặng Thảo Vy',
      customerPhone: '0903.456.889',
      customerEmail: 'thaovy@gmail.com',
      customerAddress: '204 Phan Văn Trị, Phường 11, Bình Thạnh, TP. Hồ Chí Minh',
      purchaseDate: addDays(-360),
      activatedAt: addDays(-360),
      endDate: addDays(735),
      periodMonths: 36,
      packageName: 'AppleCare+ Enterprise 24/7',
      packageDesc: 'Bảo hành toàn cầu tại mọi trung tâm ủy quyền Apple.',
      purchasePlace: 'Apple Store Trực tuyến',
      activationChannel: 'API',
      statusOverride: '',
      voidReason: '',
      notes: '',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
      commitText: products[1].commitText,
      exclusionText: products[1].exclusionText,
      benefits: products[1].benefits,
      renewalHistory: []
    },
    {
      _id: 'wr_005',
      wbCode: 'WB-2024-3310',
      serialNumber: 'SSGAL-33109-ULT',
      modelCode: 'SM-S928B/DS',
      productSku: 'PHN-SAM-S24U',
      productName: 'Samsung Galaxy S24 Ultra 5G',
      category: 'Điện thoại',
      categoryTag: 'ĐIỆN THOẠI FLAGSHIP',
      origin: 'Chính hãng',
      customerCode: 'KH-10297',
      customerName: 'Vũ Tiến Dũng',
      customerPhone: '0976.223.888',
      customerEmail: 'dung.vu@gmail.com',
      customerAddress: '88 Lê Văn Lương, Nhân Chính, Thanh Xuân, Hà Nội',
      purchaseDate: addDays(-363),
      activatedAt: addDays(-363),
      endDate: addDays(2),
      periodMonths: 12,
      packageName: 'Samsung Care+ Toàn diện 24/7',
      packageDesc: 'Tiếp nhận và giao trả thiết bị tận nơi miễn phí.',
      purchasePlace: 'Samsung Experience Store',
      activationChannel: 'QR',
      statusOverride: '',
      voidReason: '',
      notes: 'Cận hạn 2 ngày — cần ưu tiên xử lý.',
      image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
      commitText: products[2].commitText,
      exclusionText: products[2].exclusionText,
      benefits: products[2].benefits,
      renewalHistory: []
    },
    {
      _id: 'wr_006',
      wbCode: 'WB-2024-5520',
      serialNumber: '3589211029',
      modelCode: 'A3106-VN',
      productSku: 'PHN-APL-IP15PM',
      productName: 'iPhone 15 Pro Max 256GB',
      category: 'Điện thoại',
      categoryTag: 'IPHONE CHÍNH HÃNG VN/A',
      origin: 'Chính hãng',
      customerCode: 'KH-10295',
      customerName: 'Lê Hoàng Nam',
      customerPhone: '0988.776.890',
      customerEmail: 'nam.le@gmail.com',
      customerAddress: '112 Lê Lợi, Bến Thành, Quận 1, TP. Hồ Chí Minh',
      purchaseDate: addDays(-351),
      activatedAt: addDays(-351),
      endDate: addDays(14),
      periodMonths: 12,
      packageName: 'Bảo hành Apple VN/A 12 tháng',
      packageDesc: 'Bảo hành phần cứng chính hãng tại hệ thống ủy quyền.',
      purchasePlace: 'FPT Shop Quận 1',
      activationChannel: 'API',
      statusOverride: '',
      voidReason: '',
      notes: '',
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
      commitText: products[3].commitText,
      exclusionText: products[3].exclusionText,
      benefits: products[3].benefits,
      renewalHistory: []
    },
    {
      _id: 'wr_007',
      wbCode: 'WB-2024-9904',
      serialNumber: 'SN-VOID-77210',
      modelCode: 'XPS-9320-PLUS',
      productSku: 'LAP-DELL-XPS15',
      productName: 'Dell XPS 13 Plus 9320',
      category: 'Laptop/Máy tính',
      categoryTag: 'ULTRABOOK',
      origin: 'Chính hãng',
      customerCode: 'KH-10299',
      customerName: 'Công ty CP Công Nghệ Next',
      customerPhone: '024.3889.9988',
      customerEmail: 'it-admin@nextcorp.vn',
      customerAddress: 'Tầng 12, Keangnam Landmark, Nam Từ Liêm, Hà Nội',
      purchaseDate: addDays(-200),
      activatedAt: addDays(-200),
      endDate: addDays(165),
      periodMonths: 12,
      packageName: 'Tiêu chuẩn hãng 12 tháng',
      packageDesc: 'Đã từ chối điều kiện bảo hành miễn phí do ngấm chất lỏng.',
      purchasePlace: 'Đại lý doanh nghiệp B2B',
      activationChannel: 'ADMIN',
      statusOverride: 'rejected',
      voidReason: 'Quỳ tím đổi màu do chất lỏng xâm nhập bo mạch nguồn',
      notes: 'Chuyển sang diện hỗ trợ sửa chữa dịch vụ có tính phí.',
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
      commitText: 'Chuyển sang dịch vụ sửa chữa ngoài bảo hành',
      exclusionText: 'Đã ghi nhận biên bản từ chối bảo hành miễn phí.',
      benefits: [],
      renewalHistory: []
    }
  ];

  const warranties = [
    {
      _id: 'tkt_001',
      warrantyCode: 'TKT-2024-8891',
      customerCode: 'KH-10294',
      customerName: 'Trần Anh Tuấn',
      customerPhone: '0912.345.891',
      customerEmail: 'tuan.tran@gmail.com',
      customerAddress: 'Số 45 Trần Thái Tông, Cầu Giấy, Hà Nội',
      productSku: 'LAP-DELL-XPS15',
      productName: 'Dell XPS 15 9530 OLED',
      productSerial: 'DLXPS-99281-VN',
      category: 'Laptop/Máy tính',
      servicePackage: 'ProSupport Plus tận nơi 24/7',
      purchaseDate: addDays(-360),
      warrantyPeriodMonths: 12,
      warrantyExpiryDate: addDays(5),
      issueCategories: ['Màn hình / Hiển thị'],
      issueDescription: 'Sọc màn hình dọc, chớp nháy khi mở gập bản lề góc 90 độ',
      faultCategory: 'screen',
      rootCauseType: 'oem_defect',
      attachments: [
        { filename: 'anh_soc_man_hinh_oled.jpg', fileType: 'image', sizeLabel: '2.1 MB', url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=500&q=80' },
        { filename: 'tem_serial_day_may.jpg', fileType: 'image', sizeLabel: '1.4 MB', url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=500&q=80' }
      ],
      pickupMode: 'onsite',
      preferredTime: 'Buổi sáng (08:30 - 11:30)',
      customerDeliveryNotes: 'Gọi trước 15 phút tại sảnh tòa nhà.',
      borrowLaptop: true,
      priority: 'urgent_24h',
      slaHours: 24,
      slaDeadline: addHours(14),
      status: 'Đang kiểm tra',
      assignedBranch: {
        code: 'HN-CG',
        name: 'Trạm Hà Nội — Cầu Giấy',
        address: 'Tầng 2, Tòa Technosoft, Phố Duy Tân, Cầu Giấy, Hà Nội'
      },
      assignedTechnician: {
        code: 'KTV-01',
        name: 'Lê Minh Trí',
        level: 'Bậc 5/5',
        branch: 'TTBH Hà Nội'
      },
      errorCode: 'ERR_EDP_SIGNAL_LOSS',
      repairLevel: 'Level 2 — Thay cáp eDP & cụm màn hình',
      repairCost: 0,
      technicianNotes: 'Đo kiểm phát hiện suy hao tín hiệu cáp eDP tại cổ bản lề. Đủ điều kiện bảo hành miễn phí 100%.',
      internalTechNotes: 'Ưu tiên xuất kho cáp eDP zin mã LK-DELL-9530-EDP trong ca chiều.',
      replacementParts: [
        {
          partCode: 'LK-DELL-9530-EDP',
          partName: 'Cáp tín hiệu màn hình eDP 40-pin OLED',
          spec: 'OEM Dell Part #0X992A',
          quantity: 1,
          warehouseLocation: 'Kho Cầu Giấy (Còn 04 sợi)',
          stockQty: 4,
          coveragePolicy: 'Miễn phí 100% (ProSupport+)',
          issued: true,
          unitPrice: 1450000,
          customerPrice: 0
        },
        {
          partCode: 'SRV-DIAG-L2',
          partName: 'Công kiểm định & Cân chỉnh màu sắc 100% DCI-P3',
          spec: 'Quy trình chuẩn ISO-9001',
          quantity: 1,
          warehouseLocation: 'Phòng Lab HN',
          stockQty: 99,
          coveragePolicy: 'Miễn phí theo gói BH',
          issued: true,
          unitPrice: 350000,
          customerPrice: 0
        }
      ],
      timelineSteps: buildTimelineForStatus('Đang kiểm tra', addHours(-6)),
      messages: [
        {
          _id: 'msg_001',
          senderRole: 'technician',
          senderName: 'KTV Lê Minh Trí',
          text: 'Chào anh Tuấn, phòng kỹ thuật đã tiếp nhận máy Dell XPS 15 và xác định lỗi cáp tín hiệu eDP. Linh kiện thay thế được miễn phí 100% theo gói ProSupport+.',
          channels: ['Web Chat', 'Zalo ZNS'],
          createdAt: addHours(-4)
        },
        {
          _id: 'msg_002',
          senderRole: 'customer',
          senderName: 'Trần Anh Tuấn',
          text: 'Cảm ơn kỹ thuật viên, nhờ bên mình kiểm tra kỹ thêm keo tản nhiệt giúp mình nhé.',
          channels: ['Web Chat'],
          createdAt: addHours(-3)
        }
      ],
      csatScore: 5,
      receivedDate: addHours(-6),
      estimatedReturnDate: addHours(18)
    },
    {
      _id: 'tkt_002',
      warrantyCode: 'TKT-2024-8890',
      customerCode: 'KH-10295',
      customerName: 'Lê Hoàng Nam',
      customerPhone: '0988.776.890',
      customerEmail: 'nam.le@gmail.com',
      customerAddress: '112 Lê Lợi, Bến Thành, Quận 1, TP. Hồ Chí Minh',
      productSku: 'PHN-APL-IP15PM',
      productName: 'iPhone 15 Pro Max 256GB',
      productSerial: '3589211029',
      category: 'Điện thoại',
      servicePackage: 'Bảo hành Apple VN/A 12 tháng',
      purchaseDate: addDays(-351),
      warrantyPeriodMonths: 12,
      warrantyExpiryDate: addDays(14),
      issueCategories: ['Nguồn / Sạc pin'],
      issueDescription: 'Không nhận sạc nhanh cáp Type-C, cổng kết nối chập chờn',
      faultCategory: 'power_battery',
      rootCauseType: 'oem_defect',
      attachments: [],
      pickupMode: 'center',
      preferredTime: 'Buổi chiều (13:30 - 17:30)',
      customerDeliveryNotes: '',
      borrowLaptop: false,
      priority: 'standard_48h',
      slaHours: 48,
      slaDeadline: addHours(28),
      status: 'Chờ linh kiện',
      assignedBranch: {
        code: 'HCM-Q1',
        name: 'Trạm TP.HCM — Trung tâm Q.1 / Q.3',
        address: '142 Nguyễn Thị Minh Khai, P. Võ Thị Sáu, Quận 3 (giáp Q.1), TP. Hồ Chí Minh'
      },
      assignedTechnician: {
        code: 'KTV-02',
        name: 'Nguyễn Quốc Bảo',
        level: 'Bậc 4/5',
        branch: 'TTBH TP.HCM'
      },
      errorCode: 'ERR_USBC_PORT_IC',
      repairLevel: 'Level 2 — Cụm cáp sạc dưới',
      repairCost: 0,
      technicianNotes: 'Đang chờ điều chuyển cụm cổng sạc USB-C chính hãng từ kho tổng miền Nam.',
      internalTechNotes: 'Kiện linh kiện về lúc 14:00 chiều nay.',
      replacementParts: [
        {
          partCode: 'LK-IP15PM-USBC',
          partName: 'Cụm cáp sạc USB-C & Microphone dưới zin Apple',
          spec: 'Apple Genuine Service Pack',
          quantity: 1,
          warehouseLocation: 'Kho Trung tâm Q.3 (Đang điều chuyển)',
          stockQty: 2,
          coveragePolicy: 'Miễn phí 100% (Trong hạn BH)',
          issued: false,
          unitPrice: 1850000,
          customerPrice: 0
        }
      ],
      timelineSteps: buildTimelineForStatus('Chờ linh kiện', addHours(-12)),
      messages: [
        {
          _id: 'msg_003',
          senderRole: 'technician',
          senderName: 'KTV Nguyễn Quốc Bảo',
          text: 'Chào anh Nam, trạm Quận 1 đang nhận điều chuyển cụm cổng sạc zin từ kho tổng, dự kiến hoàn tất lắp ráp vào chiều mai.',
          channels: ['Web Chat'],
          createdAt: addHours(-5)
        }
      ],
      csatScore: 5,
      receivedDate: addHours(-12),
      estimatedReturnDate: addHours(24)
    },
    {
      _id: 'tkt_003',
      warrantyCode: 'TKT-2024-8889',
      customerCode: 'KH-10296',
      customerName: 'Đặng Thảo Vy',
      customerPhone: '0903.456.889',
      customerEmail: 'thaovy@gmail.com',
      customerAddress: '204 Phan Văn Trị, Phường 11, Bình Thạnh, TP. Hồ Chí Minh',
      productSku: 'LAP-MAC-M3PRO14',
      productName: 'MacBook Pro 14" M3 Pro (2023)',
      productSerial: 'APMAC-77402-PRO',
      category: 'Laptop/Máy tính',
      servicePackage: 'AppleCare+ Enterprise 24/7',
      purchaseDate: addDays(-360),
      warrantyPeriodMonths: 36,
      warrantyExpiryDate: addDays(735),
      issueCategories: ['Bàn phím / Touchpad'],
      issueDescription: 'Kẹt phím Space và phím Shift trái phản hồi chậm',
      faultCategory: 'other',
      rootCauseType: 'oem_defect',
      attachments: [],
      pickupMode: 'center',
      preferredTime: 'Buổi sáng (08:30 - 11:30)',
      customerDeliveryNotes: '',
      borrowLaptop: false,
      priority: 'standard_48h',
      slaHours: 48,
      slaDeadline: addHours(36),
      status: 'Tiếp nhận',
      assignedBranch: {
        code: 'HCM-BT',
        name: 'Trạm TP.HCM — Bình Thạnh',
        address: '38/45 Ung Văn Khiêm, Phường 25, Bình Thạnh, TP. Hồ Chí Minh'
      },
      assignedTechnician: {
        code: 'KTV-08',
        name: 'Phạm Hoàng Sơn',
        level: 'Bậc 3/5',
        branch: 'TTBH TP.HCM'
      },
      errorCode: 'DIAG_KEYBOARD_SW',
      repairLevel: 'Level 1 — Vệ sinh & Cân chỉnh cơ phím',
      repairCost: 0,
      technicianNotes: 'Mới tiếp nhận máy tại quầy Bình Thạnh, ngoại quan đẹp 99%.',
      internalTechNotes: '',
      replacementParts: [],
      timelineSteps: buildTimelineForStatus('Tiếp nhận', addHours(-2)),
      messages: [],
      csatScore: 5,
      receivedDate: addHours(-2),
      estimatedReturnDate: addHours(30)
    },
    {
      _id: 'tkt_004',
      warrantyCode: 'TKT-2024-8888',
      customerCode: 'KH-10297',
      customerName: 'Vũ Tiến Dũng',
      customerPhone: '0976.223.888',
      customerEmail: 'dung.vu@gmail.com',
      customerAddress: '88 Lê Văn Lương, Nhân Chính, Thanh Xuân, Hà Nội',
      productSku: 'PHN-SAM-S24U',
      productName: 'Samsung Galaxy S24 Ultra 5G',
      productSerial: 'SSGAL-33109-ULT',
      category: 'Điện thoại',
      servicePackage: 'Samsung Care+ Toàn diện 24/7',
      purchaseDate: addDays(-363),
      warrantyPeriodMonths: 12,
      warrantyExpiryDate: addDays(2),
      issueCategories: ['Lỗi phần cứng khác'],
      issueDescription: 'Lỗi lấy nét camera tele x5/x10, rung lắc mô-tơ quang học OIS',
      faultCategory: 'mainboard',
      rootCauseType: 'oem_defect',
      attachments: [],
      pickupMode: 'center',
      preferredTime: 'Trong giờ hành chính (08:30 - 17:30)',
      customerDeliveryNotes: '',
      borrowLaptop: false,
      priority: 'urgent_24h',
      slaHours: 24,
      slaDeadline: addHours(8),
      status: 'Chờ duyệt',
      assignedBranch: {
        code: 'HN-TX',
        name: 'Trạm Hà Nội — Thanh Xuân',
        address: '128 Nguyễn Trãi, P. Thượng Đình, Thanh Xuân, Hà Nội'
      },
      assignedTechnician: {
        code: 'KTV-11',
        name: 'Đỗ Tuấn Kiệt',
        level: 'Bậc 3/5',
        branch: 'TTBH Hà Nội'
      },
      errorCode: 'ERR_CAM_OIS_TELE',
      repairLevel: 'Level 2 — Thay cụm Camera Tele 50MP',
      repairCost: 0,
      technicianNotes: 'Chờ trưởng trạm duyệt xuất cụm camera tiềm vọng chính hãng do máy còn 2 ngày hết hạn.',
      internalTechNotes: 'Đã xác minh kích hoạt Knox hợp lệ trước thời điểm hết hạn.',
      replacementParts: [
        {
          partCode: 'LK-S24U-TELE5X',
          partName: 'Cụm Camera Telephoto 50MP OIS Samsung',
          spec: 'Samsung Original GH96-16420A',
          quantity: 1,
          warehouseLocation: 'Kho Thanh Xuân (Còn 03 cụm)',
          stockQty: 3,
          coveragePolicy: 'Miễn phí 100% (Trong hạn BH)',
          issued: false,
          unitPrice: 2650000,
          customerPrice: 0
        }
      ],
      timelineSteps: buildTimelineForStatus('Chờ duyệt', addHours(-9)),
      messages: [],
      csatScore: 5,
      receivedDate: addHours(-9),
      estimatedReturnDate: addHours(12)
    },
    {
      _id: 'tkt_005',
      warrantyCode: 'TKT-2024-8887',
      customerCode: 'KH-10298',
      customerName: 'Phạm Hải Yến',
      customerPhone: '0934.112.887',
      customerEmail: 'yen.pham@gmail.com',
      customerAddress: '54 Bạch Đằng, Thạch Thang, Hải Châu, Đà Nẵng',
      productSku: 'LAP-DELL-XPS15',
      productName: 'Asus ROG Zephyrus G14',
      productSerial: 'AS-R05014-22',
      category: 'Laptop/Máy tính',
      servicePackage: 'Bảo hành chính hãng 24 tháng',
      purchaseDate: addDays(-155),
      warrantyPeriodMonths: 24,
      warrantyExpiryDate: addDays(575),
      issueCategories: ['Treo máy / Quá nhiệt'],
      issueDescription: 'Quạt tản nhiệt GPU kêu rè lớn, nhiệt độ tải nặng vọt lên 95°C',
      faultCategory: 'power_battery',
      rootCauseType: 'environment',
      attachments: [],
      pickupMode: 'center',
      preferredTime: 'Buổi chiều (13:30 - 17:30)',
      customerDeliveryNotes: '',
      borrowLaptop: false,
      priority: 'standard_48h',
      slaHours: 48,
      slaDeadline: addDays(-1),
      status: 'Đã trả khách',
      assignedBranch: {
        code: 'DN-HC',
        name: 'Trạm Đà Nẵng — Hải Châu',
        address: '36 Đặng Nguyên Cẩn, P. Hòa Cường Bắc, Hải Châu, Đà Nẵng'
      },
      assignedTechnician: {
        code: 'KTV-05',
        name: 'Trần Đình Khôi',
        level: 'Bậc 4/5',
        branch: 'TTBH Đà Nẵng'
      },
      errorCode: 'ERR_FAN_BEARING',
      repairLevel: 'Level 2 — Thay quạt GPU & bảo dưỡng tản nhiệt',
      repairCost: 450000,
      technicianNotes: 'Đã thay quạt tản nhiệt GPU mới, vệ sinh buồng hơi và tra keo kim loại lỏng chuẩn hãng.',
      internalTechNotes: 'Khách đã nghiệm thu nhiệt độ stress-test ổn định 76°C.',
      replacementParts: [
        {
          partCode: 'LK-ROG-G14-FAN',
          partName: 'Quạt tản nhiệt GPU Arc Flow 12V',
          spec: 'OEM Asus ROG Part',
          quantity: 1,
          warehouseLocation: 'Kho Đà Nẵng',
          stockQty: 5,
          coveragePolicy: 'Hỗ trợ phí dịch vụ bảo dưỡng',
          issued: true,
          unitPrice: 450000,
          customerPrice: 450000
        }
      ],
      timelineSteps: buildTimelineForStatus('Đã trả khách', addDays(-3)),
      messages: [
        {
          _id: 'msg_004',
          senderRole: 'technician',
          senderName: 'KTV Trần Đình Khôi',
          text: 'Máy Asus ROG G14 đã hoàn tất thay quạt và kiểm tra nhiệt độ ổn định. Mời chị Yến ghé trạm Hải Châu nhận máy.',
          channels: ['Web Chat', 'SMS'],
          createdAt: addDays(-2)
        }
      ],
      csatScore: 5,
      receivedDate: addDays(-3),
      estimatedReturnDate: addDays(-2),
      completedDate: addDays(-2),
      customerConfirmedAt: addDays(-2)
    },
    {
      _id: 'tkt_006',
      warrantyCode: 'TKT-2024-0102',
      customerCode: 'KH-10294',
      customerName: 'Trần Anh Tuấn',
      customerPhone: '0912.345.891',
      customerEmail: 'tuan.tran@gmail.com',
      customerAddress: 'Số 45 Trần Thái Tông, Cầu Giấy, Hà Nội',
      productSku: 'GEAR-LEO-FC900R',
      productName: 'Leopold FC900R PD White Grey',
      productSerial: 'SN-LP90-11209-KR',
      category: 'Phụ kiện',
      servicePackage: 'Dịch vụ sửa chữa ưu đãi thành viên',
      purchaseDate: addDays(-795),
      warrantyPeriodMonths: 24,
      warrantyExpiryDate: addDays(-65),
      issueCategories: ['Bàn phím / Touchpad'],
      issueDescription: 'Double-click phím Enter và phím chữ E sau khi hết hạn bảo hành',
      faultCategory: 'other',
      rootCauseType: 'user_damage',
      attachments: [],
      pickupMode: 'center',
      preferredTime: 'Trong giờ hành chính',
      customerDeliveryNotes: '',
      borrowLaptop: false,
      priority: 'out_of_warranty',
      slaHours: 72,
      slaDeadline: addDays(-18),
      status: 'Đã sửa xong',
      assignedBranch: {
        code: 'HN-CG',
        name: 'Trạm Hà Nội — Cầu Giấy',
        address: 'Tầng 2, Tòa Technosoft, Phố Duy Tân, Cầu Giấy, Hà Nội'
      },
      assignedTechnician: {
        code: 'KTV-01',
        name: 'Lê Minh Trí',
        level: 'Bậc 5/5',
        branch: 'TTBH Hà Nội'
      },
      errorCode: 'SRV_SWITCH_CHERRY',
      repairLevel: 'Level 1 — Thay thế Switch Cherry MX',
      repairCost: 180000,
      technicianNotes: 'Đã thay mới 4 switch Cherry MX Blue chính hãng Đức và vệ sinh toàn bộ plate. Sẵn sàng bàn giao.',
      internalTechNotes: 'Đã áp dụng ưu đãi giảm 30% phí linh kiện VIP.',
      replacementParts: [
        {
          partCode: 'SW-CHERRY-MXB',
          partName: 'Bộ 04 Switch Cherry MX Blue RGB/ Non-LED',
          spec: 'Made in Germany',
          quantity: 4,
          warehouseLocation: 'Kho Cầu Giấy',
          stockQty: 60,
          coveragePolicy: 'Tính phí ưu đãi ngoài BH (-30%)',
          issued: true,
          unitPrice: 65000,
          customerPrice: 180000
        }
      ],
      timelineSteps: buildTimelineForStatus('Đã sửa xong', addDays(-20)),
      messages: [
        {
          _id: 'msg_005',
          senderRole: 'technician',
          senderName: 'KTV Lê Minh Trí',
          text: 'Bàn phím Leopold FC900R của anh Tuấn đã hoàn tất thay switch và test 100% phím. Anh có thể xác nhận nghiệm thu hoặc nhận tại quầy Cầu Giấy nhé.',
          channels: ['Web Chat'],
          createdAt: addDays(-1)
        }
      ],
      csatScore: 5,
      receivedDate: addDays(-20),
      estimatedReturnDate: addDays(-1),
      completedDate: addDays(-1)
    }
  ];

  const reportSchedules = [
    {
      _id: 'sch_001',
      frequency: 'Hàng tuần',
      recipients: 'ban-giam-doc@warrantyops.com.vn, qa-lead@warrantyops.com.vn',
      formats: ['PDF', 'Excel'],
      createdAt: addDays(-15)
    }
  ];

  return {
    users,
    customers,
    products,
    warrantyRecords,
    warranties,
    reportSchedules
  };
}

module.exports = {
  buildTimelineForStatus,
  createInitialSeed
};
