import { Customer } from "../models/customerModel.js";
import { Product } from "../models/productModel.js";
import { WarrantyRecord } from "../models/warrantyRecordModel.js";
import { WarrantyTicket } from "../models/warrantyTicketModel.js";
import { IS_DB_CONNECTED } from "../config/mongodb.js";
import { decorateRecord, decorateTicket } from "../utils/formatters.js";
import { SERVICE_BRANCHES, TECHNICIANS } from "./aiBranchService.js";
import { productService } from "./productService.js";

const getOverview = async ({ range = "all" } = {}) => {
  const [customers, products, rawRecords, rawTickets] = await Promise.all([
    Customer.find({}).lean(),
    Product.find({}).lean(),
    WarrantyRecord.find({}).sort({ endDate: 1 }),
    WarrantyTicket.find({}).sort({ receivedDate: -1 }),
  ]);

  const records = rawRecords.map(decorateRecord);
  const allTickets = rawTickets.map(decorateTicket);

  const now = Date.now();
  const tickets = allTickets.filter((t) => {
    const ts = new Date(t.receivedDate || t.createdAt).getTime();
    if (range === "today") return now - ts <= 24 * 3600 * 1000;
    if (range === "7days") return now - ts <= 7 * 24 * 3600 * 1000;
    if (range === "month") return now - ts <= 30 * 24 * 3600 * 1000;
    return true;
  });

  const activeRecords = records.filter((r) => ["active", "expiring"].includes(r.computedStatus));
  const expiringAlerts = records
    .filter((r) => r.computedStatus === "expiring" || (r.daysRemaining < 0 && r.daysRemaining >= -15))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const openTickets = tickets.filter((t) => !["Đã trả khách", "Từ chối bảo hành"].includes(t.status));
  const completedTickets = tickets.filter((t) => ["Đã sửa xong", "Đã trả khách"].includes(t.status));
  const slaBreached = openTickets.filter((t) => t.isSlaBreached).length;
  const slaRate =
    tickets.length > 0
      ? Math.min(99.6, Math.max(86, Number((((tickets.length - slaBreached) / tickets.length) * 100).toFixed(1))))
      : 97.4;

  const faultCounts = { screen: 0, power_battery: 0, mainboard: 0, other: 0 };
  allTickets.forEach((t) => {
    const key = t.faultCategory || "other";
    faultCounts[key] = (faultCounts[key] || 0) + 1;
  });
  const totalFaults = Math.max(1, allTickets.length);

  const faultDistribution = [
    {
      key: "screen",
      label: "Màn hình & Hiển thị",
      count: faultCounts.screen,
      pct: Math.round((faultCounts.screen / totalFaults) * 100),
      color: "#4f46e5",
    },
    {
      key: "power_battery",
      label: "Nguồn, Sạc & Pin",
      count: faultCounts.power_battery,
      pct: Math.round((faultCounts.power_battery / totalFaults) * 100),
      color: "#0ea5e9",
    },
    {
      key: "mainboard",
      label: "Bo mạch & Kết nối",
      count: faultCounts.mainboard,
      pct: Math.round((faultCounts.mainboard / totalFaults) * 100),
      color: "#10b981",
    },
    {
      key: "other",
      label: "Ngoại vi & Khác",
      count: faultCounts.other,
      pct: Math.max(
        0,
        100 -
          Math.round((faultCounts.screen / totalFaults) * 100) -
          Math.round((faultCounts.power_battery / totalFaults) * 100) -
          Math.round((faultCounts.mainboard / totalFaults) * 100)
      ),
      color: "#94a3b8",
    },
  ];

  return {
    dbConnected: IS_DB_CONNECTED(),
    kpis: {
      totalRecords: records.length,
      activeRecords: activeRecords.length,
      expiringCount: expiringAlerts.length,
      totalTickets: allTickets.length,
      openTickets: openTickets.length,
      completedTickets: completedTickets.length,
      slaBreached,
      slaRate,
      customerCount: customers.length,
      productCount: products.length,
    },
    expiringAlerts,
    recentTickets: tickets.slice(0, 8),
    recentRecords: records.slice(0, 6),
    faultDistribution,
    branches: SERVICE_BRANCHES,
  };
};

const getAnalyticsReport = async ({ branch = "all", category = "all" } = {}) => {
  const [rawTickets, prodResult] = await Promise.all([
    WarrantyTicket.find({}).lean(),
    productService.listProducts(),
  ]);

  let tickets = rawTickets.map(decorateTicket);
  if (branch !== "all") {
    tickets = tickets.filter((t) => t.assignedBranch?.code === branch);
  }
  if (category !== "all") {
    tickets = tickets.filter((t) => t.category === category);
  }

  const totalTickets = tickets.length;
  const completed = tickets.filter((t) => ["Đã sửa xong", "Đã trả khách"].includes(t.status)).length;
  const fcrRate =
    totalTickets > 0 ? Math.min(99.2, Number((91 + (completed / totalTickets) * 7.5).toFixed(1))) : 95.4;

  const totalCost = tickets.reduce(
    (sum, t) =>
      sum +
      (t.repairCost || 0) +
      (t.replacementParts || []).reduce((ps, p) => ps + (p.unitPrice || 0), 0),
    0
  );

  const rootCauses = { oem_defect: 0, user_damage: 0, environment: 0 };
  tickets.forEach((t) => {
    const key = t.rootCauseType || "oem_defect";
    rootCauses[key] = (rootCauses[key] || 0) + 1;
  });
  const rcTotal = Math.max(1, tickets.length);
  const oemPct = Math.round((rootCauses.oem_defect / rcTotal) * 100);
  const userPct = Math.round((rootCauses.user_damage / rcTotal) * 100);

  const defectRanking = [...prodResult.products]
    .sort((a, b) => b.defectRate - a.defectRate)
    .slice(0, 5);

  let techScorecard = TECHNICIANS.map((tech) => {
    const assignedLive = rawTickets.filter((t) => t.assignedTechnician?.code === tech.code);
    const totalHandled = tech.completedBase + assignedLive.length;
    const doneHandled =
      tech.completedBase +
      assignedLive.filter((t) => ["Đã sửa xong", "Đã trả khách"].includes(t.status)).length;
    return {
      ...tech,
      totalHandled,
      doneHandled,
      grade: tech.slaPct >= 96 ? "Xuất sắc (A+)" : tech.slaPct >= 92 ? "Đạt chuẩn (A)" : "Khá (B+)",
    };
  });

  if (branch !== "all") {
    techScorecard = techScorecard.filter((t) => t.branchCode === branch);
  }

  return {
    kpis: {
      totalTickets,
      fcrRate,
      mttrDays: 1.6,
      totalCost,
    },
    rootCauseStats: {
      oemPct,
      userPct,
      envPct: Math.max(0, 100 - oemPct - userPct),
      oemCount: rootCauses.oem_defect,
      userCount: rootCauses.user_damage,
      envCount: rootCauses.environment,
    },
    defectRanking,
    techScorecard,
    branches: SERVICE_BRANCHES,
  };
};

const toCsvRow = (values) =>
  values
    .map((v) => `"${String(v === null || v === undefined ? "" : v).replace(/"/g, '""')}"`)
    .join(",");

const exportCsvData = async (type = "tickets") => {
  const rows = [];
  const filename = `warrantyops-${type}-${new Date().toISOString().slice(0, 10)}.csv`;

  if (type === "records" || type === "warranties") {
    const list = (await WarrantyRecord.find({}).sort({ createdAt: -1 })).map(decorateRecord);
    rows.push(
      toCsvRow([
        "Mã Chứng Nhận",
        "Số Serial",
        "Sản phẩm",
        "Khách hàng",
        "SĐT",
        "Ngày kích hoạt",
        "Ngày hết hạn",
        "Số ngày còn lại",
        "Trạng thái",
      ])
    );
    list.forEach((r) => {
      rows.push(
        toCsvRow([
          r.wbCode,
          r.serialNumber,
          r.productName,
          r.customerName,
          r.customerPhone,
          new Date(r.purchaseDate).toLocaleDateString("vi-VN"),
          new Date(r.endDate).toLocaleDateString("vi-VN"),
          r.daysRemaining,
          r.computedStatus,
        ])
      );
    });
  } else if (type === "customers") {
    const { customers } = await (await import("./customerService.js")).customerService.listCustomers();
    rows.push(
      toCsvRow(["Mã KH", "Họ tên", "SĐT", "Email", "Phân hạng", "Tỉnh/TP", "Địa chỉ", "Số chứng từ BH", "Số phiếu RMA"])
    );
    customers.forEach((c) => {
      rows.push(
        toCsvRow([
          c.customerCode,
          c.fullName,
          c.phone,
          c.email,
          c.rank,
          c.city,
          c.address,
          c.deviceCount,
          c.warrantyClaimCount,
        ])
      );
    });
  } else if (type === "products") {
    const { products } = await productService.listProducts();
    rows.push(toCsvRow(["Mã SKU", "Tên thiết bị", "Danh mục", "Thời hạn BH (tháng)", "Giá niêm yết", "Tỷ lệ lỗi (%)"]));
    products.forEach((p) => {
      rows.push(toCsvRow([p.sku, p.name, p.categoryLabel, p.warrantyMonths, p.price, p.defectRate]));
    });
  } else {
    const list = await WarrantyTicket.find({}).sort({ createdAt: -1 }).lean();
    rows.push(
      toCsvRow([
        "Mã Phiếu RMA",
        "Thiết bị",
        "Số Serial",
        "Khách hàng",
        "SĐT",
        "Trạm tiếp nhận",
        "Kỹ thuật viên",
        "Trạng thái",
        "Chi phí (VNĐ)",
        "Mô tả tình trạng",
      ])
    );
    list.forEach((t) => {
      rows.push(
        toCsvRow([
          t.warrantyCode,
          t.productName,
          t.productSerial,
          t.customerName,
          t.customerPhone,
          t.assignedBranch?.name || "",
          t.assignedTechnician?.name || "",
          t.status,
          t.repairCost || 0,
          t.issueDescription,
        ])
      );
    });
  }

  return {
    filename,
    csv: "\uFEFF" + rows.join("\r\n"),
  };
};

export const analyticsService = {
  getOverview,
  getAnalyticsReport,
  exportCsvData,
};
