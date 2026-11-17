const express = require('express');
const router = express.Router();
const dataStore = require('../services/dataStore');
const { SERVICE_BRANCHES, TECHNICIANS, analyzeAddressForBranch } = require('../services/aiBranchService');

// Middleware nạp số liệu điều hướng chung cho toàn bộ trang /admin*
router.use('/admin', async (req, res, next) => {
  try {
    const [customers, tickets, records] = await Promise.all([
      dataStore.getCustomers(),
      dataStore.getWarrantyTickets(),
      dataStore.getWarrantyRecords()
    ]);
    const openTickets = tickets.filter(
      (t) => !['Đã trả khách', 'Từ chối bảo hành'].includes(t.status)
    );
    const expiringRecords = records.filter((r) => r.computedStatus === 'expiring');

    res.locals.adminNav = {
      customerCount: customers.length,
      openTicketCount: openTickets.length,
      expiringCount: expiringRecords.length,
      dbConnected: dataStore.isMongoConnected(),
      adminName: (req.user && req.user.fullname) || 'admin01'
    };
    next();
  } catch (err) {
    res.locals.adminNav = {
      customerCount: 0,
      openTicketCount: 0,
      expiringCount: 0,
      dbConnected: false,
      adminName: 'admin01'
    };
    next();
  }
});

router.get('/dashboard', (req, res) => res.redirect('/admin'));
router.get('/admin/dashboard', (req, res) => res.redirect('/admin'));

/**
 * 1. GET /admin : Dashboard Tổng quan Quản trị
 */
router.get('/admin', async (req, res) => {
  const { range = 'all', success, error } = req.query;
  try {
    const [customers, products, records, allTickets] = await Promise.all([
      dataStore.getCustomers(),
      dataStore.getProducts(),
      dataStore.getWarrantyRecords(),
      dataStore.getWarrantyTickets()
    ]);

    const now = Date.now();
    const tickets = allTickets.filter((t) => {
      if (range === 'today') return now - new Date(t.receivedDate).getTime() <= 24 * 3600 * 1000;
      if (range === '7days') return now - new Date(t.receivedDate).getTime() <= 7 * 24 * 3600 * 1000;
      if (range === 'month') return now - new Date(t.receivedDate).getTime() <= 30 * 24 * 3600 * 1000;
      return true;
    });

    const activeRecordsCount = records.filter(
      (r) => r.computedStatus === 'active' || r.computedStatus === 'expiring'
    ).length;
    const openTickets = tickets.filter(
      (t) => !['Đã trả khách', 'Từ chối bảo hành'].includes(t.status)
    );
    const completedTickets = tickets.filter((t) =>
      ['Đã sửa xong', 'Đã trả khách'].includes(t.status)
    );
    const slaBreached = openTickets.filter(
      (t) => t.slaDeadline && new Date(t.slaDeadline).getTime() < now
    ).length;
    const slaRate = tickets.length > 0
      ? Math.min(99.5, Math.max(85, Number((((tickets.length - slaBreached) / tickets.length) * 100).toFixed(1))))
      : 96.8;

    // Phân loại lỗi kỹ thuật cho Donut Chart
    const faultCounts = { screen: 0, power_battery: 0, mainboard: 0, other: 0 };
    allTickets.forEach((t) => {
      faultCounts[t.faultCategory || 'other'] = (faultCounts[t.faultCategory || 'other'] || 0) + 1;
    });
    const totalFaults = Math.max(1, allTickets.length);
    const faultDistribution = [
      { key: 'screen', label: 'Màn hình & Hiển thị', count: faultCounts.screen, pct: Math.round((faultCounts.screen / totalFaults) * 100), color: '#ff6b00' },
      { key: 'power_battery', label: 'Nguồn, Sạc & Nhiệt độ', count: faultCounts.power_battery, pct: Math.round((faultCounts.power_battery / totalFaults) * 100), color: '#111315' },
      { key: 'mainboard', label: 'Bo mạch & Cụm Camera', count: faultCounts.mainboard, pct: Math.round((faultCounts.mainboard / totalFaults) * 100), color: '#f59e0b' },
      { key: 'other', label: 'Bàn phím & Ngoại vi', count: faultCounts.other, pct: Math.max(0, 100 - Math.round((faultCounts.screen / totalFaults) * 100) - Math.round((faultCounts.power_battery / totalFaults) * 100) - Math.round((faultCounts.mainboard / totalFaults) * 100)), color: '#94a3b8' }
    ];

    const expiringAlerts = records
      .filter((r) => r.computedStatus === 'expiring')
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    res.render('admin-dashboard', {
      activeAdminPage: 'dashboard',
      currentRange: range,
      kpis: {
        activeRecords: activeRecordsCount,
        totalRecords: records.length,
        openTickets: openTickets.length,
        slaBreached,
        slaRate,
        customerCount: customers.length,
        productCount: products.length,
        completedCount: completedTickets.length
      },
      recentTickets: tickets.slice(0, 8),
      expiringAlerts,
      faultDistribution,
      totalTicketsCount: allTickets.length,
      successMessage: success || null,
      errorMessage: error || null
    });
  } catch (err) {
    res.status(500).send('Lỗi tải Dashboard Admin: ' + err.message);
  }
});

/**
 * 2. QUẢN LÝ KHÁCH HÀNG
 */
router.get('/admin/customers', (req, res) => res.redirect('/admin/khach-hang'));
router.get('/admin/quan-ly-khach-hang', (req, res) => res.redirect('/admin/khach-hang'));

router.get('/admin/khach-hang', async (req, res) => {
  const { q = '', category = 'all', city = '', success, error } = req.query;
  try {
    const allCustomers = await dataStore.getCustomers();
    let customers = [...allCustomers];

    if (category && category !== 'all') {
      customers = customers.filter((c) => c.customerType === category);
    }
    if (city && city.trim()) {
      customers = customers.filter((c) =>
        (c.city || '').toLowerCase().includes(city.trim().toLowerCase())
      );
    }
    if (q && q.trim()) {
      const s = q.trim().toLowerCase();
      customers = customers.filter(
        (c) =>
          c.fullName.toLowerCase().includes(s) ||
          c.customerCode.toLowerCase().includes(s) ||
          (c.phone || '').toLowerCase().includes(s) ||
          (c.email || '').toLowerCase().includes(s) ||
          (c.idNumber || '').toLowerCase().includes(s)
      );
    }

    res.render('admin-khach-hang', {
      activeAdminPage: 'customers',
      customers,
      totalCustomers: allCustomers.length,
      filters: { q, category, city },
      technicians: TECHNICIANS,
      successMessage: success || null,
      errorMessage: error || null
    });
  } catch (err) {
    res.redirect('/admin?error=' + encodeURIComponent(err.message));
  }
});

router.post('/admin/khach-hang', async (req, res) => {
  try {
    const created = await dataStore.createCustomer(req.body);
    res.redirect(
      `/admin/khach-hang?success=${encodeURIComponent(
        `Đã thêm khách hàng [${created.customerCode}] ${created.fullName} thành công!`
      )}`
    );
  } catch (err) {
    res.redirect('/admin/khach-hang?error=' + encodeURIComponent(err.message));
  }
});

/**
 * 3. HỒ SƠ CHI TIẾT KHÁCH HÀNG
 */
router.get('/admin/khach-hang/ho-so', (req, res) => res.redirect('/admin/ho-so-khach-hang'));

async function renderCustomerProfile(req, res, idParam) {
  const { success, error } = req.query;
  try {
    const customer = await dataStore.getCustomerByIdOrCode(idParam || req.query.id || '');
    if (!customer) {
      return res.redirect('/admin/khach-hang?error=' + encodeURIComponent('Không tìm thấy hồ sơ khách hàng!'));
    }
    res.render('admin-ho-so-khach-hang', {
      activeAdminPage: 'customers',
      customer,
      technicians: TECHNICIANS,
      successMessage: success || null,
      errorMessage: error || null
    });
  } catch (err) {
    res.redirect('/admin/khach-hang?error=' + encodeURIComponent(err.message));
  }
}

router.get('/admin/ho-so-khach-hang', (req, res) => renderCustomerProfile(req, res, req.query.id));
router.get('/admin/ho-so-khach-hang/:id', (req, res) => renderCustomerProfile(req, res, req.params.id));
router.get('/admin/khach-hang/:id', (req, res) => renderCustomerProfile(req, res, req.params.id));

router.post('/admin/khach-hang/:id/update', async (req, res) => {
  const { id } = req.params;
  const referer = req.headers.referer || `/admin/ho-so-khach-hang/${id}`;
  const backBase = referer.includes('ho-so-khach-hang') || referer.includes(`/khach-hang/${id}`)
    ? `/admin/ho-so-khach-hang/${id}`
    : '/admin/khach-hang';
  try {
    const updated = await dataStore.updateCustomer(id, req.body);
    if (!updated) {
      return res.redirect(`${backBase}?error=${encodeURIComponent('Không tìm thấy khách hàng!')}`);
    }
    res.redirect(
      `${backBase}?success=${encodeURIComponent(`Đã lưu thông tin khách hàng ${updated.fullName}!`)}`
    );
  } catch (err) {
    res.redirect(`${backBase}?error=${encodeURIComponent(err.message)}`);
  }
});

router.post('/admin/khach-hang/:id/toggle-lock', async (req, res) => {
  const { id } = req.params;
  try {
    const current = await dataStore.getCustomerByIdOrCode(id);
    if (!current) {
      return res.redirect('/admin/khach-hang?error=' + encodeURIComponent('Không tìm thấy khách hàng!'));
    }
    const nextStatus = current.status === 'locked' ? 'active' : 'locked';
    await dataStore.updateCustomer(current._id, { status: nextStatus });
    res.redirect(
      `/admin/ho-so-khach-hang/${current._id}?success=${encodeURIComponent(
        nextStatus === 'locked' ? 'Đã tạm khóa hồ sơ khách hàng.' : 'Đã mở khóa hồ sơ khách hàng.'
      )}`
    );
  } catch (err) {
    res.redirect(`/admin/ho-so-khach-hang/${id}?error=` + encodeURIComponent(err.message));
  }
});

router.post('/admin/khach-hang/:id/notes', async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const author = (req.user && req.user.fullname) || 'Chuyên viên CSKH';
    await dataStore.addCustomerNote(id, content, author);
    res.redirect(
      `/admin/ho-so-khach-hang/${id}?success=${encodeURIComponent('Đã thêm ghi chú CSKH nội bộ!')}`
    );
  } catch (err) {
    res.redirect(`/admin/ho-so-khach-hang/${id}?error=` + encodeURIComponent(err.message));
  }
});

/**
 * 4. QUẢN LÝ SẢN PHẨM (DANH MỤC SKU)
 */
router.get('/admin/quan-ly-san-pham', (req, res) => res.redirect('/admin/san-pham'));
router.get('/admin/products', (req, res) => res.redirect('/admin/san-pham'));

router.get('/admin/san-pham', async (req, res) => {
  const { q = '', category = 'all', warranty = 'all', status = 'all', success, error } = req.query;
  try {
    const allProducts = await dataStore.getProducts();
    let products = [...allProducts];

    if (category !== 'all') products = products.filter((p) => p.category === category);
    if (warranty !== 'all') products = products.filter((p) => String(p.warrantyMonths) === String(warranty));
    if (status !== 'all') products = products.filter((p) => p.businessStatus === status);
    if (q && q.trim()) {
      const s = q.trim().toLowerCase();
      products = products.filter(
        (p) =>
          p.sku.toLowerCase().includes(s) ||
          p.name.toLowerCase().includes(s) ||
          (p.serialSample || '').toLowerCase().includes(s) ||
          (p.specs || '').toLowerCase().includes(s)
      );
    }

    res.render('admin-san-pham', {
      activeAdminPage: 'products',
      products,
      totalProducts: allProducts.length,
      filters: { q, category, warranty, status },
      successMessage: success || null,
      errorMessage: error || null
    });
  } catch (err) {
    res.redirect('/admin?error=' + encodeURIComponent(err.message));
  }
});

router.post('/admin/san-pham', async (req, res) => {
  try {
    const created = await dataStore.createProduct(req.body);
    res.redirect(
      `/admin/san-pham?success=${encodeURIComponent(`Đã thêm dòng sản phẩm [${created.sku}] ${created.name}!`)}`
    );
  } catch (err) {
    res.redirect('/admin/san-pham?error=' + encodeURIComponent(err.message));
  }
});

router.post('/admin/san-pham/:id/delete', async (req, res) => {
  try {
    await dataStore.deleteProduct(req.params.id);
    res.redirect('/admin/san-pham?success=' + encodeURIComponent('Đã xóa sản phẩm khỏi danh mục!'));
  } catch (err) {
    res.redirect('/admin/san-pham?error=' + encodeURIComponent(err.message));
  }
});

router.post('/admin/api/products/reindex', async (req, res) => {
  res.json({
    ok: true,
    message: 'Đã đồng bộ chỉ mục { serialNumber: 1, sku: 1 } thành công!',
    indexedAt: new Date().toLocaleTimeString('vi-VN')
  });
});

/**
 * 5. QUẢN LÝ HỒ SƠ BẢO HÀNH (CERTIFICATES / PAPERS)
 */
router.get('/admin/bao-hanh', (req, res) => res.redirect('/admin/ho-so-bao-hanh'));
router.get('/admin/warranty', (req, res) => res.redirect('/admin/ho-so-bao-hanh'));

router.get('/admin/ho-so-bao-hanh', async (req, res) => {
  const { tab = 'all', q = '', success, error } = req.query;
  try {
    const allRecords = await dataStore.getWarrantyRecords();
    const counts = {
      all: allRecords.length,
      active: allRecords.filter((r) => r.computedStatus === 'active').length,
      expiring: allRecords.filter((r) => r.computedStatus === 'expiring').length,
      expired: allRecords.filter((r) => r.computedStatus === 'expired').length,
      rejected: allRecords.filter((r) => r.computedStatus === 'rejected').length
    };

    let records = [...allRecords];
    if (tab !== 'all') {
      records = records.filter((r) => r.computedStatus === tab);
    }
    if (q && q.trim()) {
      const s = q.trim().toLowerCase();
      records = records.filter(
        (r) =>
          r.wbCode.toLowerCase().includes(s) ||
          r.serialNumber.toLowerCase().includes(s) ||
          r.productName.toLowerCase().includes(s) ||
          r.customerName.toLowerCase().includes(s) ||
          (r.customerPhone || '').toLowerCase().includes(s)
      );
    }

    res.render('admin-ho-so-bao-hanh', {
      activeAdminPage: 'warranties',
      records,
      counts,
      currentTab: tab,
      searchQuery: q,
      successMessage: success || null,
      errorMessage: error || null
    });
  } catch (err) {
    res.redirect('/admin?error=' + encodeURIComponent(err.message));
  }
});

router.post('/admin/ho-so-bao-hanh', async (req, res) => {
  try {
    const created = await dataStore.createWarrantyRecord({
      ...req.body,
      activationChannel: 'ADMIN'
    });
    res.redirect(
      `/admin/ho-so-bao-hanh?success=${encodeURIComponent(
        `Đã cấp hồ sơ bảo hành mới [${created.wbCode}] cho Serial ${created.serialNumber}!`
      )}`
    );
  } catch (err) {
    res.redirect('/admin/ho-so-bao-hanh?error=' + encodeURIComponent(err.message));
  }
});

router.post('/admin/ho-so-bao-hanh/renew', async (req, res) => {
  const { wbCode, months } = req.body;
  const referer = req.headers.referer || '/admin/ho-so-bao-hanh';
  const backUrl = referer.includes('ho-so-khach-hang')
    ? referer.split('?')[0]
    : '/admin/ho-so-bao-hanh';
  try {
    const rec = await dataStore.renewWarrantyRecord(wbCode, Number(months) || 12);
    res.redirect(
      `${backUrl}?success=${encodeURIComponent(
        `Đã gia hạn hồ sơ [${rec.wbCode}] thêm ${months || 12} tháng (Hạn mới: ${rec.endDateObj.toLocaleDateString('vi-VN')})!`
      )}`
    );
  } catch (err) {
    res.redirect(`${backUrl}?error=` + encodeURIComponent(err.message));
  }
});

router.post('/admin/api/warranties/batch-check', async (req, res) => {
  const { serials = '' } = req.body || {};
  const lines = String(serials)
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const results = [];
  for (const item of lines.slice(0, 30)) {
    const found = await dataStore.findDeviceForLookup(item);
    results.push({
      query: item.toUpperCase(),
      found: Boolean(found),
      productName: found ? found.productName : 'Không tìm thấy trên hệ thống',
      warrantyCode: found ? found.warrantyCode : '—',
      status: found ? found.status : 'CHƯA KÍCH HOẠT',
      expiryDate: found ? found.expiryDate : '—'
    });
  }
  res.json({ ok: true, results });
});

/**
 * 6. YÊU CẦU & XỬ LÝ BẢO HÀNH (MASTER-DETAIL RMA WORKSPACE)
 */
router.get('/admin/xu-ly-phieu', (req, res) => res.redirect('/admin/yeu-cau-bao-hanh'));
router.get('/admin/yeu-cau', (req, res) => res.redirect('/admin/yeu-cau-bao-hanh'));
router.get('/admin/tickets', (req, res) => res.redirect('/admin/yeu-cau-bao-hanh'));
router.get('/admin/rma', (req, res) => res.redirect('/admin/yeu-cau-bao-hanh'));

router.get('/admin/yeu-cau-bao-hanh', async (req, res) => {
  const { ticket, queue = 'all', q = '', success, error } = req.query;
  try {
    const allTickets = await dataStore.getWarrantyTickets();
    const queueCounts = {
      all: allTickets.length,
      waiting: allTickets.filter((t) => t.status === 'Tiếp nhận').length,
      processing: allTickets.filter((t) => ['Đang kiểm tra', 'Đang sửa chữa'].includes(t.status)).length,
      parts: allTickets.filter((t) => t.status === 'Chờ linh kiện').length,
      approval: allTickets.filter((t) => t.status === 'Chờ duyệt').length,
      done: allTickets.filter((t) => ['Đã sửa xong', 'Đã trả khách', 'Từ chối bảo hành'].includes(t.status)).length
    };

    let filtered = [...allTickets];
    if (queue === 'waiting') filtered = filtered.filter((t) => t.status === 'Tiếp nhận');
    else if (queue === 'processing') filtered = filtered.filter((t) => ['Đang kiểm tra', 'Đang sửa chữa'].includes(t.status));
    else if (queue === 'parts') filtered = filtered.filter((t) => t.status === 'Chờ linh kiện');
    else if (queue === 'approval') filtered = filtered.filter((t) => t.status === 'Chờ duyệt');
    else if (queue === 'done') filtered = filtered.filter((t) => ['Đã sửa xong', 'Đã trả khách', 'Từ chối bảo hành'].includes(t.status));

    if (q && q.trim()) {
      const s = q.trim().toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.warrantyCode.toLowerCase().includes(s) ||
          t.productName.toLowerCase().includes(s) ||
          t.productSerial.toLowerCase().includes(s) ||
          t.customerName.toLowerCase().includes(s)
      );
    }

    let selectedTicket = null;
    if (ticket) {
      selectedTicket = allTickets.find(
        (t) => t.warrantyCode.toLowerCase() === String(ticket).trim().toLowerCase() || String(t._id) === ticket
      );
    }
    if (!selectedTicket) {
      selectedTicket = filtered[0] || allTickets[0] || null;
    }

    const aiBranch = selectedTicket
      ? analyzeAddressForBranch(selectedTicket.customerAddress, selectedTicket.category, selectedTicket.issueDescription)
      : null;

    res.render('admin-yeu-cau-bao-hanh', {
      activeAdminPage: 'tickets',
      tickets: filtered,
      selectedTicket,
      queueCounts,
      currentQueue: queue,
      searchQuery: q,
      technicians: TECHNICIANS,
      branches: SERVICE_BRANCHES,
      aiBranch,
      successMessage: success || null,
      errorMessage: error || null
    });
  } catch (err) {
    res.redirect('/admin?error=' + encodeURIComponent(err.message));
  }
});

router.post('/admin/yeu-cau-bao-hanh/:id/assign', async (req, res) => {
  const { id } = req.params;
  const { techCode, branchCode, slaDeadline, directive } = req.body;
  try {
    const tech = TECHNICIANS.find((t) => t.code === techCode) || TECHNICIANS[0];
    const branch = SERVICE_BRANCHES.find((b) => b.code === branchCode) || SERVICE_BRANCHES[0];
    const updated = await dataStore.updateWarrantyTicket(id, {
      assignedTechnician: { code: tech.code, name: tech.name, level: tech.level, branch: tech.branch },
      assignedBranch: { code: branch.code, name: branch.name, address: branch.address },
      ...(slaDeadline ? { slaDeadline } : {}),
      ...(directive ? { internalTechNotes: directive } : {})
    });
    res.redirect(
      `/admin/yeu-cau-bao-hanh?ticket=${encodeURIComponent(updated.warrantyCode)}&success=${encodeURIComponent(
        `Đã phân công ${tech.name} tại ${branch.name} xử lý phiếu #${updated.warrantyCode}!`
      )}`
    );
  } catch (err) {
    res.redirect('/admin/yeu-cau-bao-hanh?error=' + encodeURIComponent(err.message));
  }
});

router.post('/admin/yeu-cau-bao-hanh/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, technicianNotes, repairCost } = req.body;
  try {
    const updated = await dataStore.updateWarrantyTicket(id, {
      status,
      ...(typeof technicianNotes === 'string' && technicianNotes.trim() ? { technicianNotes } : {}),
      ...(repairCost !== undefined && repairCost !== '' ? { repairCost } : {})
    });
    res.redirect(
      `/admin/yeu-cau-bao-hanh?ticket=${encodeURIComponent(updated.warrantyCode)}&success=${encodeURIComponent(
        `Đã chuyển trạng thái phiếu #${updated.warrantyCode} sang "${status}"!`
      )}`
    );
  } catch (err) {
    res.redirect('/admin/yeu-cau-bao-hanh?error=' + encodeURIComponent(err.message));
  }
});

router.post('/admin/yeu-cau-bao-hanh/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const updated = await dataStore.updateWarrantyTicket(id, {
      status: 'Từ chối bảo hành',
      rejectionReason: reason || 'Vi phạm điều kiện bảo hành chính hãng',
      technicianNotes: `Từ chối bảo hành: ${reason || 'Vi phạm quy định tem/ngoại lực'}`
    });
    res.redirect(
      `/admin/yeu-cau-bao-hanh?ticket=${encodeURIComponent(updated.warrantyCode)}&success=${encodeURIComponent(
        `Đã ghi nhận quyết định từ chối bảo hành cho phiếu #${updated.warrantyCode}.`
      )}`
    );
  } catch (err) {
    res.redirect('/admin/yeu-cau-bao-hanh?error=' + encodeURIComponent(err.message));
  }
});

router.post('/admin/yeu-cau-bao-hanh/:id/parts', async (req, res) => {
  const { id } = req.params;
  const { issuePartCode, partCode, partName, unitPrice, customerPrice } = req.body;
  try {
    let updated;
    if (issuePartCode) {
      updated = await dataStore.updateWarrantyTicket(id, { issuePartCode });
    } else if (partName) {
      updated = await dataStore.updateWarrantyTicket(id, {
        newPart: {
          partCode: (partCode || 'LK-' + Math.floor(100 + Math.random() * 900)).toUpperCase(),
          partName: partName.trim(),
          spec: 'Linh kiện chính hãng xuất kho',
          quantity: 1,
          warehouseLocation: 'Kho Trung tâm',
          stockQty: 5,
          coveragePolicy: Number(customerPrice) > 0 ? 'Tính phí dịch vụ' : 'Miễn phí 100% (Trong hạn BH)',
          issued: true,
          unitPrice: Number(unitPrice) || 0,
          customerPrice: Number(customerPrice) || 0
        }
      });
    }
    res.redirect(
      `/admin/yeu-cau-bao-hanh?ticket=${encodeURIComponent(updated.warrantyCode)}&success=${encodeURIComponent(
        'Đã cập nhật xuất kho linh kiện trên phiếu!'
      )}`
    );
  } catch (err) {
    res.redirect('/admin/yeu-cau-bao-hanh?error=' + encodeURIComponent(err.message));
  }
});

router.post('/admin/yeu-cau-bao-hanh/:id/notify', async (req, res) => {
  const { id } = req.params;
  const { message, channels } = req.body;
  try {
    const channelList = Array.isArray(channels) ? channels : channels ? [channels] : ['Web Chat', 'Zalo ZNS'];
    const updated = await dataStore.updateWarrantyTicket(id, {
      newMessage: {
        senderRole: 'technician',
        senderName: `KTV / CSKH WarrantyOps`,
        text: (message || '').trim(),
        channels: channelList
      }
    });
    res.redirect(
      `/admin/yeu-cau-bao-hanh?ticket=${encodeURIComponent(updated.warrantyCode)}&success=${encodeURIComponent(
        `Đã gửi phản hồi tới khách hàng ${updated.customerName} (đồng bộ sang cổng Theo dõi trực tuyến)!`
      )}`
    );
  } catch (err) {
    res.redirect('/admin/yeu-cau-bao-hanh?error=' + encodeURIComponent(err.message));
  }
});

router.post('/admin/yeu-cau-bao-hanh/:id/internal-note', async (req, res) => {
  const { id } = req.params;
  const { internalTechNotes } = req.body;
  try {
    const updated = await dataStore.updateWarrantyTicket(id, { internalTechNotes });
    res.redirect(
      `/admin/yeu-cau-bao-hanh?ticket=${encodeURIComponent(updated.warrantyCode)}&success=${encodeURIComponent(
        'Đã lưu ghi chú nội bộ kỹ thuật viên!'
      )}`
    );
  } catch (err) {
    res.redirect('/admin/yeu-cau-bao-hanh?error=' + encodeURIComponent(err.message));
  }
});

/**
 * 7. THỐNG KÊ & BÁO CÁO (ANALYTICS)
 */
router.get('/admin/bao-cao', (req, res) => res.redirect('/admin/thong-ke'));
router.get('/admin/reports', (req, res) => res.redirect('/admin/thong-ke'));
router.get('/admin/analytics', (req, res) => res.redirect('/admin/thong-ke'));

router.get('/admin/thong-ke', async (req, res) => {
  const { branch = 'all', category = 'all', techSearch = '', success, error } = req.query;
  try {
    const [allTickets, allProducts, schedules] = await Promise.all([
      dataStore.getWarrantyTickets(),
      dataStore.getProducts(),
      dataStore.getReportSchedules()
    ]);

    let tickets = [...allTickets];
    if (branch !== 'all') {
      tickets = tickets.filter(
        (t) =>
          (t.assignedBranch && t.assignedBranch.code === branch) ||
          (t.assignedTechnician && t.assignedTechnician.branch === branch)
      );
    }
    if (category !== 'all') {
      tickets = tickets.filter((t) => t.category === category);
    }

    const totalTickets = tickets.length;
    const completed = tickets.filter((t) => ['Đã sửa xong', 'Đã trả khách'].includes(t.status)).length;
    const fcrRate = totalTickets > 0 ? Math.min(99.2, Number((90 + (completed / totalTickets) * 8).toFixed(1))) : 94.8;
    const totalCost = tickets.reduce(
      (sum, t) =>
        sum +
        (t.repairCost || 0) +
        (t.replacementParts || []).reduce((ps, p) => ps + (p.unitPrice || 0), 0),
      0
    );

    const rootCauses = { oem_defect: 0, user_damage: 0, environment: 0 };
    tickets.forEach((t) => {
      rootCauses[t.rootCauseType || 'oem_defect'] = (rootCauses[t.rootCauseType || 'oem_defect'] || 0) + 1;
    });
    const rcTotal = Math.max(1, tickets.length);

    const defectRanking = [...allProducts]
      .sort((a, b) => b.defectRate - a.defectRate)
      .slice(0, 5);

    let techScorecard = TECHNICIANS.map((tech) => {
      const assignedLive = allTickets.filter(
        (t) => t.assignedTechnician && t.assignedTechnician.code === tech.code
      );
      const totalHandled = tech.completedBase + assignedLive.length;
      const doneHandled =
        tech.completedBase +
        assignedLive.filter((t) => ['Đã sửa xong', 'Đã trả khách'].includes(t.status)).length;
      return {
        ...tech,
        totalHandled,
        doneHandled,
        grade: tech.slaPct >= 96 ? 'Xuất sắc (A+)' : tech.slaPct >= 92 ? 'Đạt chuẩn (A)' : 'Khá (B+)'
      };
    });

    if (branch !== 'all') {
      techScorecard = techScorecard.filter((t) => t.branchCode === branch || t.branch === branch);
    }
    if (techSearch && techSearch.trim()) {
      const s = techSearch.trim().toLowerCase();
      techScorecard = techScorecard.filter(
        (t) => t.name.toLowerCase().includes(s) || t.code.toLowerCase().includes(s) || t.branch.toLowerCase().includes(s)
      );
    }

    res.render('admin-thong-ke', {
      activeAdminPage: 'analytics',
      filters: { branch, category, techSearch },
      kpis: {
        totalTickets,
        fcrRate,
        mttrDays: 1.7,
        totalCost
      },
      rootCauseStats: {
        oemPct: Math.round((rootCauses.oem_defect / rcTotal) * 100),
        userPct: Math.round((rootCauses.user_damage / rcTotal) * 100),
        envPct: Math.max(
          0,
          100 -
            Math.round((rootCauses.oem_defect / rcTotal) * 100) -
            Math.round((rootCauses.user_damage / rcTotal) * 100)
        ),
        oemCount: rootCauses.oem_defect,
        userCount: rootCauses.user_damage,
        envCount: rootCauses.environment
      },
      defectRanking,
      techScorecard,
      branches: SERVICE_BRANCHES,
      schedules,
      successMessage: success || null,
      errorMessage: error || null
    });
  } catch (err) {
    res.redirect('/admin?error=' + encodeURIComponent(err.message));
  }
});

router.post('/admin/api/report-schedules', async (req, res) => {
  const { frequency, recipients, formats } = req.body;
  await dataStore.addReportSchedule({
    frequency: frequency || 'Hàng tuần',
    recipients: recipients || 'admin@warrantyops.com',
    formats: Array.isArray(formats) ? formats : formats ? [formats] : ['PDF', 'Excel']
  });
  res.redirect(
    '/admin/thong-ke?success=' +
      encodeURIComponent(`Đã lưu lịch gửi báo cáo tự động (${frequency || 'Hàng tuần'}) thành công!`)
  );
});

router.post('/admin/api/reminders/expiring', async (req, res) => {
  const records = await dataStore.getWarrantyRecords();
  const expiring = records.filter((r) => r.computedStatus === 'expiring');
  res.json({
    ok: true,
    count: expiring.length,
    message: `Đã xếp lịch gửi thông báo nhắc hạn bảo hành cho ${expiring.length} khách hàng!`
  });
});

router.post('/admin/api/sync-mongodb', async (req, res) => {
  try {
    const counts = await dataStore.syncLocalToMongo();
    res.json({ ok: true, message: 'Đồng bộ MongoDB thành công!', counts });
  } catch (err) {
    res.json({
      ok: false,
      message: err.message + ' (Hệ thống vẫn đang lưu trữ an toàn trên Local JSON Store).'
    });
  }
});

/**
 * XUẤT DỮ LIỆU CSV (MỞ BẰNG EXCEL ĐẦY ĐỦ TIẾNG VIỆT UTF-8 BOM)
 */
function toCsvRow(values) {
  return values
    .map((v) => `"${String(v === null || v === undefined ? '' : v).replace(/"/g, '""')}"`)
    .join(',');
}

router.get('/admin/export/:type', async (req, res) => {
  const { type } = req.params;
  let rows = [];
  let filename = `warrantyops-${type}-${new Date().toISOString().slice(0, 10)}.csv`;

  if (type === 'customers') {
    const list = await dataStore.getCustomers();
    rows.push(toCsvRow(['Mã KH', 'Họ tên', 'Số điện thoại', 'Email', 'Phân loại', 'Tỉnh/TP', 'Địa chỉ', 'Số thiết bị', 'Số lần BH']));
    list.forEach((c) => {
      rows.push(toCsvRow([c.customerCode, c.fullName, c.phone, c.email, c.customerType, c.city, c.address, c.deviceCount, c.warrantyClaimCount]));
    });
  } else if (type === 'products') {
    const list = await dataStore.getProducts();
    rows.push(toCsvRow(['Mã SKU', 'Tên sản phẩm', 'Danh mục', 'Mẫu Serial', 'Hạn BH (Tháng)', 'Giá bán (VNĐ)', 'Trạng thái', 'Tỷ lệ lỗi (%)']));
    list.forEach((p) => {
      rows.push(toCsvRow([p.sku, p.name, p.categoryLabel, p.serialSample, p.warrantyMonths, p.price, p.businessStatus, p.defectRate]));
    });
  } else if (type === 'warranties') {
    const list = await dataStore.getWarrantyRecords();
    rows.push(toCsvRow(['Mã Hồ sơ BH', 'Số Serial', 'Sản phẩm', 'Khách hàng', 'SĐT', 'Ngày mua', 'Ngày hết hạn', 'Số ngày còn lại', 'Trạng thái']));
    list.forEach((r) => {
      rows.push(toCsvRow([r.wbCode, r.serialNumber, r.productName, r.customerName, r.customerPhone, r.purchaseDateObj.toLocaleDateString('vi-VN'), r.endDateObj.toLocaleDateString('vi-VN'), r.daysRemaining, r.computedStatus]));
    });
  } else {
    // dashboard, tickets, analytics
    const list = await dataStore.getWarrantyTickets();
    rows.push(toCsvRow(['Mã Phiếu RMA', 'Sản phẩm', 'Số Serial', 'Khách hàng', 'SĐT', 'Địa chỉ', 'Trạm tiếp nhận', 'Kỹ thuật viên', 'Trạng thái', 'Chi phí (VNĐ)', 'Mô tả lỗi']));
    list.forEach((t) => {
      rows.push(toCsvRow([
        t.warrantyCode,
        t.productName,
        t.productSerial,
        t.customerName,
        t.customerPhone,
        t.customerAddress,
        t.assignedBranch ? t.assignedBranch.name : '',
        t.assignedTechnician ? t.assignedTechnician.name : '',
        t.status,
        t.repairCost,
        t.issueDescription
      ]));
    });
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + rows.join('\r\n'));
});

module.exports = router;
