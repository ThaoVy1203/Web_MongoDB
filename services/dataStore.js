const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const WarrantyRecord = require('../models/WarrantyRecord');
const Warranty = require('../models/Warranty');
const { buildTimelineForStatus, createInitialSeed } = require('./seedData');

const LOCAL_DB_DIR = path.join(__dirname, '..', 'data');
const LOCAL_DB_FILE = path.join(LOCAL_DB_DIR, 'local-db.json');

let localCache = null;
let mongoSeeded = false;

function isMongoConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

function loadLocalStore() {
  if (localCache) return localCache;
  try {
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf8');
      localCache = JSON.parse(raw);
      return localCache;
    }
  } catch (err) {
    console.warn('⚠️ Không thể đọc local-db.json, khởi tạo lại từ dữ liệu mẫu:', err.message);
  }
  localCache = createInitialSeed();
  saveLocalStore();
  return localCache;
}

function saveLocalStore() {
  if (!localCache) return;
  try {
    if (!fs.existsSync(LOCAL_DB_DIR)) {
      fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(localCache, null, 2), 'utf8');
  } catch (err) {
    console.warn('⚠️ Không thể ghi local-db.json:', err.message);
  }
}

function toPlain(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  obj._id = String(obj._id || obj.id || '');
  return obj;
}

function computeDaysBetween(targetDate, fromDate = new Date()) {
  if (!targetDate) return null;
  const end = new Date(targetDate).getTime();
  const start = new Date(fromDate).getTime();
  if (Number.isNaN(end) || Number.isNaN(start)) return null;
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

function decorateWarrantyRecord(raw) {
  const rec = toPlain(raw);
  const now = new Date();
  const pDate = rec.purchaseDate ? new Date(rec.purchaseDate) : now;
  const eDate = rec.endDate
    ? new Date(rec.endDate)
    : new Date(pDate.getTime() + (rec.periodMonths || 12) * 30 * 24 * 60 * 60 * 1000);

  const totalMs = Math.max(1, eDate.getTime() - pDate.getTime());
  const passedMs = Math.max(0, now.getTime() - pDate.getTime());
  const percentPassed = Math.min(100, Math.max(0, Number(((passedMs / totalMs) * 100).toFixed(1))));
  const daysRemaining = Math.ceil((eDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
  const daysPassed = Math.min(totalDays, Math.max(0, Math.floor(passedMs / (1000 * 60 * 60 * 24))));

  let computedStatus = 'active';
  if (rec.statusOverride === 'rejected') {
    computedStatus = 'rejected';
  } else if (daysRemaining < 0) {
    computedStatus = 'expired';
  } else if (daysRemaining <= 30) {
    computedStatus = 'expiring';
  }

  const s = rec.serialNumber || '';
  const maskedSerial = s.length > 6 ? `${s.slice(0, 4)}***${s.slice(-3)}` : s;

  return {
    ...rec,
    purchaseDateObj: pDate,
    endDateObj: eDate,
    daysRemaining,
    totalDays,
    daysPassed,
    percentPassed,
    computedStatus,
    maskedSerial
  };
}

function decorateWarrantyTicket(raw) {
  const t = toPlain(raw);
  const daysLeft = t.warrantyExpiryDate ? computeDaysBetween(t.warrantyExpiryDate) : null;
  if (!Array.isArray(t.timelineSteps) || t.timelineSteps.length === 0) {
    t.timelineSteps = buildTimelineForStatus(t.status, t.receivedDate || new Date());
  }
  return {
    ...t,
    daysLeft
  };
}

async function ensureSeeded() {
  if (!isMongoConnected()) {
    loadLocalStore();
    return;
  }
  if (mongoSeeded) return;
  try {
    const seed = createInitialSeed();
    const [uCount, cCount, pCount, wrCount, wCount] = await Promise.all([
      User.countDocuments(),
      Customer.countDocuments(),
      Product.countDocuments(),
      WarrantyRecord.countDocuments(),
      Warranty.countDocuments()
    ]);

    if (uCount === 0) {
      await User.insertMany(seed.users.map(({ _id, ...rest }) => rest));
    }
    if (cCount === 0) {
      await Customer.insertMany(
        seed.customers.map(({ _id, notes, auditLogs, ...rest }) => ({
          ...rest,
          notes: (notes || []).map(({ _id: nid, ...n }) => n),
          auditLogs: (auditLogs || []).map(({ _id: aid, ...a }) => a)
        }))
      );
    }
    if (pCount === 0) {
      await Product.insertMany(seed.products.map(({ _id, ...rest }) => rest));
    }
    if (wrCount === 0) {
      await WarrantyRecord.insertMany(seed.warrantyRecords.map(({ _id, ...rest }) => rest));
    }
    if (wCount === 0) {
      await Warranty.insertMany(
        seed.warranties.map(({ _id, messages, ...rest }) => ({
          ...rest,
          messages: (messages || []).map(({ _id: mid, ...m }) => m)
        }))
      );
    }
    mongoSeeded = true;
  } catch (err) {
    console.warn('⚠️ Lỗi khởi tạo dữ liệu mẫu MongoDB:', err.message);
  }
}

// ==========================================
// USERS
// ==========================================
async function findUserByIdentifier(identifier = '') {
  await ensureSeeded();
  const q = String(identifier).trim().toLowerCase();
  const cleanPhone = q.replace(/\D/g, '');

  if (isMongoConnected()) {
    const users = await User.find({});
    return (
      users
        .map(toPlain)
        .find(
          (u) =>
            u.email.toLowerCase() === q ||
            (u.staffCode && u.staffCode.toLowerCase() === q) ||
            (q === 'admin01' && u.role === 'admin') ||
            (cleanPhone.length >= 8 && (u.phone || '').replace(/\D/g, '') === cleanPhone)
        ) || null
    );
  }

  const store = loadLocalStore();
  return (
    store.users.find(
      (u) =>
        u.email.toLowerCase() === q ||
        (u.staffCode && u.staffCode.toLowerCase() === q) ||
        (q === 'admin01' && u.role === 'admin') ||
        (cleanPhone.length >= 8 && (u.phone || '').replace(/\D/g, '') === cleanPhone)
    ) || null
  );
}

async function createUser(data) {
  await ensureSeeded();
  const rand = Math.floor(10000 + Math.random() * 89999);
  const customerCode = data.customerCode || `KH-${rand}`;

  const userPayload = {
    customerCode,
    fullname: data.fullname.trim(),
    email: data.email.trim().toLowerCase(),
    phone: (data.phone || '').trim(),
    passwordHash: data.passwordHash,
    role: data.role || 'customer',
    address: (data.address || '').trim(),
    tier: 'Member',
    loyaltyPoints: 100,
    isActive: true
  };

  if (isMongoConnected()) {
    const created = await User.create(userPayload);
    // Đồng thời tạo hồ sơ Customer nếu chưa có
    const existingCust = await Customer.findOne({
      $or: [{ email: userPayload.email }, { customerCode }]
    });
    if (!existingCust && userPayload.role === 'customer') {
      await Customer.create({
        customerCode,
        shortId: String(rand).slice(-4),
        fullName: userPayload.fullname,
        phone: userPayload.phone || 'Chưa cập nhật',
        email: userPayload.email,
        customerType: 'canhan',
        rank: 'B+',
        city: 'Việt Nam',
        address: userPayload.address,
        auditLogs: [{ action: 'Đăng ký tài khoản mới', description: 'Tạo tài khoản qua cổng Khách hàng', actor: userPayload.fullname }]
      });
    }
    return toPlain(created);
  }

  const store = loadLocalStore();
  const newUser = { _id: 'usr_' + Date.now(), ...userPayload, createdAt: new Date() };
  store.users.unshift(newUser);
  if (userPayload.role === 'customer') {
    store.customers.unshift({
      _id: 'cust_' + Date.now(),
      customerCode,
      shortId: String(rand).slice(-4),
      fullName: userPayload.fullname,
      phone: userPayload.phone || 'Chưa cập nhật',
      email: userPayload.email,
      customerType: 'canhan',
      rank: 'B+',
      idNumber: '',
      city: 'Việt Nam',
      address: userPayload.address,
      status: 'active',
      assignedSpecialist: { name: 'Nguyễn Hoàng Long', ext: '104', phone: '0909.104.888' },
      notes: [],
      auditLogs: [{ _id: 'aud_' + Date.now(), action: 'Đăng ký tài khoản mới', description: 'Tạo tài khoản qua cổng Khách hàng', actor: userPayload.fullname, createdAt: new Date() }],
      joinedAt: new Date()
    });
  }
  saveLocalStore();
  return newUser;
}

// ==========================================
// CUSTOMERS
// ==========================================
async function getCustomers() {
  await ensureSeeded();
  const [rawCustomers, records, tickets] = await Promise.all([
    isMongoConnected() ? Customer.find({}).sort({ createdAt: -1 }) : Promise.resolve(loadLocalStore().customers),
    getWarrantyRecords(),
    getWarrantyTickets()
  ]);

  return rawCustomers.map((c) => {
    const plain = toPlain(c);
    const cleanPhone = (plain.phone || '').replace(/\D/g, '');
    const ownedDevices = records.filter(
      (r) =>
        (plain.customerCode && r.customerCode === plain.customerCode) ||
        (cleanPhone.length >= 8 && (r.customerPhone || '').replace(/\D/g, '') === cleanPhone)
    );
    const custTickets = tickets.filter(
      (t) =>
        (plain.customerCode && t.customerCode === plain.customerCode) ||
        (cleanPhone.length >= 8 && (t.customerPhone || '').replace(/\D/g, '') === cleanPhone)
    );
    return {
      ...plain,
      deviceCount: ownedDevices.length,
      warrantyClaimCount: custTickets.length,
      ownedDevices,
      tickets: custTickets
    };
  });
}

async function getCustomerByIdOrCode(idOrCode = '') {
  const all = await getCustomers();
  if (!idOrCode) return all[0] || null;
  const q = String(idOrCode).trim().toLowerCase();
  return (
    all.find(
      (c) =>
        String(c._id).toLowerCase() === q ||
        (c.customerCode || '').toLowerCase() === q ||
        (c.shortId || '').toLowerCase() === q
    ) || all[0] || null
  );
}

async function createCustomer(data) {
  await ensureSeeded();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const code = data.customerCode ? data.customerCode.trim().toUpperCase() : `KH-1${rand}`;
  const payload = {
    customerCode: code,
    shortId: String(rand),
    fullName: (data.fullName || 'Khách hàng mới').trim(),
    phone: (data.phone || '').trim(),
    email: (data.email || '').trim().toLowerCase(),
    customerType: ['canhan', 'vip', 'daily'].includes(data.customerType) ? data.customerType : 'canhan',
    rank: data.customerType === 'vip' || data.customerType === 'daily' ? 'A+' : 'A',
    idNumber: (data.idNumber || '').trim(),
    city: (data.city || 'Hà Nội').trim(),
    address: (data.address || '').trim(),
    status: 'active',
    assignedSpecialist: { name: 'Nguyễn Hoàng Long', ext: '104', phone: '0909.104.888' },
    notes: [],
    auditLogs: [
      {
        action: 'Khởi tạo hồ sơ khách hàng',
        description: `Thêm mới khách hàng ${data.fullName || ''}`,
        actor: 'Admin Portal',
        createdAt: new Date()
      }
    ],
    joinedAt: new Date()
  };

  if (isMongoConnected()) {
    const doc = await Customer.create(payload);
    return toPlain(doc);
  }

  const store = loadLocalStore();
  const item = { _id: 'cust_' + Date.now(), ...payload };
  store.customers.unshift(item);
  saveLocalStore();
  return item;
}

async function updateCustomer(id, updates) {
  await ensureSeeded();
  if (isMongoConnected()) {
    const doc = await Customer.findById(id);
    if (!doc) return null;
    if (updates.fullName) doc.fullName = updates.fullName.trim();
    if (updates.phone) doc.phone = updates.phone.trim();
    if (typeof updates.email === 'string') doc.email = updates.email.trim().toLowerCase();
    if (typeof updates.address === 'string') doc.address = updates.address.trim();
    if (typeof updates.city === 'string') doc.city = updates.city.trim();
    if (typeof updates.idNumber === 'string') doc.idNumber = updates.idNumber.trim();
    if (updates.customerType) doc.customerType = updates.customerType;
    if (updates.rank) doc.rank = updates.rank;
    if (updates.status) doc.status = updates.status;
    doc.auditLogs.unshift({
      action: 'Cập nhật thông tin hồ sơ',
      description: 'Chỉnh sửa thông tin liên hệ / phân hạng khách hàng',
      actor: 'Admin Portal',
      createdAt: new Date()
    });
    await doc.save();
    return toPlain(doc);
  }

  const store = loadLocalStore();
  const item = store.customers.find((c) => c._id === id || c.customerCode === id);
  if (!item) return null;
  Object.assign(item, {
    ...(updates.fullName ? { fullName: updates.fullName.trim() } : {}),
    ...(updates.phone ? { phone: updates.phone.trim() } : {}),
    ...(typeof updates.email === 'string' ? { email: updates.email.trim().toLowerCase() } : {}),
    ...(typeof updates.address === 'string' ? { address: updates.address.trim() } : {}),
    ...(typeof updates.city === 'string' ? { city: updates.city.trim() } : {}),
    ...(typeof updates.idNumber === 'string' ? { idNumber: updates.idNumber.trim() } : {}),
    ...(updates.customerType ? { customerType: updates.customerType } : {}),
    ...(updates.rank ? { rank: updates.rank } : {}),
    ...(updates.status ? { status: updates.status } : {})
  });
  item.auditLogs = item.auditLogs || [];
  item.auditLogs.unshift({
    _id: 'aud_' + Date.now(),
    action: 'Cập nhật thông tin hồ sơ',
    description: 'Chỉnh sửa thông tin liên hệ / phân hạng khách hàng',
    actor: 'Admin Portal',
    createdAt: new Date()
  });
  saveLocalStore();
  return item;
}

async function addCustomerNote(id, content, authorName = 'Admin CSKH') {
  await ensureSeeded();
  if (!content || !content.trim()) return null;

  if (isMongoConnected()) {
    const doc = await Customer.findById(id);
    if (!doc) return null;
    doc.notes.unshift({
      authorName,
      authorRole: 'Chuyên viên Quản trị',
      content: content.trim(),
      createdAt: new Date()
    });
    doc.auditLogs.unshift({
      action: 'Thêm ghi chú CSKH nội bộ',
      description: content.trim().slice(0, 80),
      actor: authorName,
      createdAt: new Date()
    });
    await doc.save();
    return toPlain(doc);
  }

  const store = loadLocalStore();
  const item = store.customers.find((c) => c._id === id || c.customerCode === id);
  if (!item) return null;
  item.notes = item.notes || [];
  item.notes.unshift({
    _id: 'note_' + Date.now(),
    authorName,
    authorRole: 'Chuyên viên Quản trị',
    content: content.trim(),
    createdAt: new Date()
  });
  item.auditLogs = item.auditLogs || [];
  item.auditLogs.unshift({
    _id: 'aud_' + Date.now(),
    action: 'Thêm ghi chú CSKH nội bộ',
    description: content.trim().slice(0, 80),
    actor: authorName,
    createdAt: new Date()
  });
  saveLocalStore();
  return item;
}

// ==========================================
// PRODUCTS
// ==========================================
async function getProducts() {
  await ensureSeeded();
  const [rawProducts, records, tickets] = await Promise.all([
    isMongoConnected() ? Product.find({}).sort({ createdAt: -1 }) : Promise.resolve(loadLocalStore().products),
    getWarrantyRecords(),
    getWarrantyTickets()
  ]);

  return rawProducts.map((p) => {
    const plain = toPlain(p);
    const activatedCount = records.filter(
      (r) => r.productSku === plain.sku || r.productName.toLowerCase().includes(plain.name.toLowerCase().slice(0, 12))
    ).length;
    const claimCount = tickets.filter(
      (t) => t.productSku === plain.sku || t.productName.toLowerCase().includes(plain.name.toLowerCase().slice(0, 12))
    ).length;
    const effectiveSold = Math.max(plain.soldCount || 100, activatedCount * 20, 50);
    const defectRate = Number((((claimCount + Math.round(effectiveSold * 0.018)) / effectiveSold) * 100).toFixed(2));

    return {
      ...plain,
      activatedCount: Math.max(activatedCount, 1),
      claimCount,
      defectRate
    };
  });
}

async function createProduct(data) {
  await ensureSeeded();
  const catMap = {
    laptop: 'Laptop & Máy trạm',
    phone: 'Điện thoại & Tablet',
    monitor: 'Màn hình đồ họa',
    audio: 'Thiết bị Âm thanh',
    component: 'Phụ kiện & Linh kiện'
  };
  const category = ['laptop', 'phone', 'monitor', 'audio', 'component'].includes(data.category)
    ? data.category
    : 'laptop';
  const payload = {
    sku: (data.sku || 'SKU-' + Date.now()).trim().toUpperCase(),
    subSku: (data.subSku || 'Rev: 2024-STD').trim(),
    lotCode: 'LOT-2024-NEW',
    name: (data.name || 'Sản phẩm mới').trim(),
    category,
    categoryLabel: catMap[category],
    specs: (data.specs || 'Cấu hình tiêu chuẩn hãng').trim(),
    imageUrl:
      data.imageUrl ||
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    serialType: category === 'phone' ? 'IMEI' : 'SN',
    serialSample: (data.serialSample || 'SN-NEW-0001').trim().toUpperCase(),
    warrantyMonths: Number(data.warrantyMonths) || 12,
    warrantyPolicyName: `Bảo hành chính hãng ${Number(data.warrantyMonths) || 12} tháng`,
    price: Number(String(data.price || '0').replace(/[^\d]/g, '')) || 0,
    releaseDate: new Date(),
    businessStatus: ['selling', 'stop', 'coming'].includes(data.businessStatus) ? data.businessStatus : 'selling',
    soldCount: 100,
    commonFaultPart: 'Đang theo dõi định kỳ',
    benefits: [
      { title: 'Phần cứng tiêu chuẩn hãng', badge: 'ĐƯỢC BẢO HÀNH', badgeType: 'orange', desc: 'Bảo hành miễn phí lỗi kỹ thuật từ nhà sản xuất.' }
    ]
  };

  if (isMongoConnected()) {
    const doc = await Product.create(payload);
    return toPlain(doc);
  }
  const store = loadLocalStore();
  const item = { _id: 'prd_' + Date.now(), ...payload };
  store.products.unshift(item);
  saveLocalStore();
  return item;
}

async function deleteProduct(id) {
  await ensureSeeded();
  if (isMongoConnected()) {
    return Product.findByIdAndDelete(id);
  }
  const store = loadLocalStore();
  const idx = store.products.findIndex((p) => p._id === id);
  if (idx >= 0) {
    store.products.splice(idx, 1);
    saveLocalStore();
  }
  return true;
}

// ==========================================
// WARRANTY RECORDS (GIẤY / HỒ SƠ BẢO HÀNH)
// ==========================================
async function getWarrantyRecords() {
  await ensureSeeded();
  const raw = isMongoConnected()
    ? await WarrantyRecord.find({}).sort({ createdAt: -1 })
    : loadLocalStore().warrantyRecords;
  return raw.map(decorateWarrantyRecord);
}

async function findDeviceForLookup(queryStr = '') {
  const q = String(queryStr).trim();
  if (!q) return null;
  const qLower = q.toLowerCase();

  const [records, tickets, products] = await Promise.all([
    getWarrantyRecords(),
    getWarrantyTickets(),
    getProducts()
  ]);

  // 1. Khớp chính xác hoặc gần đúng trong WarrantyRecord
  let rec = records.find(
    (r) =>
      r.serialNumber.toLowerCase() === qLower ||
      r.wbCode.toLowerCase() === qLower ||
      (r.customerPhone && r.customerPhone.replace(/\D/g, '') === q.replace(/\D/g, '') && q.replace(/\D/g, '').length >= 9)
  );
  if (!rec) {
    rec = records.find(
      (r) =>
        r.serialNumber.toLowerCase().includes(qLower) ||
        r.wbCode.toLowerCase().includes(qLower) ||
        r.productName.toLowerCase().includes(qLower)
    );
  }

  if (rec) {
    const relatedTicket = tickets.find(
      (t) => t.productSerial.toLowerCase() === rec.serialNumber.toLowerCase()
    );
    return {
      productName: rec.productName,
      category: rec.category,
      modelCode: rec.modelCode || rec.productSku || 'MODEL-STD',
      warrantyCode: rec.wbCode,
      rawSerial: rec.serialNumber,
      maskedSerial: rec.maskedSerial,
      servicePackage: rec.packageName,
      status:
        rec.computedStatus === 'rejected'
          ? 'TỪ CHỐI BẢO HÀNH'
          : rec.daysRemaining >= 0
            ? 'CÒN HẠN BẢO HÀNH'
            : 'HẾT HẠN BẢO HÀNH',
      computedStatus: rec.computedStatus,
      daysRemaining: Math.max(0, rec.daysRemaining),
      rawDaysRemaining: rec.daysRemaining,
      totalDays: rec.totalDays,
      daysPassed: rec.daysPassed,
      percentPassed: rec.percentPassed,
      purchaseDate: rec.purchaseDateObj.toLocaleDateString('vi-VN'),
      purchasePlace: rec.purchasePlace,
      activateDate: new Date(rec.activatedAt || rec.purchaseDateObj).toLocaleDateString('vi-VN'),
      activateType: `Kích hoạt qua ${rec.activationChannel || 'WEB'}`,
      expiryDate: rec.endDateObj.toLocaleDateString('vi-VN'),
      warrantyDurationText:
        rec.computedStatus === 'rejected'
          ? `Vô hiệu hóa: ${rec.voidReason || 'Vi phạm điều kiện bảo hành'}`
          : rec.daysRemaining < 0
            ? `Đã hết hạn ${Math.abs(rec.daysRemaining)} ngày`
            : `Thời hạn ${rec.periodMonths} tháng chính hãng`,
      commitText: rec.commitText,
      benefits:
        rec.benefits && rec.benefits.length > 0
          ? rec.benefits
          : [
              {
                title: 'Linh kiện phần cứng chính hãng',
                badge: rec.daysRemaining >= 0 ? 'ĐƯỢC BẢO HÀNH' : 'HỖ TRỢ DỊCH VỤ',
                badgeType: rec.daysRemaining >= 0 ? 'orange' : 'dark',
                desc: rec.packageDesc
              }
            ],
      exclusionText: rec.exclusionText,
      image: rec.image,
      customerName: rec.customerName,
      customerPhone: rec.customerPhone,
      customerAddress: rec.customerAddress,
      activeTicketCode: relatedTicket ? relatedTicket.warrantyCode : null
    };
  }

  // 2. Khớp theo mã phiếu RMA trong WarrantyTickets
  const tkt = tickets.find(
    (t) =>
      t.warrantyCode.toLowerCase() === qLower ||
      t.productSerial.toLowerCase() === qLower ||
      t.warrantyCode.toLowerCase().includes(qLower) ||
      t.productSerial.toLowerCase().includes(qLower)
  );
  if (tkt) {
    const pDate = tkt.purchaseDate ? new Date(tkt.purchaseDate) : new Date(tkt.receivedDate || Date.now());
    const expDate = tkt.warrantyExpiryDate
      ? new Date(tkt.warrantyExpiryDate)
      : new Date(pDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const totalMs = Math.max(1, expDate.getTime() - pDate.getTime());
    const passedMs = Math.max(0, now.getTime() - pDate.getTime());
    const percent = Math.min(100, Math.max(0, Number(((passedMs / totalMs) * 100).toFixed(1))));
    const dLeft = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      productName: tkt.productName,
      category: tkt.category,
      modelCode: tkt.productSku || 'RMA-' + tkt.warrantyCode,
      warrantyCode: tkt.warrantyCode,
      rawSerial: tkt.productSerial,
      maskedSerial:
        tkt.productSerial.length > 6
          ? `${tkt.productSerial.slice(0, 4)}***${tkt.productSerial.slice(-2)}`
          : tkt.productSerial,
      servicePackage: tkt.servicePackage || 'Bảo hành tiêu chuẩn WarrantyOps',
      status: dLeft >= 0 ? 'CÒN HẠN BẢO HÀNH' : 'HẾT HẠN BẢO HÀNH',
      computedStatus: dLeft < 0 ? 'expired' : dLeft <= 30 ? 'expiring' : 'active',
      daysRemaining: Math.max(0, dLeft),
      rawDaysRemaining: dLeft,
      totalDays: Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24))),
      daysPassed: Math.max(0, Math.floor(passedMs / (1000 * 60 * 60 * 24))),
      percentPassed: percent,
      purchaseDate: pDate.toLocaleDateString('vi-VN'),
      purchasePlace: 'Hệ thống đại lý ủy quyền',
      activateDate: pDate.toLocaleDateString('vi-VN'),
      activateType: 'Hồ sơ điện tử',
      expiryDate: expDate.toLocaleDateString('vi-VN'),
      warrantyDurationText: `Thời hạn ${tkt.warrantyPeriodMonths || 12} tháng chính hãng`,
      commitText: 'Thay thế linh kiện chính hãng trong 48–72h làm việc',
      benefits: [
        { title: 'Phần cứng & Bo mạch chính', badge: 'ĐƯỢC BẢO HÀNH', badgeType: 'orange', desc: 'Bảo hành lỗi kỹ thuật nhà sản xuất.' },
        { title: 'Theo dõi phiếu RMA trực tuyến', badge: tkt.status.toUpperCase(), badgeType: 'dark', desc: tkt.technicianNotes }
      ],
      exclusionText: 'Loại trừ: Rơi vỡ biến dạng hoặc ngấm chất lỏng.',
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
      customerName: tkt.customerName,
      customerPhone: tkt.customerPhone,
      customerAddress: tkt.customerAddress,
      activeTicketCode: tkt.warrantyCode
    };
  }

  // 3. Khớp dòng máy trong danh mục Product
  const prod = products.find(
    (p) =>
      p.sku.toLowerCase() === qLower ||
      p.serialSample.toLowerCase() === qLower ||
      p.name.toLowerCase().includes(qLower)
  );
  if (prod) {
    return {
      productName: prod.name,
      category: prod.categoryLabel,
      modelCode: prod.sku,
      warrantyCode: 'CATALOG-' + prod.sku,
      rawSerial: prod.serialSample,
      maskedSerial: prod.serialSample,
      servicePackage: prod.warrantyPolicyName,
      status: 'CÒN HẠN BẢO HÀNH',
      computedStatus: 'active',
      daysRemaining: prod.warrantyMonths * 30,
      rawDaysRemaining: prod.warrantyMonths * 30,
      totalDays: prod.warrantyMonths * 30,
      daysPassed: 0,
      percentPassed: 5,
      purchaseDate: new Date().toLocaleDateString('vi-VN'),
      purchasePlace: 'Danh mục chính hãng WarrantyOps',
      activateDate: new Date().toLocaleDateString('vi-VN'),
      activateType: 'Tra cứu mẫu danh mục',
      expiryDate: new Date(Date.now() + prod.warrantyMonths * 30 * 86400000).toLocaleDateString('vi-VN'),
      warrantyDurationText: `Chính sách tiêu chuẩn ${prod.warrantyMonths} tháng`,
      commitText: prod.commitText,
      benefits: prod.benefits,
      exclusionText: prod.exclusionText,
      image: prod.imageUrl,
      activeTicketCode: null
    };
  }

  return null;
}

async function createWarrantyRecord(data) {
  await ensureSeeded();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const wbCode = data.wbCode && data.wbCode.trim() ? data.wbCode.trim().toUpperCase() : `WB-2024-${rand}`;
  const serialNumber = (data.serialNumber || data.serial || '').trim().toUpperCase();

  const pDate = data.purchaseDate ? new Date(data.purchaseDate) : new Date();
  const periodMonths = Number(data.periodMonths) || 12;
  const endDate = new Date(pDate);
  endDate.setMonth(endDate.getMonth() + periodMonths);

  const payload = {
    wbCode,
    serialNumber,
    modelCode: data.modelCode || 'STD-MODEL',
    productSku: data.productSku || '',
    productName: (data.productName || 'Thiết bị chính hãng').trim(),
    category: data.category || 'Laptop/Máy tính',
    categoryTag: (data.category || 'THIẾT BỊ ĐĂNG KÝ MỚI').toUpperCase(),
    origin: 'Chính hãng',
    customerCode: data.customerCode || 'KH-10294',
    customerName: (data.customerName || 'Khách hàng thành viên').trim(),
    customerPhone: (data.customerPhone || '0912.345.891').trim(),
    customerEmail: (data.customerEmail || '').trim(),
    customerAddress: (data.customerAddress || '').trim(),
    purchaseDate: pDate,
    activatedAt: new Date(),
    endDate,
    periodMonths,
    packageName: `Bảo hành chính hãng ${periodMonths} tháng`,
    packageDesc: 'Tiếp nhận xử lý nhanh tại hệ thống trạm ủy quyền WarrantyOps toàn quốc.',
    purchasePlace: data.purchasePlace || 'Đăng ký trực tuyến',
    activationChannel: data.activationChannel || 'WEB',
    notes: (data.notes || '').trim(),
    image:
      data.image ||
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80'
  };

  if (isMongoConnected()) {
    const existing = await WarrantyRecord.findOne({ serialNumber });
    if (existing) throw new Error(`Số Serial [${serialNumber}] đã được đăng ký trước đó (${existing.wbCode})!`);
    const doc = await WarrantyRecord.create(payload);
    return decorateWarrantyRecord(doc);
  }

  const store = loadLocalStore();
  if (store.warrantyRecords.some((r) => r.serialNumber.toUpperCase() === serialNumber)) {
    throw new Error(`Số Serial [${serialNumber}] đã được đăng ký trước đó!`);
  }
  const item = { _id: 'wr_' + Date.now(), ...payload, renewalHistory: [], benefits: [] };
  store.warrantyRecords.unshift(item);
  saveLocalStore();
  return decorateWarrantyRecord(item);
}

async function renewWarrantyRecord(identifier, addMonths = 12) {
  await ensureSeeded();
  const months = Number(addMonths) || 12;

  if (isMongoConnected()) {
    const q = String(identifier).trim();
    const doc = await WarrantyRecord.findOne({
      $or: [
        ...(mongoose.Types.ObjectId.isValid(q) ? [{ _id: q }] : []),
        { wbCode: q.toUpperCase() },
        { serialNumber: q.toUpperCase() }
      ]
    });
    if (!doc) throw new Error('Không tìm thấy hồ sơ bảo hành cần gia hạn!');
    const base = doc.endDate && new Date(doc.endDate) > new Date() ? new Date(doc.endDate) : new Date();
    const nextEnd = new Date(base);
    nextEnd.setMonth(nextEnd.getMonth() + months);

    doc.renewalHistory.push({
      addedMonths: months,
      previousEndDate: doc.endDate,
      newEndDate: nextEnd,
      renewedAt: new Date(),
      note: `Gia hạn thêm ${months} tháng`
    });
    doc.endDate = nextEnd;
    doc.periodMonths = (doc.periodMonths || 12) + months;
    doc.statusOverride = '';
    await doc.save();
    return decorateWarrantyRecord(doc);
  }

  const store = loadLocalStore();
  const q = String(identifier).trim().toUpperCase();
  const item = store.warrantyRecords.find(
    (r) => r._id === identifier || r.wbCode.toUpperCase() === q || r.serialNumber.toUpperCase() === q
  );
  if (!item) throw new Error('Không tìm thấy hồ sơ bảo hành cần gia hạn!');

  const base = item.endDate && new Date(item.endDate) > new Date() ? new Date(item.endDate) : new Date();
  const nextEnd = new Date(base);
  nextEnd.setMonth(nextEnd.getMonth() + months);
  item.renewalHistory = item.renewalHistory || [];
  item.renewalHistory.push({
    addedMonths: months,
    previousEndDate: item.endDate,
    newEndDate: nextEnd,
    renewedAt: new Date()
  });
  item.endDate = nextEnd;
  item.periodMonths = (item.periodMonths || 12) + months;
  item.statusOverride = '';
  saveLocalStore();
  return decorateWarrantyRecord(item);
}

// ==========================================
// WARRANTY TICKETS (PHIẾU YÊU CẦU / RMA)
// ==========================================
async function getWarrantyTickets() {
  await ensureSeeded();
  const raw = isMongoConnected()
    ? await Warranty.find({}).sort({ createdAt: -1 })
    : loadLocalStore().warranties;
  return raw.map(decorateWarrantyTicket);
}

async function getTicketByIdOrCode(idOrCode = '') {
  const all = await getWarrantyTickets();
  if (!idOrCode) return all[0] || null;
  const q = String(idOrCode).trim().toLowerCase();
  return (
    all.find(
      (t) =>
        String(t._id).toLowerCase() === q ||
        t.warrantyCode.toLowerCase() === q ||
        t.productSerial.toLowerCase() === q
    ) || null
  );
}

function detectFaultCategory(desc = '', cats = []) {
  const text = `${desc} ${(cats || []).join(' ')}`.toLowerCase();
  if (text.includes('màn hình') || text.includes('sọc') || text.includes('oled') || text.includes('cảm ứng')) return 'screen';
  if (text.includes('sạc') || text.includes('pin') || text.includes('nguồn') || text.includes('nhiệt') || text.includes('quạt')) return 'power_battery';
  if (text.includes('main') || text.includes('camera') || text.includes('bo mạch') || text.includes('treo')) return 'mainboard';
  return 'other';
}

async function createWarrantyTicket(data, aiBranchSuggestion = null) {
  await ensureSeeded();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const code =
    data.warrantyCode && data.warrantyCode.trim() !== ''
      ? data.warrantyCode.trim().toUpperCase()
      : `TKT-2024-${rand}`;

  const pDate = data.purchaseDate ? new Date(data.purchaseDate) : new Date();
  const period = parseInt(data.warrantyPeriodMonths, 10) || 12;
  const expiryDate = data.warrantyExpiryDate ? new Date(data.warrantyExpiryDate) : new Date(pDate);
  if (!data.warrantyExpiryDate) {
    expiryDate.setMonth(expiryDate.getMonth() + period);
  }

  const issueCats = Array.isArray(data.issueCategories)
    ? data.issueCategories
    : typeof data.issueCategories === 'string' && data.issueCategories.trim()
      ? data.issueCategories.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  const status = data.status || 'Tiếp nhận';
  const branchInfo =
    aiBranchSuggestion && aiBranchSuggestion.matched
      ? {
          code: aiBranchSuggestion.primary.code,
          name: aiBranchSuggestion.primary.name,
          address: aiBranchSuggestion.primary.address
        }
      : {
          code: 'HN-CG',
          name: 'Trạm Hà Nội — Cầu Giấy',
          address: 'Tầng 2, Tòa Technosoft, Phố Duy Tân, Cầu Giấy, Hà Nội'
        };

  const techInfo =
    aiBranchSuggestion && aiBranchSuggestion.matched && aiBranchSuggestion.primary.recommendedTech
      ? {
          code: aiBranchSuggestion.primary.recommendedTech.code,
          name: aiBranchSuggestion.primary.recommendedTech.name,
          level: aiBranchSuggestion.primary.recommendedTech.level,
          branch: aiBranchSuggestion.primary.recommendedTech.branch
        }
      : {
          code: 'KTV-01',
          name: 'Lê Minh Trí',
          level: 'Bậc 5/5',
          branch: 'TTBH Hà Nội'
        };

  const slaHours = data.priority === 'urgent_24h' ? 24 : 48;
  const now = new Date();

  const payload = {
    warrantyCode: code,
    customerCode: data.customerCode || '',
    customerName: (data.customerName || 'Khách hàng').trim(),
    customerPhone: (data.customerPhone || '0900000000').trim(),
    customerEmail: (data.customerEmail || '').trim(),
    customerAddress: (data.customerAddress || '').trim(),
    productSku: data.productSku || '',
    productName: (data.productName || 'Thiết bị điện tử').trim(),
    productSerial: (data.productSerial || `SN-${rand}`).trim().toUpperCase(),
    category: ['Điện thoại', 'Laptop/Máy tính', 'Màn hình', 'Thiết bị gia dụng', 'Phụ kiện', 'Khác'].includes(data.category)
      ? data.category
      : 'Laptop/Máy tính',
    servicePackage: data.servicePackage || 'Bảo hành tiêu chuẩn chính hãng',
    purchaseDate: pDate,
    warrantyPeriodMonths: period,
    warrantyExpiryDate: expiryDate,
    issueCategories: issueCats,
    issueDescription: (data.issueDescription || 'Yêu cầu kiểm tra bảo hành').trim(),
    faultCategory: detectFaultCategory(data.issueDescription, issueCats),
    rootCauseType: 'oem_defect',
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
    pickupMode: data.pickupMode === 'onsite' ? 'onsite' : 'center',
    preferredTime: data.preferredTime || 'Trong giờ hành chính (08:30 - 17:30)',
    customerDeliveryNotes: (data.customerDeliveryNotes || '').trim(),
    borrowLaptop: Boolean(data.borrowLaptop === 'yes' || data.borrowLaptop === true),
    priority: data.priority || 'standard_48h',
    slaHours,
    slaDeadline: new Date(now.getTime() + slaHours * 60 * 60 * 1000),
    status,
    assignedBranch: branchInfo,
    assignedTechnician: techInfo,
    repairCost: data.repairCost ? Number(data.repairCost) : 0,
    technicianNotes:
      (data.technicianNotes || '').trim() ||
      `Đã tiếp nhận yêu cầu và điều phối về ${branchInfo.name}.`,
    internalTechNotes: '',
    replacementParts: [],
    timelineSteps: buildTimelineForStatus(status, now),
    messages: [
      {
        senderRole: 'system',
        senderName: 'Hệ thống WarrantyOps',
        text: `Phiếu #${code} đã được khởi tạo thành công và phân tuyến tới ${branchInfo.name} (${techInfo.name}).`,
        channels: ['Web Chat'],
        createdAt: now
      }
    ],
    receivedDate: now,
    estimatedReturnDate: new Date(now.getTime() + slaHours * 60 * 60 * 1000)
  };

  if (isMongoConnected()) {
    const dup = await Warranty.findOne({ warrantyCode: code });
    if (dup) throw new Error(`Mã phiếu bảo hành [${code}] đã tồn tại trong hệ thống!`);
    const doc = await Warranty.create(payload);
    return decorateWarrantyTicket(doc);
  }

  const store = loadLocalStore();
  if (store.warranties.some((w) => w.warrantyCode.toUpperCase() === code)) {
    throw new Error(`Mã phiếu bảo hành [${code}] đã tồn tại trong hệ thống!`);
  }
  const item = { _id: 'tkt_' + Date.now(), ...payload };
  store.warranties.unshift(item);
  saveLocalStore();
  return decorateWarrantyTicket(item);
}

async function updateWarrantyTicket(idOrCode, updates) {
  await ensureSeeded();
  const q = String(idOrCode).trim();

  if (isMongoConnected()) {
    const doc = await Warranty.findOne({
      $or: [
        ...(mongoose.Types.ObjectId.isValid(q) ? [{ _id: q }] : []),
        { warrantyCode: q.toUpperCase() }
      ]
    });
    if (!doc) return null;

    if (updates.status) {
      doc.status = updates.status;
      doc.timelineSteps = buildTimelineForStatus(updates.status, doc.receivedDate || new Date());
      if (['Đã sửa xong', 'Đã trả khách'].includes(updates.status)) {
        doc.completedDate = new Date();
      }
    }
    if (typeof updates.technicianNotes === 'string') doc.technicianNotes = updates.technicianNotes.trim();
    if (typeof updates.internalTechNotes === 'string') doc.internalTechNotes = updates.internalTechNotes.trim();
    if (typeof updates.customerAddress === 'string') doc.customerAddress = updates.customerAddress.trim();
    if (typeof updates.rejectionReason === 'string') doc.rejectionReason = updates.rejectionReason.trim();
    if (updates.repairCost !== undefined) doc.repairCost = Number(updates.repairCost) || 0;
    if (updates.assignedTechnician) doc.assignedTechnician = updates.assignedTechnician;
    if (updates.assignedBranch) doc.assignedBranch = updates.assignedBranch;
    if (updates.slaDeadline) doc.slaDeadline = new Date(updates.slaDeadline);
    if (updates.customerConfirmedAt) doc.customerConfirmedAt = updates.customerConfirmedAt;
    if (updates.newPart) {
      doc.replacementParts.push(updates.newPart);
    }
    if (updates.issuePartCode) {
      doc.replacementParts = doc.replacementParts.map((p) =>
        p.partCode === updates.issuePartCode ? { ...(p.toObject ? p.toObject() : p), issued: true } : p
      );
    }
    if (updates.newMessage) {
      doc.messages.push(updates.newMessage);
    }

    await doc.save();
    return decorateWarrantyTicket(doc);
  }

  const store = loadLocalStore();
  const item = store.warranties.find(
    (w) => String(w._id) === q || w.warrantyCode.toUpperCase() === q.toUpperCase()
  );
  if (!item) return null;

  if (updates.status) {
    item.status = updates.status;
    item.timelineSteps = buildTimelineForStatus(updates.status, item.receivedDate || new Date());
    if (['Đã sửa xong', 'Đã trả khách'].includes(updates.status)) {
      item.completedDate = new Date();
    }
  }
  if (typeof updates.technicianNotes === 'string') item.technicianNotes = updates.technicianNotes.trim();
  if (typeof updates.internalTechNotes === 'string') item.internalTechNotes = updates.internalTechNotes.trim();
  if (typeof updates.customerAddress === 'string') item.customerAddress = updates.customerAddress.trim();
  if (typeof updates.rejectionReason === 'string') item.rejectionReason = updates.rejectionReason.trim();
  if (updates.repairCost !== undefined) item.repairCost = Number(updates.repairCost) || 0;
  if (updates.assignedTechnician) item.assignedTechnician = updates.assignedTechnician;
  if (updates.assignedBranch) item.assignedBranch = updates.assignedBranch;
  if (updates.slaDeadline) item.slaDeadline = new Date(updates.slaDeadline);
  if (updates.customerConfirmedAt) item.customerConfirmedAt = updates.customerConfirmedAt;
  if (updates.newPart) {
    item.replacementParts = item.replacementParts || [];
    item.replacementParts.push(updates.newPart);
  }
  if (updates.issuePartCode && Array.isArray(item.replacementParts)) {
    item.replacementParts = item.replacementParts.map((p) =>
      p.partCode === updates.issuePartCode ? { ...p, issued: true } : p
    );
  }
  if (updates.newMessage) {
    item.messages = item.messages || [];
    item.messages.push({ _id: 'msg_' + Date.now(), createdAt: new Date(), ...updates.newMessage });
  }

  saveLocalStore();
  return decorateWarrantyTicket(item);
}

async function deleteWarrantyTicket(idOrCode) {
  await ensureSeeded();
  const q = String(idOrCode).trim();
  if (isMongoConnected()) {
    if (mongoose.Types.ObjectId.isValid(q)) {
      await Warranty.findByIdAndDelete(q);
    } else {
      await Warranty.findOneAndDelete({ warrantyCode: q.toUpperCase() });
    }
    return true;
  }
  const store = loadLocalStore();
  const idx = store.warranties.findIndex(
    (w) => String(w._id) === q || w.warrantyCode.toUpperCase() === q.toUpperCase()
  );
  if (idx >= 0) {
    store.warranties.splice(idx, 1);
    saveLocalStore();
  }
  return true;
}

// ==========================================
// REPORT SCHEDULES & SYNC
// ==========================================
async function addReportSchedule(schedule) {
  const store = loadLocalStore();
  store.reportSchedules = store.reportSchedules || [];
  const item = { _id: 'sch_' + Date.now(), ...schedule, createdAt: new Date() };
  store.reportSchedules.unshift(item);
  saveLocalStore();
  return item;
}

async function getReportSchedules() {
  const store = loadLocalStore();
  return store.reportSchedules || [];
}

async function syncLocalToMongo() {
  if (!isMongoConnected()) {
    throw new Error('Chưa kết nối được tới máy chủ MongoDB (127.0.0.1:27017 hoặc MONGODB_URI).');
  }
  mongoSeeded = false;
  await ensureSeeded();
  return {
    users: await User.countDocuments(),
    customers: await Customer.countDocuments(),
    products: await Product.countDocuments(),
    warrantyRecords: await WarrantyRecord.countDocuments(),
    warranties: await Warranty.countDocuments()
  };
}

module.exports = {
  isMongoConnected,
  ensureSeeded,
  findUserByIdentifier,
  createUser,
  getCustomers,
  getCustomerByIdOrCode,
  createCustomer,
  updateCustomer,
  addCustomerNote,
  getProducts,
  createProduct,
  deleteProduct,
  getWarrantyRecords,
  findDeviceForLookup,
  createWarrantyRecord,
  renewWarrantyRecord,
  getWarrantyTickets,
  getTicketByIdOrCode,
  createWarrantyTicket,
  updateWarrantyTicket,
  deleteWarrantyTicket,
  addReportSchedule,
  getReportSchedules,
  syncLocalToMongo
};
