/**
 * Xuất tệp lịch nhắc nhở (.ics) tương thích Google Calendar, Apple Calendar & Outlook
 * cho sự kiện nhắc bảo hành sắp hết hạn (mặc định nhắc trước 7 ngày).
 */
const formatIcsDate = (date) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T020000Z`;
};

const escapeIcsText = (text = "") =>
  String(text).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export const downloadWarrantyReminderIcs = (record, remindDaysBefore = 7) => {
  if (!record?.endDate) return false;
  const end = new Date(record.endDate);
  if (Number.isNaN(end.getTime())) return false;

  const target = new Date(end.getTime() - remindDaysBefore * 24 * 60 * 60 * 1000);
  const startDate = target > new Date() ? target : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const uid = `${record.wbCode || record.serialNumber || Date.now()}@warrantyops.local`;
  const summary = `[WarrantyOps] Sắp hết hạn bảo hành: ${record.productName}`;
  const description = [
    `Thiết bị: ${record.productName}`,
    `Số Serial: ${record.serialNumber}`,
    `Mã chứng nhận: ${record.wbCode || "—"}`,
    `Ngày hết hạn bảo hành: ${end.toLocaleDateString("vi-VN")}`,
    `Tra cứu & gia hạn tại: ${window.location.origin}/lookup?q=${encodeURIComponent(record.serialNumber)}`,
  ].join("\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WarrantyOps//Digital Warranty Vault//VI",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const safeCode = String(record.wbCode || record.serialNumber || "reminder").replace(/[^a-zA-Z0-9_-]/g, "-");
  const a = document.createElement("a");
  a.href = url;
  a.download = `Nhac-bao-hanh-${safeCode}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
};
