export const normalizeVietnamese = (str = "") =>
  String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const addMonthsSafe = (baseDate, months = 12) => {
  const parsed = baseDate ? new Date(baseDate) : new Date();
  const safeBase = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const result = new Date(safeBase.getTime());
  const targetMonths = Number(months) || 12;
  const originalDay = result.getDate();
  result.setMonth(result.getMonth() + targetMonths);
  if (result.getDate() < originalDay) {
    result.setDate(0);
  }
  return result;
};

export const computeDaysBetween = (targetDate, fromDate = new Date()) => {
  if (!targetDate) return null;
  const end = new Date(targetDate).getTime();
  const start = new Date(fromDate).getTime();
  if (Number.isNaN(end) || Number.isNaN(start)) return null;
  const diffMs = end - start;
  if (diffMs < 0) {
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const decorateRecord = (raw) => {
  if (!raw) return null;
  const rec = typeof raw.toObject === "function" ? raw.toObject() : { ...raw };
  rec._id = String(rec._id || "");

  const now = new Date();
  const rawP = rec.purchaseDate ? new Date(rec.purchaseDate) : now;
  const pDate = Number.isNaN(rawP.getTime()) ? now : rawP;
  const rawE = rec.endDate ? new Date(rec.endDate) : addMonthsSafe(pDate, rec.periodMonths || 12);
  const eDate = Number.isNaN(rawE.getTime()) ? addMonthsSafe(pDate, rec.periodMonths || 12) : rawE;

  const totalMs = Math.max(1, eDate.getTime() - pDate.getTime());
  const passedMs = Math.max(0, now.getTime() - pDate.getTime());
  const percentPassed = Math.min(100, Math.max(0, Number(((passedMs / totalMs) * 100).toFixed(1))));
  const daysRemaining = computeDaysBetween(eDate, now) ?? 0;
  const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
  const daysPassed = Math.min(totalDays, Math.max(0, Math.floor(passedMs / (1000 * 60 * 60 * 24))));

  let computedStatus = "active";
  if (rec.statusOverride === "rejected") {
    computedStatus = "rejected";
  } else if (daysRemaining < 0) {
    computedStatus = "expired";
  } else if (daysRemaining <= 30) {
    computedStatus = "expiring";
  }

  return {
    ...rec,
    purchaseDate: pDate.toISOString(),
    endDate: eDate.toISOString(),
    daysRemaining,
    totalDays,
    daysPassed,
    percentPassed,
    computedStatus,
  };
};

export const decorateTicket = (raw) => {
  if (!raw) return null;
  const ticket = typeof raw.toObject === "function" ? raw.toObject() : { ...raw };
  ticket._id = String(ticket._id || "");
  const daysLeft = ticket.warrantyExpiryDate ? computeDaysBetween(ticket.warrantyExpiryDate) : null;
  const isSlaBreached =
    !["Đã sửa xong", "Đã trả khách", "Từ chối bảo hành"].includes(ticket.status) &&
    ticket.slaDeadline &&
    new Date(ticket.slaDeadline).getTime() < Date.now();

  return {
    ...ticket,
    daysLeft,
    isSlaBreached: Boolean(isSlaBreached),
  };
};
