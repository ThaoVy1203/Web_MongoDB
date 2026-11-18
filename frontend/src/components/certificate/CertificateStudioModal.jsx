import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Download,
  Printer,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Copy,
  CalendarPlus,
} from "lucide-react";
import { Modal } from "../common/Modal";
import { formatDateVN } from "../../utils/format";
import { downloadWarrantyReminderIcs } from "../../utils/calendar";
import { useToast } from "../../context/ToastContext";

const THEMES = [
  {
    id: "pearl",
    name: "Bạch Kim Tinh Khôi",
    bg: "#ffffff",
    accent: "#4f46e5",
    accentTextClass: "text-[#0A0A0A]",
    textPrimary: "#0f172a",
    textMuted: "#64748b",
    border: "#e2e8f0",
    cardClass: "bg-white text-[#0A0A0A] border-neutral-200",
    badgeClass: "bg-[#F4F5F7] text-[#0A0A0A] border-neutral-300",
  },
  {
    id: "indigo",
    name: "Royal Slate Executive",
    bg: "#0f172a",
    accent: "#818cf8",
    accentTextClass: "text-neutral-300",
    textPrimary: "#f8fafc",
    textMuted: "#94a3b8",
    border: "#334155",
    cardClass: "bg-[#0A0A0A] text-white border-neutral-800",
    badgeClass: "bg-[#0A0A0A]/20 text-neutral-300 border-neutral-800/30",
  },
  {
    id: "emerald",
    name: "Emerald Verified",
    bg: "#f8fafc",
    accent: "#059669",
    accentTextClass: "text-emerald-600",
    textPrimary: "#0f172a",
    textMuted: "#475569",
    border: "#cbd5e1",
    cardClass: "bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 text-slate-900 border-emerald-200/80",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
];

export const CertificateStudioModal = ({ open, onClose, record }) => {
  const toast = useToast();
  const [themeId, setThemeId] = useState("pearl");
  const [downloading, setDownloading] = useState(false);
  const qrWrapRef = useRef(null);

  if (!record) return null;
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const verifyUrl = `${window.location.origin}/lookup?q=${encodeURIComponent(record.serialNumber)}`;

  const isRejected = record.computedStatus === "rejected";
  const isExpired = record.computedStatus === "expired" || (typeof record.daysRemaining === "number" && record.daysRemaining < 0);

  const statusBadge = isRejected
    ? {
        label: "Chứng nhận đã thu hồi",
        stamp: "✕ CHỨNG NHẬN ĐÃ BỊ THU HỒI HIỆU LỰC",
        stampColor: "#e11d48",
        cls: "bg-rose-50 text-rose-700 border-rose-200",
        Icon: Ban,
      }
    : isExpired
      ? {
          label: "Đã hết hạn bảo hành",
          stamp: "! CHỨNG NHẬN ĐÃ HẾT HẠN BẢO HÀNH",
          stampColor: "#d97706",
          cls: "bg-amber-50 text-amber-700 border-amber-200",
          Icon: AlertTriangle,
        }
      : {
          label: "Đã ký số xác thực",
          stamp: "✓ ĐÃ XÁC THỰC BỞI HỆ THỐNG WARRANTYOPS",
          stampColor: theme.accent,
          cls: theme.badgeClass,
          Icon: CheckCircle2,
        };

  const handleCopyVerifyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      toast.success("Đã sao chép đường dẫn xác thực chứng nhận!");
    } catch {
      toast.info(verifyUrl);
    }
  };

  const handleDownloadCalendar = () => {
    if (downloadWarrantyReminderIcs(record, 7)) {
      toast.success("Đã xuất tệp nhắc lịch hết hạn (.ics) — mở để thêm vào lịch!");
    } else {
      toast.error("Chứng nhận chưa có ngày hết hạn hợp lệ.");
    }
  };

  const handlePrint = () => {
    document.body.classList.add("printing-certificate");
    const cleanup = () => {
      document.body.classList.remove("printing-certificate");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    setTimeout(cleanup, 1500);
  };

  const handleDownloadPng = async () => {
    setDownloading(true);
    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const canvas = document.createElement("canvas");
      canvas.width = 1400;
      canvas.height = 820;
      const ctx = canvas.getContext("2d");

      // Background
      const grad = ctx.createLinearGradient(0, 0, 1400, 820);
      if (theme.id === "indigo") {
        grad.addColorStop(0, "#0f172a");
        grad.addColorStop(1, "#1e1b4b");
      } else if (theme.id === "emerald") {
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(1, "#ecfdf5");
      } else {
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(1, "#f1f5f9");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1400, 820);

      // Decorative frame
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 3;
      ctx.strokeRect(36, 36, 1328, 748);

      // Top accent bar
      ctx.fillStyle = statusBadge.stampColor;
      ctx.fillRect(36, 36, 1328, 10);

      // Brand header
      ctx.fillStyle = theme.accent;
      ctx.font = "bold 22px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("WARRANTYOPS · DIGITAL CERTIFICATE VAULT", 90, 115);

      ctx.fillStyle = theme.textPrimary;
      ctx.font = "800 44px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("GIẤY CHỨNG NHẬN BẢO HÀNH ĐIỆN TỬ", 90, 175, 1200);

      ctx.fillStyle = theme.textMuted;
      ctx.font = "500 20px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(
        `Mã hồ sơ lưu trữ: ${record.wbCode}   |   Nguồn gốc: ${record.origin || "Chính hãng"}`,
        90,
        215,
        1200
      );

      // Divider
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(90, 250);
      ctx.lineTo(1310, 250);
      ctx.stroke();

      // Main details (maxWidth = 640 prevents overlap with QR box at x = 1045)
      const rows = [
        ["THIẾT BỊ ĐƯỢC BẢO VỆ", record.productName],
        ["SỐ SERIAL / ĐỊNH DANH", record.serialNumber],
        ["CHỦ SỞ HỮU ĐĂNG KÝ", `${record.customerName} (${record.customerPhone || "Đã xác thực"})`],
        ["GÓI CHÍNH SÁCH", record.packageName || "Bảo hành Chính hãng Tiêu chuẩn"],
        ["NGÀY KÍCH HOẠT", formatDateVN(record.purchaseDate)],
        ["HIỆU LỰC ĐẾN NGÀY", formatDateVN(record.endDate)],
      ];

      rows.forEach(([label, val], idx) => {
        const y = 315 + idx * 68;
        ctx.fillStyle = theme.textMuted;
        ctx.font = "600 16px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText(label, 90, y, 260);

        ctx.fillStyle = idx === 1 ? theme.accent : theme.textPrimary;
        ctx.font =
          idx === 1
            ? "700 24px 'JetBrains Mono', monospace"
            : "700 22px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText(String(val || "—"), 370, y, 640);
      });

      // QR box on right
      const qrCanvas = qrWrapRef.current?.querySelector("canvas");
      if (qrCanvas) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(1045, 300, 240, 240);
        ctx.strokeStyle = theme.border;
        ctx.strokeRect(1045, 300, 240, 240);
        ctx.drawImage(qrCanvas, 1065, 320, 200, 200);

        ctx.fillStyle = theme.textMuted;
        ctx.font = "600 15px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Quét QR xác thực trực tuyến", 1062, 575, 220);
      }

      // Official Stamp reflecting true record status
      ctx.fillStyle = statusBadge.stampColor;
      ctx.font = "700 18px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(statusBadge.stamp, 90, 735, 860);

      ctx.fillStyle = theme.textMuted;
      ctx.font = "500 16px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(`Xuất bản điện tử ngày ${formatDateVN(new Date())}`, 990, 735, 320);

      const safeWb = String(record.wbCode || "CERT").replace(/[^a-zA-Z0-9_-]/g, "-");
      const safeSn = String(record.serialNumber || "SN").replace(/[^a-zA-Z0-9_-]/g, "-");
      const link = document.createElement("a");
      link.download = `Chung-nhan-${safeWb}-${safeSn}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Đã tải ảnh chứng nhận bảo hành (PNG) thành công!");
    } catch (err) {
      toast.error("Không thể kết xuất ảnh PNG: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Studio Chứng Nhận Bảo Hành Điện Tử"
      subtitle="Tùy chỉnh giao diện thẻ chứng từ số & xuất ảnh PNG sắc nét kèm mã QR xác thực"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Theme Picker */}
        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#0A0A0A]" />
            <span>Chọn phong cách phôi chứng nhận</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setThemeId(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  themeId === t.id
                    ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Live Certificate Card Preview */}
        <div
          className={`certificate-print-area relative overflow-hidden rounded-3xl border p-7 sm:p-9 shadow-sm transition-all ${theme.cardClass}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-current/10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase opacity-85">
                <ShieldCheck className={`w-4 h-4 ${theme.accentTextClass}`} />
                <span>WarrantyOps Official Digital Document</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Giấy Chứng Nhận Bảo Hành Số
              </h4>
              <p className="text-xs opacity-70 font-mono">
                Mã lưu trữ: {record.wbCode} · Kênh cấp: {record.activationChannel || "WEB"}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border self-start ${statusBadge.cls}`}
            >
              <statusBadge.Icon className="w-3.5 h-3.5" />
              {statusBadge.label}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider opacity-60 font-semibold">
                  Thiết bị đăng ký bảo vệ
                </div>
                <div className="text-base sm:text-lg font-bold mt-0.5">{record.productName}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider opacity-60 font-semibold">
                    Số Serial / IMEI
                  </div>
                  <div className={`font-mono text-sm font-bold mt-0.5 ${theme.accentTextClass}`}>
                    {record.serialNumber}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider opacity-60 font-semibold">
                    Chủ sở hữu
                  </div>
                  <div className="text-sm font-semibold mt-0.5">{record.customerName}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider opacity-60 font-semibold">
                    Ngày kích hoạt
                  </div>
                  <div className="text-sm font-semibold mt-0.5">{formatDateVN(record.purchaseDate)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider opacity-60 font-semibold">
                    Hiệu lực đến ngày
                  </div>
                  <div className="text-sm font-bold mt-0.5">{formatDateVN(record.endDate)}</div>
                </div>
              </div>

              <div className="pt-2 text-xs opacity-75 leading-relaxed">
                Gói áp dụng: <span className="font-semibold">{record.packageName}</span> —{" "}
                {record.commitText || "Thay thế linh kiện chính hãng toàn quốc."}
              </div>
            </div>

            <div
              ref={qrWrapRef}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-slate-900 border border-slate-200/80 shadow-xs mx-auto"
            >
              <QRCodeCanvas value={verifyUrl} size={128} level="H" includeMargin={false} />
              <span className="mt-2.5 text-[11px] font-semibold text-slate-500">
                Quét tra cứu hồ sơ gốc
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 no-print">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyVerifyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              Sao chép link xác thực
            </button>
            {!isExpired && !isRejected && (
              <button
                type="button"
                onClick={handleDownloadCalendar}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-amber-600" />
                Nhắc lịch (.ics)
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              In chứng từ
            </button>
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadPng}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {downloading ? "Đang kết xuất ảnh..." : "Tải ảnh chứng nhận (PNG)"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
