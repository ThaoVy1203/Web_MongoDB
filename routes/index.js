const express = require('express');
const router = express.Router();
const dataStore = require('../services/dataStore');
const { SERVICE_BRANCHES, analyzeAddressForBranch } = require('../services/aiBranchService');

function buildExpiringAlerts(records = [], tickets = []) {
  const fromRecords = records
    .filter((r) => r.computedStatus === 'expiring' || (r.daysRemaining < 0 && r.daysRemaining >= -7))
    .map((r) => ({
      id: r._id,
      warrantyCode: r.wbCode,
      name: r.productName,
      productSerial: r.serialNumber,
      customer: r.customerName,
      phone: r.customerPhone,
      customerAddress: r.customerAddress || '',
      daysLeft: r.daysRemaining
    }));

  const fromTickets = tickets
    .filter((t) => typeof t.daysLeft === 'number' && t.daysLeft <= 30 && t.daysLeft >= -7)
    .map((t) => ({
      id: t._id,
      warrantyCode: t.warrantyCode,
      name: t.productName,
      productSerial: t.productSerial,
      customer: t.customerName,
      phone: t.customerPhone,
      customerAddress: t.customerAddress || '',
      daysLeft: t.daysLeft
    }));

  const merged = [...fromRecords];
  for (const item of fromTickets) {
    if (!merged.some((m) => m.productSerial === item.productSerial)) {
      merged.push(item);
    }
  }
  return merged.sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * POST /api/ai/suggest-branch : Phân tích địa chỉ trên giấy/phiếu bảo hành
 */
router.post('/api/ai/suggest-branch', (req, res) => {
  const { address, category, issueDescription } = req.body || {};
  const result = analyzeAddressForBranch(address, category, issueDescription);
  res.json(result);
});

/**
 * GET / : Trang chủ Quản lý Giấy tờ, Phiếu Bảo hành & Trợ lý AI Chi nhánh
 */
router.get('/', async (req, res) => {
  const { search, status, success, error } = req.query;
  try {
    const [allTickets, allRecords] = await Promise.all([
      dataStore.getWarrantyTickets(),
      dataStore.getWarrantyRecords()
    ]);

    let filtered = [...allTickets];
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (w) =>
          (w.warrantyCode || '').toLowerCase().includes(q) ||
          (w.customerName || '').toLowerCase().includes(q) ||
          (w.productSerial || '').toLowerCase().includes(q) ||
          (w.productName || '').toLowerCase().includes(q) ||
          (w.customerPhone || '').toLowerCase().includes(q) ||
          (w.customerAddress || '').toLowerCase().includes(q)
      );
    }
    if (status && status.trim() !== '') {
      filtered = filtered.filter((w) => w.status === status.trim());
    }

    const expiringAlerts = buildExpiringAlerts(allRecords, allTickets);
    const activeTicket = filtered[0] || allTickets[0] || null;
    const defaultSuggestion = activeTicket
      ? analyzeAddressForBranch(activeTicket.customerAddress, activeTicket.category, activeTicket.issueDescription)
      : null;

    const kpis = {
      total: allTickets.length,
      expiringSoon: expiringAlerts.length,
      processing: allTickets.filter((w) =>
        ['Tiếp nhận', 'Đang kiểm tra', 'Chờ linh kiện', 'Chờ duyệt', 'Đang sửa chữa'].includes(w.status)
      ).length,
      completed: allTickets.filter((w) => ['Đã sửa xong', 'Đã trả khách'].includes(w.status)).length
    };

    res.render('index', {
      warranties: filtered,
      activeTicket,
      hasSearched: Boolean(search && search.trim() !== ''),
      searchQuery: search || '',
      statusFilter: status || '',
      kpis,
      expiringAlerts,
      serviceBranches: SERVICE_BRANCHES,
      defaultSuggestion,
      dbConnected: dataStore.isMongoConnected(),
      successMessage: success || null,
      errorMessage: error || null
    });
  } catch (err) {
    console.error('Lỗi khi tải Trang chủ:', err);
    res.render('index', {
      warranties: [],
      activeTicket: null,
      hasSearched: false,
      searchQuery: '',
      statusFilter: '',
      kpis: { total: 0, expiringSoon: 0, processing: 0, completed: 0 },
      expiringAlerts: [],
      serviceBranches: SERVICE_BRANCHES,
      defaultSuggestion: null,
      dbConnected: false,
      successMessage: null,
      errorMessage: 'Lỗi tải dữ liệu: ' + err.message
    });
  }
});

/**
 * GET /tra-cuu : Tra cứu công khai Serial / IMEI / Mã phiếu
 */
router.get('/tra-cuu', async (req, res) => {
  const { serial, search, code } = req.query;
  const rawQuery = (serial || search || code || '').trim();
  const hasExplicitQuery = Boolean(rawQuery);
  const queryStr = hasExplicitQuery ? rawQuery : 'DLXPS-99281-VN';

  try {
    const device = await dataStore.findDeviceForLookup(queryStr);
    const notFound = hasExplicitQuery && !device;

    res.render('tra-cuu', {
      device,
      searchQuery: queryStr,
      notFound
    });
  } catch (err) {
    console.error('Lỗi tra cứu:', err);
    res.render('tra-cuu', {
      device: null,
      searchQuery: queryStr,
      notFound: true
    });
  }
});

/**
 * GET /san-pham-cua-toi : Danh mục thiết bị & giấy bảo hành của khách hàng
 */
router.get('/san-pham-cua-toi', async (req, res) => {
  const { filter, search, success, error } = req.query;
  try {
    const [allRecords, allTickets] = await Promise.all([
      dataStore.getWarrantyRecords(),
      dataStore.getWarrantyTickets()
    ]);

    // Nếu đã đăng nhập tài khoản khách hàng thì ưu tiên thiết bị của khách đó; nếu chưa có hoặc khách vãng lai thì hiển thị danh sách mẫu của KH-10294 + các máy mới đăng ký
    let scopedRecords = allRecords.filter((r) => r.computedStatus !== 'rejected');
    if (req.user && req.user.role === 'customer') {
      const userMatches = scopedRecords.filter(
        (r) =>
          (req.user.customerCode && r.customerCode === req.user.customerCode) ||
          (req.user.email && r.customerEmail === req.user.email)
      );
      if (userMatches.length > 0) {
        scopedRecords = userMatches;
      }
    }

    const mappedAll = scopedRecords.map((r) => {
      const relatedTicket = allTickets.find(
        (t) => t.productSerial.toLowerCase() === r.serialNumber.toLowerCase()
      );
      let statusBadge = `Còn hạn ${r.daysRemaining} ngày`;
      let statusType = 'active';
      if (r.daysRemaining < 0) {
        statusBadge = `Đã hết hạn (${Math.abs(r.daysRemaining)} ngày)`;
        statusType = 'expired';
      } else if (r.daysRemaining <= 30) {
        statusBadge = `Sắp hết hạn (${r.daysRemaining} ngày)`;
        statusType = 'expiring';
      }

      return {
        id: r._id,
        wbCode: r.wbCode,
        serial: r.serialNumber,
        origin: r.origin || 'Chính hãng',
        statusBadge,
        type: statusType,
        categoryTag: r.categoryTag || (r.category || 'THIẾT BỊ').toUpperCase(),
        purchaseDate: r.purchaseDateObj.toLocaleDateString('vi-VN'),
        endDate: r.endDateObj.toLocaleDateString('vi-VN'),
        name: r.productName,
        packageName: r.packageName,
        packageDesc: r.packageDesc,
        totalDays: r.totalDays,
        daysRemaining: r.daysRemaining,
        percentPassed: r.percentPassed,
        image: r.image,
        activeTicketCode: relatedTicket ? relatedTicket.warrantyCode : null
      };
    });

    let products = [...mappedAll];
    if (filter === 'active') products = products.filter((p) => p.type === 'active');
    else if (filter === 'expiring') products = products.filter((p) => p.type === 'expiring');
    else if (filter === 'expired') products = products.filter((p) => p.type === 'expired');

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.serial.toLowerCase().includes(q) ||
          p.categoryTag.toLowerCase().includes(q) ||
          p.wbCode.toLowerCase().includes(q)
      );
    }

    res.render('san-pham-cua-toi', {
      products,
      currentFilter: filter || 'all',
      searchQuery: search || '',
      customerCodeDisplay: (req.user && req.user.customerCode) || 'KH-10294',
      customerNameDisplay: (req.user && req.user.fullname) || 'Trần Anh Tuấn',
      stats: {
        total: mappedAll.length,
        active: mappedAll.filter((p) => p.type === 'active').length,
        expiring: mappedAll.filter((p) => p.type === 'expiring').length,
        expired: mappedAll.filter((p) => p.type === 'expired').length
      },
      successMessage: success || null,
      errorMessage: error || null
    });
  } catch (err) {
    console.error('Lỗi trang Sản phẩm của tôi:', err);
    res.redirect('/?error=' + encodeURIComponent(err.message));
  }
});

/**
 * POST /san-pham/register : Kích hoạt / Đăng ký Serial thiết bị mới
 */
router.post('/san-pham/register', async (req, res) => {
  const { serial, productName, category, purchaseDate, periodMonths } = req.body;
  if (!serial || !productName) {
    return res.redirect(
      '/san-pham-cua-toi?error=' + encodeURIComponent('Vui lòng nhập đầy đủ Số Serial và Tên sản phẩm!')
    );
  }

  try {
    const rec = await dataStore.createWarrantyRecord({
      serialNumber: serial,
      productName,
      category: category || 'Laptop/Máy tính',
      purchaseDate,
      periodMonths: Number(periodMonths) || 12,
      customerCode: (req.user && req.user.customerCode) || 'KH-10294',
      customerName: (req.user && req.user.fullname) || 'Trần Anh Tuấn',
      customerPhone: (req.user && req.user.phone) || '0912.345.891',
      customerEmail: (req.user && req.user.email) || '',
      activationChannel: 'WEB'
    });

    res.redirect(
      `/san-pham-cua-toi?success=${encodeURIComponent(
        `Đã kích hoạt bảo hành thiết bị [${rec.serialNumber}] — Mã giấy BH: ${rec.wbCode}!`
      )}`
    );
  } catch (err) {
    res.redirect('/san-pham-cua-toi?error=' + encodeURIComponent(err.message));
  }
});

/**
 * POST /san-pham/:id/renew : Gia hạn thêm thời hạn bảo hành thiết bị
 */
router.post('/san-pham/:id/renew', async (req, res) => {
  const { id } = req.params;
  const { months } = req.body;
  try {
    const updated = await dataStore.renewWarrantyRecord(id, Number(months) || 12);
    res.redirect(
      `/san-pham-cua-toi?success=${encodeURIComponent(
        `Đã gia hạn thành công thiết bị [${updated.serialNumber}] đến ngày ${updated.endDateObj.toLocaleDateString('vi-VN')}!`
      )}`
    );
  } catch (err) {
    res.redirect('/san-pham-cua-toi?error=' + encodeURIComponent(err.message));
  }
});

/**
 * GET /gui-yeu-cau : Trang Gửi yêu cầu sửa chữa / bảo hành trực tuyến
 */
router.get('/gui-yeu-cau', async (req, res) => {
  const { serial, success, error } = req.query;
  try {
    const records = (await dataStore.getWarrantyRecords()).filter((r) => r.computedStatus !== 'rejected');
    let selectedDevice = null;
    if (serial) {
      selectedDevice = records.find(
        (r) => r.serialNumber.toLowerCase() === String(serial).trim().toLowerCase()
      );
    }
    if (!selectedDevice) {
      selectedDevice = records[0] || null;
    }

    const rand = Math.floor(1000 + Math.random() * 9000);
    const expectedCode = `WRQ-2024-${rand}`;
    const defaultAddress =
      (selectedDevice && selectedDevice.customerAddress) ||
      'Số 45 Trần Thái Tông, Cầu Giấy, Hà Nội';
    const aiSuggestion = analyzeAddressForBranch(
      defaultAddress,
      selectedDevice ? selectedDevice.category : 'Laptop/Máy tính',
      ''
    );

    res.render('gui-yeu-cau', {
      devices: records,
      selectedDevice,
      requestedSerial: serial || '',
      expectedCode,
      defaultCustomer: {
        name: (req.user && req.user.fullname) || (selectedDevice && selectedDevice.customerName) || '',
        phone: (req.user && req.user.phone) || (selectedDevice && selectedDevice.customerPhone) || '',
        address: defaultAddress
      },
      aiSuggestion,
      branches: SERVICE_BRANCHES,
      successMessage: success || null,
      errorMessage: error || null
    });
  } catch (err) {
    res.redirect('/?error=' + encodeURIComponent(err.message));
  }
});

/**
 * GET /theo-doi : Trang Theo dõi tiến độ bảo hành 6 bước & Chat KTV
 */
router.get('/theo-doi', async (req, res) => {
  const { ticket, serial, success, error } = req.query;
  try {
    const allTickets = await dataStore.getWarrantyTickets();
    let selectedTicket = null;

    if (ticket) {
      selectedTicket = allTickets.find(
        (t) => t.warrantyCode.toLowerCase() === String(ticket).trim().toLowerCase()
      );
    } else if (serial) {
      selectedTicket = allTickets.find(
        (t) => t.productSerial.toLowerCase() === String(serial).trim().toLowerCase()
      );
    }
    if (!selectedTicket) {
      selectedTicket = allTickets[0] || null;
    }

    res.render('theo-doi', {
      tickets: allTickets,
      selectedTicket,
      successMessage: success || null,
      errorMessage: error || null
    });
  } catch (err) {
    res.redirect('/?error=' + encodeURIComponent(err.message));
  }
});

router.get('/theo-doi-bao-hanh', (req, res) => res.redirect('/theo-doi'));

/**
 * POST /api/tickets/:code/messages : Gửi tin nhắn trao đổi trực tiếp trên phiếu bảo hành
 */
router.post('/api/tickets/:code/messages', async (req, res) => {
  const { code } = req.params;
  const { text, senderName } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ ok: false, error: 'Nội dung tin nhắn không được để trống.' });
  }
  try {
    const ticket = await dataStore.getTicketByIdOrCode(code);
    if (!ticket) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy phiếu bảo hành.' });
    }
    const updated = await dataStore.updateWarrantyTicket(ticket._id, {
      newMessage: {
        senderRole: req.user && req.user.role === 'admin' ? 'technician' : 'customer',
        senderName:
          senderName ||
          (req.user && req.user.fullname) ||
          ticket.customerName ||
          'Khách hàng',
        text: text.trim(),
        channels: ['Web Chat']
      }
    });
    return res.json({ ok: true, messages: updated.messages });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /theo-doi/:code/confirm-receipt : Khách hàng xác nhận đã nhận lại thiết bị
 */
router.post('/theo-doi/:code/confirm-receipt', async (req, res) => {
  const { code } = req.params;
  try {
    const ticket = await dataStore.getTicketByIdOrCode(code);
    if (!ticket) {
      return res.redirect('/theo-doi?error=' + encodeURIComponent('Không tìm thấy phiếu bảo hành!'));
    }
    await dataStore.updateWarrantyTicket(ticket._id, {
      status: 'Đã trả khách',
      customerConfirmedAt: new Date(),
      newMessage: {
        senderRole: 'system',
        senderName: 'Hệ thống nghiệm thu',
        text: `Khách hàng ${ticket.customerName} đã xác nhận nghiệm thu và nhận lại thiết bị hoàn tất.`,
        channels: ['Web Portal']
      }
    });
    res.redirect(
      `/theo-doi?ticket=${encodeURIComponent(ticket.warrantyCode)}&success=${encodeURIComponent(
        `Đã xác nhận nghiệm thu bàn giao thiết bị cho phiếu #${ticket.warrantyCode}!`
      )}`
    );
  } catch (err) {
    res.redirect('/theo-doi?error=' + encodeURIComponent(err.message));
  }
});

/**
 * GET /sync-mongodb : Đồng bộ dữ liệu mẫu vào MongoDB
 */
router.get('/sync-mongodb', async (req, res) => {
  try {
    await dataStore.syncLocalToMongo();
    res.redirect('/?success=' + encodeURIComponent('Đã đồng bộ cơ sở dữ liệu MongoDB thành công!'));
  } catch (err) {
    res.redirect('/?error=' + encodeURIComponent(err.message));
  }
});

/**
 * POST /warranty/create : Tạo mới hồ sơ / phiếu yêu cầu bảo hành
 */
router.post('/warranty/create', async (req, res) => {
  const referer = req.headers.referer || '/';
  const isFromGuiYeuCau = referer.includes('gui-yeu-cau');
  const isFromAdmin = referer.includes('/admin');

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
    issueCategories,
    issueDescription,
    status,
    technicianNotes,
    customerDeliveryNotes,
    repairCost,
    pickup_mode,
    preferredTime,
    borrowLaptop,
    priority,
    attachmentNames
  } = req.body;

  try {
    const aiMatch = analyzeAddressForBranch(customerAddress || '', category || '', issueDescription || '');
    const attachments =
      typeof attachmentNames === 'string' && attachmentNames.trim()
        ? attachmentNames
            .split('|')
            .filter(Boolean)
            .map((fname) => ({ filename: fname, fileType: 'image', sizeLabel: ' Đã đính kèm' }))
        : [];

    const created = await dataStore.createWarrantyTicket(
      {
        warrantyCode,
        customerCode: (req.user && req.user.customerCode) || '',
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        productName,
        productSerial,
        category,
        purchaseDate,
        warrantyPeriodMonths,
        issueCategories,
        issueDescription,
        status,
        technicianNotes,
        customerDeliveryNotes,
        repairCost,
        pickupMode: pickup_mode,
        preferredTime,
        borrowLaptop,
        priority,
        attachments
      },
      aiMatch
    );

    if (isFromGuiYeuCau) {
      return res.redirect(
        `/theo-doi?ticket=${encodeURIComponent(created.warrantyCode)}&success=${encodeURIComponent(
          `Đã tạo phiếu yêu cầu bảo hành #${created.warrantyCode} thành công! Trạm tiếp nhận: ${created.assignedBranch.name}.`
        )}`
      );
    }
    if (isFromAdmin) {
      return res.redirect(
        `/admin/yeu-cau-bao-hanh?ticket=${encodeURIComponent(created.warrantyCode)}&success=${encodeURIComponent(
          `Đã khởi tạo phiếu RMA #${created.warrantyCode} thành công!`
        )}`
      );
    }
    return res.redirect(
      `/?success=${encodeURIComponent(`Đã lưu hồ sơ bảo hành [${created.warrantyCode}] thành công!`)}`
    );
  } catch (err) {
    const fallbackUrl = isFromGuiYeuCau ? '/gui-yeu-cau' : isFromAdmin ? '/admin/yeu-cau-bao-hanh' : '/';
    res.redirect(`${fallbackUrl}?error=${encodeURIComponent(err.message)}`);
  }
});

/**
 * POST /warranty/update/:id : Cập nhật trạng thái, địa chỉ & ghi chú
 */
router.post('/warranty/update/:id', async (req, res) => {
  const { id } = req.params;
  const { status, technicianNotes, repairCost, customerAddress } = req.body;
  try {
    const updated = await dataStore.updateWarrantyTicket(id, {
      status,
      technicianNotes,
      repairCost,
      customerAddress
    });
    if (!updated) {
      return res.redirect('/?error=' + encodeURIComponent('Không tìm thấy hồ sơ bảo hành cần cập nhật!'));
    }
    res.redirect('/?success=' + encodeURIComponent(`Đã cập nhật hồ sơ [${updated.warrantyCode}] thành công!`));
  } catch (err) {
    res.redirect('/?error=' + encodeURIComponent('Lỗi khi cập nhật: ' + err.message));
  }
});

/**
 * POST /warranty/delete/:id : Xóa hồ sơ bảo hành
 */
router.post('/warranty/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dataStore.deleteWarrantyTicket(id);
    res.redirect('/?success=' + encodeURIComponent('Đã xóa hồ sơ bảo hành thành công!'));
  } catch (err) {
    res.redirect('/?error=' + encodeURIComponent('Lỗi khi xóa: ' + err.message));
  }
});

module.exports = router;
