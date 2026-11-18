import { normalizeVietnamese } from "../utils/formatters.js";

export const SERVICE_BRANCHES = [
  {
    code: "HN-CG",
    name: "Trạm Hà Nội — Cầu Giấy",
    shortCenter: "TTBH Hà Nội",
    city: "Hà Nội",
    address: "Tầng 2, Tòa Technosoft, Phố Duy Tân, Cầu Giấy, Hà Nội",
    phone: "024.3888.6868",
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
    slaHours: 2,
    loadPercent: 24,
    loadLabel: "Tải thấp",
    specialties: ["Laptop/Máy tính", "Điện thoại", "Màn hình", "Thiết bị âm thanh", "Phụ kiện", "Khác"],
    keywords: [
      "da nang",
      "hai chau",
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

export const analyzeAddressForBranch = (rawAddress = "", category = "", issueDescription = "") => {
  const cleaned = String(rawAddress || "").trim();
  const norm = normalizeVietnamese(cleaned);

  if (!norm) {
    return {
      matched: false,
      branches: SERVICE_BRANCHES,
      technicians: TECHNICIANS,
      message: "Nhập địa chỉ trên hồ sơ/phiếu để AI tự động định tuyến trạm tiếp nhận gần nhất.",
    };
  }

  const scored = SERVICE_BRANCHES.map((branch) => {
    let score = 0;
    const matchedTokens = [];

    for (const d of branch.districtPriority) {
      if (norm.includes(d)) {
        score += 55;
        matchedTokens.push(d);
        break;
      }
    }

    for (const kw of branch.keywords) {
      if (norm.includes(kw)) {
        score += kw.length > 6 ? 25 : 18;
        if (!matchedTokens.includes(kw)) matchedTokens.push(kw);
      }
    }

    if (category && branch.specialties.includes(category)) {
      score += 14;
    }

    score += Math.round((100 - branch.loadPercent) * 0.14);

    return { branch, score, matchedTokens };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  const hasGeoHit = best.matchedTokens.length > 0;
  const isDistrictExact = best.branch.districtPriority.some((d) => norm.includes(d));

  const distanceText = isDistrictExact
    ? "1.5 – 3.5 km"
    : hasGeoHit
      ? "5.0 – 9.0 km"
      : "Điều phối trung tâm";

  const travelTimeText = isDistrictExact
    ? "10 – 15 phút"
    : hasGeoHit
      ? "20 – 30 phút"
      : "Thu nhận chuyển phát nhanh";

  const confidence = isDistrictExact ? 97 : hasGeoHit ? 87 : 68;

  const reasonParts = [];
  if (isDistrictExact) {
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
    reasonParts.push(`Công suất hiện tại ${best.branch.loadPercent}% (${best.branch.loadLabel.toLowerCase()}), SLA tiếp nhận ${best.branch.slaHours}h.`);
  }

  const recommendedTech = TECHNICIANS.find((t) => t.branchCode === best.branch.code) || TECHNICIANS[0];

  return {
    matched: true,
    inputAddress: cleaned,
    confidence,
    detectedCity: hasGeoHit ? best.branch.city : "Toàn quốc",
    primary: {
      ...best.branch,
      distanceText,
      travelTimeText,
      reason: reasonParts.join(" "),
      recommendedTech,
    },
    alternatives: scored.slice(1, 3).map((item) => ({
      code: item.branch.code,
      name: item.branch.name,
      city: item.branch.city,
      address: item.branch.address,
      loadLabel: item.branch.loadLabel,
      loadPercent: item.branch.loadPercent,
      slaHours: item.branch.slaHours,
    })),
  };
};
