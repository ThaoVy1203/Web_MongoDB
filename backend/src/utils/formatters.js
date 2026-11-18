export const normalizeVietnamese = (str = "") =>
  String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const computeDaysBetween = (targetDate, fromDate = new Date()) => {
  if (!targetDate) return null;
  const end = new Date(targetDate).getTime();
  const start = new Date(fromDate).getTime();
  if (Number.isNaN(end) || Number.isNaN(start)) return null;
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

export const decorateRecord = (raw) => {
  if (!raw) return null;
  const rec = typeof raw.toObject === "function" ? raw.toObject() : { ...raw };
  rec._id = String(rec._id || "");

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
