import { normalizeVietnamese } from "../utils/formatters.js";

export const SERVICE_BRANCHES = [
  {
    code: "HN-CG",
    name: "Trạm Hà Nội — Cầu Giấy",
    shortCenter: "TTBH Hà Nội",
    city: "Hà Nội",
    address: "Tầng 2, Tòa Technosoft, Phố Duy Tân, Cầu Giấy, Hà Nội",
    phone: "024.3888.6868",
    openHours: "08:00 – 20:30 (T2–CN)",
    lat: 21.0306,
    lng: 105.7826,
    slaHours: 2,
    loadPercent: 32,
    loadLabel: "Tải thấp",
    specialties: ["Laptop/Máy tính", "Màn hình", "Linh kiện", "Thiết bị gia dụng", "Khác"],
    keywords: [
      "cau giay",
      "duy tan",
      "tran thai tong",
      "nam tu liem",
      "my dinh",
      "bac tu liem",
      "tay ho",
      "ba dinh",
      "hoai duc",
      "ha noi",
      "hn",
    ],
    districtPriority: ["cau giay", "duy tan", "nam tu liem", "my dinh", "bac tu liem", "tay ho", "ba dinh"],
  },
  {
    code: "HN-TX",
    name: "Trạm Hà Nội — Thanh Xuân",
    shortCenter: "TTBH Hà Nội",
    city: "Hà Nội",
    address: "128 Nguyễn Trãi, P. Thượng Đình, Thanh Xuân, Hà Nội",
    phone: "024.3999.6868",
    openHours: "08:00 – 20:30 (T2–CN)",
    lat: 20.9967,
    lng: 105.8127,
    slaHours: 1.5,
    loadPercent: 54,
    loadLabel: "Tải trung bình",
    specialties: ["Điện thoại", "Laptop/Máy tính", "Thiết bị âm thanh", "Phụ kiện"],
    keywords: [
      "thanh xuan",
      "nguyen trai",
      "le van luong",
      "dong da",
      "ha dong",
      "hoang mai",
      "hai ba trung",
      "pho_hue_hn",
      "hoan kiem",
      "long bien",
      "ha noi",
      "hn",
    ],
    districtPriority: ["thanh xuan", "dong da", "ha dong", "hoang mai", "hai ba trung", "hoan kiem"],
  },
  {
    code: "DN-HC",
    name: "Trạm Đà Nẵng — Hải Châu",
    shortCenter: "TTBH Đà Nẵng",
    city: "Đà Nẵng",
    address: "36 Đặng Nguyên Cẩn, P. Hòa Cường Bắc, Hải Châu, Đà Nẵng",
    phone: "0236.368.6868",
    openHours: "08:00 – 20:00 (T2–CN)",
    lat: 16.0389,
    lng: 108.2219,
    slaHours: 2,
    loadPercent: 24,
    loadLabel: "Tải thấp",
    specialties: ["Laptop/Máy tính", "Điện thoại", "Màn hình", "Thiết bị âm thanh", "Phụ kiện", "Khác"],
    keywords: [
      "da nang",
      "hai chau",
      "bach dang",
      "thanh khe",
      "son tra",
      "ngu hanh son",
      "cam le",
      "lien chieu",
      "hue",
      "quang nam",
      "hoi an",
      "mien trung",
    ],
    districtPriority: ["hai chau", "thanh khe", "son tra", "cam le", "ngu hanh son", "lien chieu"],
  },
  {
    code: "HCM-BT",
    name: "Trạm TP.HCM — Bình Thạnh",
    shortCenter: "TTBH TP.HCM",
    city: "TP. Hồ Chí Minh",
    address: "38/45 Ung Văn Khiêm, Phường 25, Bình Thạnh, TP. Hồ Chí Minh",
    phone: "028.3512.6868",
    openHours: "08:00 – 20:30 (T2–CN)",
    lat: 10.8038,
    lng: 106.7165,
    slaHours: 2,
    loadPercent: 45,
    loadLabel: "Tải trung bình",
    specialties: ["Laptop/Máy tính", "Màn hình", "Linh kiện", "Phụ kiện", "Khác"],
    keywords: [
      "binh thanh",
      "ung van khiem",
      "phan van tri",
      "thu duc",
      "go vap",
      "phu nhuan",
      "quan 2",
      "quan 9",
      "binh duong",
      "dong nai",
      "tp hcm",
      "ho chi minh",
      "hcm",
      "sai gon",
    ],
    districtPriority: ["binh thanh", "thu duc", "go vap", "phu nhuan", "quan 2", "quan 9"],
  },
  {
    code: "HCM-Q1",
    name: "Trạm TP.HCM — Trung tâm Q.1 / Q.3",
    shortCenter: "TTBH TP.HCM",
    city: "TP. Hồ Chí Minh",
    address: "142 Nguyễn Thị Minh Khai, P. Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh",
    phone: "028.3930.6868",
    openHours: "08:00 – 21:00 (T2–CN)",
    lat: 10.7775,
    lng: 106.6915,
    slaHours: 1.5,
    loadPercent: 66,
    loadLabel: "Tải khá cao",
    specialties: ["Điện thoại", "Laptop/Máy tính", "Thiết bị âm thanh", "Phụ kiện"],
    keywords: [
      "quan 1",
      "q1",
      "le loi",
      "ben thanh",
      "quan 3",
      "q3",
      "quan 4",
      "quan 5",
      "quan 7",
      "quan 10",
      "tan binh",
      "tan phu",
      "tp hcm",
      "ho chi minh",
      "hcm",
      "sai gon",
    ],
    districtPriority: ["quan 1", "q1", "quan 3", "q3", "quan 5", "quan 10", "quan 7", "tan binh"],
  },
];

export const TECHNICIANS = [
  {
    code: "KTV-01",
    name: "Lê Minh Trí",
    level: "Bậc 5/5",
    branch: "TTBH Hà Nội",
    branchCode: "HN-CG",
    teamName: "Đội Laptop & Mainboard",
    completedBase: 142,
    mttrDays: 1.4,
    slaPct: 98.6,
    csat: 4.9,
  },
  {
    code: "KTV-02",
    name: "Nguyễn Quốc Bảo",
    level: "Bậc 4/5",
    branch: "TTBH TP.HCM",
    branchCode: "HCM-Q1",
    teamName: "Đội Di động & Màn hình",
    completedBase: 128,
    mttrDays: 1.6,
    slaPct: 96.4,
    csat: 4.8,
  },
  {
    code: "KTV-05",
    name: "Trần Đình Khôi",
    level: "Bậc 4/5",
    branch: "TTBH Đà Nẵng",
    branchCode: "DN-HC",
    teamName: "Đội Kỹ thuật Đa năng",
    completedBase: 94,
    mttrDays: 1.7,
    slaPct: 95.8,
    csat: 4.8,
  },
  {
    code: "KTV-08",
    name: "Phạm Hoàng Sơn",
    level: "Bậc 3/5",
    branch: "TTBH TP.HCM",
    branchCode: "HCM-BT",
    teamName: "Đội Phần cứng & Nguồn",
    completedBase: 105,
    mttrDays: 2.1,
    slaPct: 92.5,
    csat: 4.7,
  },
  {
    code: "KTV-11",
    name: "Đỗ Tuấn Kiệt",
    level: "Bậc 3/5",
    branch: "TTBH Hà Nội",
    branchCode: "HN-TX",
    teamName: "Đội Thiết bị Cầm tay",
    completedBase: 86,
    mttrDays: 2.2,
    slaPct: 91.4,
    csat: 4.6,
  },
];

const hasTokenMatch = (normText, token) => {
  if (!normText || !token) return false;
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`).test(normText);
};

const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Tính khoảng cách thực tế (km) theo công thức Haversine (nhân hệ số đường bộ ~1.25x trong đô thị)
 */
export const haversineRoadKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const straightKm = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((straightKm * 1.25).toFixed(1));
};

export const formatTravelEstimate = (km) => {
  if (km <= 1) return "3 – 5 phút đi xe";
  if (km <= 15) {
    const mins = Math.max(5, Math.round((km / 24) * 60));
    return `~${mins} phút đi xe`;
  }
  if (km <= 80) {
    const mins = Math.round((km / 42) * 60);
    return `~${mins} phút di chuyển`;
  }
  const hrs = (km / 55).toFixed(1);
  return `~${hrs} giờ (nên gửi chuyển phát nhanh)`;
};

export const buildDirectionsUrl = ({ userCoords, originAddress, branch }) => {
  const dest = `${branch.lat},${branch.lng}`;
  if (userCoords && Number.isFinite(userCoords.lat) && Number.isFinite(userCoords.lng)) {
    return `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${dest}&travelmode=driving`;
  }
  if (originAddress && originAddress.trim()) {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originAddress.trim())}&destination=${encodeURIComponent(branch.address)}&travelmode=driving`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`;
};

export const buildEmbedMapUrl = (branch) =>
  `https://maps.google.com/maps?q=${branch.lat},${branch.lng}&z=15&output=embed`;

/**
 * Tự động bóc tách địa chỉ từ các trường thông tin trên hồ sơ / giấy bảo hành
 */
export const extractAddressFromRecord = (record = {}) => {
  const direct = String(record.customerAddress || "").trim();
  if (direct.length >= 4) {
    return { found: true, address: direct, source: "Địa chỉ trên giấy bảo hành" };
  }

  const place = String(record.purchasePlace || "").trim();
  const geoHintRegex = /(ha noi|ho chi minh|tp\.?\s*hcm|sai gon|da nang|quan\s*\d+|q\.\s*\d+|cau giay|thanh xuan|binh thanh|hai chau|dong da|thu duc)/i;
  if (place && geoHintRegex.test(normalizeVietnamese(place))) {
    return { found: true, address: place, source: "Nơi mua / Đại lý phát hành" };
  }

  const notes = String(record.notes || "").trim();
  if (notes) {
    const match = notes.match(/(?:địa chỉ|dc|tại|ở)\s*[:\-]?\s*([^\n.;]{6,100})/i);
    if (match?.[1]) {
      return { found: true, address: match[1].trim(), source: "Trích xuất tự động từ ghi chú" };
    }
    if (geoHintRegex.test(normalizeVietnamese(notes))) {
      return { found: true, address: notes.slice(0, 90), source: "Trích xuất từ ghi chú hồ sơ" };
    }
  }

  return { found: false, address: "", source: "" };
};

export const parseUserCoords = (lat, lng) => {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (
    lat !== undefined &&
    lng !== undefined &&
    lat !== "" &&
    lng !== "" &&
    Number.isFinite(nLat) &&
    Number.isFinite(nLng) &&
    Math.abs(nLat) <= 90 &&
    Math.abs(nLng) <= 180
  ) {
    return { lat: nLat, lng: nLng };
  }
  return null;
};

export const analyzeAddressForBranch = (
  rawAddress = "",
  category = "",
  issueDescription = "",
  userCoords = null
) => {
  const cleaned = String(rawAddress || "").trim();
  const norm = normalizeVietnamese(cleaned)
    .replace(/\bq\s+(\d+)\b/g, "q$1")
    .replace(/\bquan\s+(\d+)\b/g, "quan $1")
    .replace(/\bpho\s+hue\b/g, "pho_hue_hn");

  const hasGps = Boolean(userCoords && Number.isFinite(userCoords.lat) && Number.isFinite(userCoords.lng));

  if (!norm && !hasGps) {
    return {
      matched: false,
      gpsUsed: false,
      branches: SERVICE_BRANCHES,
      technicians: TECHNICIANS,
      message: "Nhập địa chỉ trên hồ sơ/phiếu hoặc bật định vị GPS để AI định tuyến trạm gần nhất.",
    };
  }

  const scored = SERVICE_BRANCHES.map((branch) => {
    let geoScore = 0;
    const matchedTokens = [];
    let districtMatched = false;

    if (norm) {
      for (const d of branch.districtPriority) {
        if (hasTokenMatch(norm, d)) {
          geoScore += 65;
          matchedTokens.push(d);
          districtMatched = true;
          break;
        }
      }
      for (const kw of branch.keywords) {
        if (matchedTokens.includes(kw)) continue;
        if (hasTokenMatch(norm, kw)) {
          geoScore += kw.length > 6 ? 25 : 18;
          matchedTokens.push(kw);
        }
      }
    }

    let distanceKm = null;
    let gpsScore = 0;
    if (hasGps) {
      distanceKm = haversineRoadKm(userCoords.lat, userCoords.lng, branch.lat, branch.lng);
      // Ưu tiên rất cao cho trạm gần định vị GPS hiện tại
      if (distanceKm <= 5) gpsScore = 95;
      else if (distanceKm <= 15) gpsScore = 80;
      else if (distanceKm <= 40) gpsScore = 60;
      else if (distanceKm <= 150) gpsScore = 30;
      else gpsScore = Math.max(0, 15 - Math.floor(distanceKm / 150));
    }

    const specialtyScore = category && branch.specialties.includes(category) ? 14 : 0;
    const loadScore = Math.round((100 - branch.loadPercent) * 0.14);

    // Nếu có GPS thì ưu tiên GPS + chuyên môn + tải; nếu không có GPS thì dùng phân tích địa chỉ văn bản
    const totalScore = hasGps
      ? gpsScore * 1.4 + geoScore * 0.35 + specialtyScore + loadScore
      : geoScore + specialtyScore + loadScore;

    return { branch, totalScore, geoScore, gpsScore, distanceKm, matchedTokens, districtMatched };
  }).sort((a, b) => b.totalScore - a.totalScore);

  const best = scored[0];
  const hasGeoHit = best.matchedTokens.length > 0;
  const isDistrictExact = best.districtMatched;

  // Tìm riêng trạm khớp địa chỉ giấy (để so sánh nếu GPS hiện tại đang ở thành phố khác)
  const addressBest = norm
    ? [...scored].sort((a, b) => b.geoScore - a.geoScore)[0]
    : null;

  const distanceText =
    best.distanceKm !== null
      ? `${best.distanceKm} km (từ vị trí GPS)`
      : isDistrictExact
        ? "1.5 – 3.5 km"
        : hasGeoHit
          ? "5.0 – 9.0 km"
          : "Điều phối trung tâm";

  const travelTimeText =
    best.distanceKm !== null
      ? formatTravelEstimate(best.distanceKm)
      : isDistrictExact
        ? "10 – 15 phút"
        : hasGeoHit
          ? "20 – 30 phút"
          : "Thu nhận chuyển phát nhanh";

  const confidence =
    best.distanceKm !== null
      ? best.distanceKm <= 25
        ? 99
        : 92
      : isDistrictExact
        ? 97
        : hasGeoHit
          ? 87
          : 68;

  const reasonParts = [];
  if (hasGps && best.distanceKm !== null) {
    reasonParts.push(
      `Từ định vị GPS hiện tại, ${best.branch.name} là trung tâm gần bạn nhất (${best.distanceKm} km, ${travelTimeText}).`
    );
    if (addressBest && addressBest.geoScore > 0 && addressBest.branch.code !== best.branch.code) {
      reasonParts.push(
        `Lưu ý: Địa chỉ trên giấy bảo hành thuộc cụm ${addressBest.branch.name}, bạn có thể chọn mang tới trạm gần GPS hiện tại hoặc gửi về trạm trên giấy.`
      );
    }
  } else if (isDistrictExact) {
    reasonParts.push(`Khớp trực tiếp khu vực phục vụ ưu tiên của ${best.branch.name}.`);
  } else if (hasGeoHit) {
    reasonParts.push(`Nhận diện địa bàn thuộc ${best.branch.city}, tối ưu quãng đường di chuyển.`);
  } else {
    reasonParts.push(`Chưa tách rõ quận/huyện, hệ thống ưu tiên trạm có công suất trống tốt nhất.`);
  }

  if (category && best.branch.specialties.includes(category)) {
    reasonParts.push(`Sẵn kho linh kiện & chuyên môn cho nhóm "${category}".`);
  }
  if (issueDescription && issueDescription.trim()) {
    reasonParts.push(
      `Tải trạm ${best.branch.loadPercent}% (${best.branch.loadLabel.toLowerCase()}), SLA ${best.branch.slaHours}h.`
    );
  }

  const recommendedTech = TECHNICIANS.find((t) => t.branchCode === best.branch.code) || TECHNICIANS[0];
  const directionsUrl = buildDirectionsUrl({
    userCoords: hasGps ? userCoords : null,
    originAddress: cleaned,
    branch: best.branch,
  });

  const enrichBranch = (item) => ({
    code: item.branch.code,
    name: item.branch.name,
    city: item.branch.city,
    address: item.branch.address,
    phone: item.branch.phone,
    openHours: item.branch.openHours,
    lat: item.branch.lat,
    lng: item.branch.lng,
    loadLabel: item.branch.loadLabel,
    loadPercent: item.branch.loadPercent,
    slaHours: item.branch.slaHours,
    distanceKm: item.distanceKm,
    distanceText:
      item.distanceKm !== null ? `${item.distanceKm} km` : item.districtMatched ? "1.5 – 3.5 km" : "Liên khu vực",
    travelTimeText:
      item.distanceKm !== null ? formatTravelEstimate(item.distanceKm) : "Xem tuyến đường",
    directionsUrl: buildDirectionsUrl({
      userCoords: hasGps ? userCoords : null,
      originAddress: cleaned,
      branch: item.branch,
    }),
    embedMapUrl: buildEmbedMapUrl(item.branch),
  });

  return {
    matched: true,
    gpsUsed: hasGps,
    inputAddress: cleaned,
    confidence,
    detectedCity: hasGeoHit || hasGps ? best.branch.city : "Toàn quốc",
    primary: {
      ...best.branch,
      distanceKm: best.distanceKm,
      distanceText,
      travelTimeText,
      directionsUrl,
      embedMapUrl: buildEmbedMapUrl(best.branch),
      reason: reasonParts.join(" "),
      recommendedTech,
    },
    alternatives: scored.slice(1, 3).map(enrichBranch),
    allRanked: scored.map(enrichBranch),
  };
};

/**
 * AI Tự động quét toàn bộ hồ sơ sắp hết hạn, bóc tách địa chỉ trên giấy BH,
 * kết hợp định vị GPS hiện tại để đề xuất tuyến đường & trung tâm gần nhất.
 */
export const buildExpiringSmartAdvice = (decoratedRecords = [], userCoords = null) => {
  const hasGps = Boolean(userCoords && Number.isFinite(userCoords.lat) && Number.isFinite(userCoords.lng));

  // Quét các hồ sơ sắp hết hạn (<= 30 ngày) hoặc vừa hết hạn trong 15 ngày gần đây (trừ hồ sơ đã thu hồi)
  const candidates = decoratedRecords
    .filter(
      (r) =>
        r.computedStatus !== "rejected" &&
        typeof r.daysRemaining === "number" &&
        r.daysRemaining <= 30 &&
        r.daysRemaining >= -15
    )
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const items = candidates.map((rec) => {
    const extracted = extractAddressFromRecord(rec);
    const routing = analyzeAddressForBranch(
      extracted.address,
      rec.category || "Laptop/Máy tính",
      "Kiểm tra tổng quát trước khi hết hạn bảo hành",
      hasGps ? userCoords : null
    );

    let urgency = "warning";
    let urgencyLabel = `Còn ${rec.daysRemaining} ngày`;
    let aiActionAdvice = "";

    if (rec.daysRemaining < 0) {
      urgency = "expired_recent";
      urgencyLabel = `Vừa quá hạn ${Math.abs(rec.daysRemaining)} ngày`;
      aiActionAdvice = `Hồ sơ vừa quá hạn ${Math.abs(rec.daysRemaining)} ngày — bạn có thể gia hạn nhanh +12 tháng hoặc mang tới ${routing.primary?.name || "trạm gần nhất"} để hưởng gói bảo dưỡng ưu đãi thành viên.`;
    } else if (rec.daysRemaining <= 7) {
      urgency = "critical";
      urgencyLabel = `Khẩn cấp · Còn ${rec.daysRemaining} ngày`;
      aiActionAdvice = `Thiết bị chỉ còn ${rec.daysRemaining} ngày bảo hành! AI khuyến nghị mang máy kiểm tra miễn phí toàn diện ngay tại ${routing.primary?.name || "trạm gần nhất"} trước ngày đáo hạn.`;
    } else {
      urgency = "warning";
      urgencyLabel = `Sắp đáo hạn · Còn ${rec.daysRemaining} ngày`;
      aiActionAdvice = `Nên lên lịch kiểm tra pin, màn hình và linh kiện định kỳ tại ${routing.primary?.name || "trạm ủy quyền"} hoặc gia hạn thêm gói bảo vệ.`;
    }

    return {
      record: {
        _id: rec._id,
        wbCode: rec.wbCode,
        serialNumber: rec.serialNumber,
        productName: rec.productName,
        category: rec.category,
        customerName: rec.customerName,
        customerPhone: rec.customerPhone,
        customerAddress: rec.customerAddress || "",
        endDate: rec.endDate,
        daysRemaining: rec.daysRemaining,
        computedStatus: rec.computedStatus,
        packageName: rec.packageName,
      },
      urgency,
      urgencyLabel,
      extractedAddress: extracted,
      aiActionAdvice,
      routing,
    };
  });

  // Danh sách toàn bộ trung tâm sắp xếp gần nhất từ GPS (nếu bật GPS)
  const nearestCenters = SERVICE_BRANCHES.map((b) => {
    const distanceKm = hasGps ? haversineRoadKm(userCoords.lat, userCoords.lng, b.lat, b.lng) : null;
    return {
      code: b.code,
      name: b.name,
      city: b.city,
      address: b.address,
      phone: b.phone,
      openHours: b.openHours,
      lat: b.lat,
      lng: b.lng,
      loadPercent: b.loadPercent,
      loadLabel: b.loadLabel,
      slaHours: b.slaHours,
      distanceKm,
      distanceText: distanceKm !== null ? `${distanceKm} km` : b.city,
      travelTimeText: distanceKm !== null ? formatTravelEstimate(distanceKm) : b.openHours,
      directionsUrl: buildDirectionsUrl({
        userCoords: hasGps ? userCoords : null,
        originAddress: "",
        branch: b,
      }),
      embedMapUrl: buildEmbedMapUrl(b),
    };
  }).sort((a, b) => {
    if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
    return a.loadPercent - b.loadPercent;
  });

  return {
    gpsActive: hasGps,
    userCoords: hasGps ? userCoords : null,
    summary: {
      totalExpiring: items.length,
      criticalCount: items.filter((i) => i.urgency === "critical").length,
      withAddressCount: items.filter((i) => i.extractedAddress.found).length,
      nearestCenterName: nearestCenters[0]?.name || "",
      nearestCenterDistanceKm: nearestCenters[0]?.distanceKm ?? null,
    },
    items,
    nearestCenters,
  };
};
