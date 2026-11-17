const SERVICE_BRANCHES = [
  {
    code: 'HN-CG',
    name: 'Trạm Hà Nội — Cầu Giấy',
    shortCenter: 'TTBH Hà Nội',
    city: 'Hà Nội',
    address: 'Tầng 2, Tòa Technosoft, Phố Duy Tân, Cầu Giấy, Hà Nội',
    phone: '024.3888.6868',
    slaHours: 2,
    loadPercent: 32,
    loadLabel: 'Tải thấp',
    specialties: ['Laptop/Máy tính', 'Màn hình', 'Thiết bị gia dụng', 'Khác'],
    keywords: ['cau giay', 'duy tan', 'tran thai tong', 'nam tu liem', 'my dinh', 'bac tu liem', 'tay ho', 'ba dinh', 'hoai duc', 'son tay', 'ha noi', 'hn'],
    districtPriority: ['cau giay', 'duy tan', 'nam tu liem', 'my dinh', 'bac tu liem', 'tay ho', 'ba dinh']
  },
  {
    code: 'HN-TX',
    name: 'Trạm Hà Nội — Thanh Xuân',
    shortCenter: 'TTBH Hà Nội',
    city: 'Hà Nội',
    address: '128 Nguyễn Trãi, P. Thượng Đình, Thanh Xuân, Hà Nội',
    phone: '024.3999.6868',
    slaHours: 1.5,
    loadPercent: 54,
    loadLabel: 'Tải trung bình',
    specialties: ['Điện thoại', 'Laptop/Máy tính', 'Phụ kiện'],
    keywords: ['thanh xuan', 'nguyen trai', 'le van luong', 'dong da', 'ha dong', 'hoang mai', 'hai ba trung', 'hoan kiem', 'long bien', 'thanh tri', 'ha noi', 'hn'],
    districtPriority: ['thanh xuan', 'dong da', 'ha dong', 'hoang mai', 'hai ba trung', 'hoan kiem']
  },
  {
    code: 'DN-HC',
    name: 'Trạm Đà Nẵng — Hải Châu',
    shortCenter: 'TTBH Đà Nẵng',
    city: 'Đà Nẵng',
    address: '36 Đặng Nguyên Cẩn, P. Hòa Cường Bắc, Hải Châu, Đà Nẵng',
    phone: '0236.368.6868',
    slaHours: 2,
    loadPercent: 24,
    loadLabel: 'Tải thấp',
    specialties: ['Laptop/Máy tính', 'Điện thoại', 'Màn hình', 'Thiết bị gia dụng', 'Phụ kiện', 'Khác'],
    keywords: ['da nang', 'hai chau', 'bach dang', 'thanh khe', 'son tra', 'ngu hanh son', 'cam le', 'lien chieu', 'hoa vang', 'hue', 'quang nam', 'hoi an', 'tam ky', 'mien trung'],
    districtPriority: ['hai chau', 'thanh khe', 'son tra', 'cam le', 'ngu hanh son', 'lien chieu']
  },
  {
    code: 'HCM-BT',
    name: 'Trạm TP.HCM — Bình Thạnh',
    shortCenter: 'TTBH TP.HCM',
    city: 'TP. Hồ Chí Minh',
    address: '38/45 Ung Văn Khiêm, Phường 25, Bình Thạnh, TP. Hồ Chí Minh',
    phone: '028.3512.6868',
    slaHours: 2,
    loadPercent: 45,
    loadLabel: 'Tải trung bình',
    specialties: ['Laptop/Máy tính', 'Màn hình', 'Thiết bị gia dụng', 'Phụ kiện', 'Khác'],
    keywords: ['binh thanh', 'ung van khiem', 'phan van tri', 'thu duc', 'go vap', 'phu nhuan', 'quan 2', 'quan 9', 'binh duong', 'di an', 'thuan an', 'dong nai', 'bien hoa', 'tp hcm', 'ho chi minh', 'hcm', 'sai gon'],
    districtPriority: ['binh thanh', 'thu duc', 'go vap', 'phu nhuan', 'quan 2', 'quan 9']
  },
  {
    code: 'HCM-Q1',
    name: 'Trạm TP.HCM — Trung tâm Q.1 / Q.3',
    shortCenter: 'TTBH TP.HCM',
    city: 'TP. Hồ Chí Minh',
    address: '142 Nguyễn Thị Minh Khai, P. Võ Thị Sáu, Quận 3 (giáp Q.1), TP. Hồ Chí Minh',
    phone: '028.3930.6868',
    slaHours: 1.5,
    loadPercent: 68,
    loadLabel: 'Tải khá cao',
    specialties: ['Điện thoại', 'Laptop/Máy tính', 'Phụ kiện'],
    keywords: ['quan 1', 'q1', 'le loi', 'ben thanh', 'quan 3', 'q3', 'quan 4', 'quan 5', 'quan 6', 'quan 7', 'quan 8', 'quan 10', 'quan 11', 'tan binh', 'tan phu', 'binh tan', 'nha be', 'binh chanh', 'tp hcm', 'ho chi minh', 'hcm', 'sai gon'],
    districtPriority: ['quan 1', 'q1', 'quan 3', 'q3', 'quan 5', 'quan 10', 'quan 4', 'tan binh']
  }
];

const TECHNICIANS = [
  { code: 'KTV-01', name: 'Lê Minh Trí', level: 'Bậc 5/5', branch: 'TTBH Hà Nội', branchCode: 'HN-CG', teamName: 'Đội Laptop & Mainboard', completedBase: 142, mttrDays: 1.4, slaPct: 98.6, csat: 4.9 },
  { code: 'KTV-02', name: 'Nguyễn Quốc Bảo', level: 'Bậc 4/5', branch: 'TTBH TP.HCM', branchCode: 'HCM-Q1', teamName: 'Đội Di động & Màn hình', completedBase: 128, mttrDays: 1.6, slaPct: 96.4, csat: 4.8 },
  { code: 'KTV-05', name: 'Trần Đình Khôi', level: 'Bậc 4/5', branch: 'TTBH Đà Nẵng', branchCode: 'DN-HC', teamName: 'Đội Kỹ thuật Đa năng', completedBase: 94, mttrDays: 1.7, slaPct: 95.8, csat: 4.8 },
  { code: 'KTV-08', name: 'Phạm Hoàng Sơn', level: 'Bậc 3/5', branch: 'TTBH TP.HCM', branchCode: 'HCM-BT', teamName: 'Đội Phần cứng & Nguồn', completedBase: 105, mttrDays: 2.1, slaPct: 92.5, csat: 4.7 },
  { code: 'KTV-11', name: 'Đỗ Tuấn Kiệt', level: 'Bậc 3/5', branch: 'TTBH Hà Nội', branchCode: 'HN-TX', teamName: 'Đội Thiết bị Cầm tay', completedBase: 86, mttrDays: 2.3, slaPct: 90.2, csat: 4.6 }
];

function normalizeVietnamese(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function analyzeAddressForBranch(rawAddress = '', category = '', issueDescription = '') {
  const cleaned = (rawAddress || '').trim();
  const norm = normalizeVietnamese(cleaned);

  if (!norm) {
    return {
      matched: false,
      message: 'Vui lòng nhập địa chỉ trên phiếu bảo hành để hệ thống phân tích chi nhánh gần nhất.'
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
      score += 12;
    }

    score += Math.round((100 - branch.loadPercent) * 0.12);

    return { branch, score, matchedTokens };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  const hasGeoHit = best.matchedTokens.length > 0;
  const isDistrictExact = best.branch.districtPriority.some((d) => norm.includes(d));

  const distanceText = isDistrictExact
    ? '1.6 – 3.5 km'
    : hasGeoHit
      ? '5.0 – 9.5 km'
      : 'Gợi ý trạm điều phối trung tâm';

  const travelTimeText = isDistrictExact
    ? '10 – 15 phút di chuyển'
    : hasGeoHit
      ? '20 – 35 phút di chuyển'
      : 'Hỗ trợ thu nhận qua chuyển phát';

  const confidence = isDistrictExact ? 96 : hasGeoHit ? 85 : 64;

  const reasonParts = [];
  if (isDistrictExact) {
    reasonParts.push(`Địa chỉ khớp trực tiếp khu vực phục vụ ưu tiên của ${best.branch.name}.`);
  } else if (hasGeoHit) {
    reasonParts.push(`Nhận diện địa bàn thuộc "${best.branch.city}", khớp phạm vi điều phối của trạm.`);
  } else {
    reasonParts.push(`Chưa tách được quận/huyện cụ thể từ "${cleaned}", hệ thống chọn trạm có tải thấp nhất.`);
  }

  if (category && best.branch.specialties.includes(category)) {
    reasonParts.push(`Trạm sẵn linh kiện & kỹ thuật viên chuyên trách nhóm "${category}".`);
  }
  if (issueDescription && issueDescription.trim()) {
    reasonParts.push(`Tải hiện tại ${best.branch.loadLabel.toLowerCase()} (${best.branch.loadPercent}%), cam kết SLA ${best.branch.slaHours} giờ.`);
  }

  const recommendedTech = TECHNICIANS.find((t) => t.branchCode === best.branch.code) || TECHNICIANS[0];

  return {
    matched: true,
    inputAddress: cleaned,
    confidence,
    detectedCity: hasGeoHit ? best.branch.city : 'Toàn quốc',
    primary: {
      ...best.branch,
      distanceText,
      travelTimeText,
      reason: reasonParts.join(' '),
      recommendedTech
    },
    alternatives: scored.slice(1, 3).map((item) => ({
      code: item.branch.code,
      name: item.branch.name,
      address: item.branch.address,
      loadLabel: item.branch.loadLabel,
      loadPercent: item.branch.loadPercent,
      slaHours: item.branch.slaHours
    }))
  };
}

module.exports = {
  SERVICE_BRANCHES,
  TECHNICIANS,
  normalizeVietnamese,
  analyzeAddressForBranch
};
