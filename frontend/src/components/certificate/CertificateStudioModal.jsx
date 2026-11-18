import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Printer, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { Modal } from "../common/Modal";
import { formatDateVN } from "../../utils/format";

const THEMES = [
  {
    id: "pearl",
    name: "Bạch Kim Tinh Khôi",
    bg: "#ffffff",
    accent: "#4f46e5",
    accentSoft: "#eef2ff",
    textPrimary: "#0f172a",
    textMuted: "#64748b",
    border: "#e2e8f0",
    cardClass: "bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 text-slate-900 border-slate-200",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    id: "indigo",
    name: "Royal Slate Executive",
    bg: "#0f172a",
    accent: "#818cf8",
    accentSoft: "#1e293b",
    textPrimary: "#f8fafc",
    textMuted: "#94a3b8",
    border: "#334155",
    cardClass: "bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border-slate-700",
    badgeClass: "bg-indigo-500/20 text-indigo-200 border-indigo-400/30",
  },
  {
    id: "emerald",
    name: "Emerald Verified",
    bg: "#f8fafc",
    accent: "#059669",
    accentSoft: "#ecfdf5",
    textPrimary: "#0f172a",
    textMuted: "#475569",
    border: "#cbd5e1",
    cardClass: "bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 text-slate-900 border-emerald-200/80",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
];

export const CertificateStudioModal = ({ open, onClose, record }) => {
  const [themeId, setThemeId] = useState("pearl");
  const [downloading, setDownloading] = useState(false);
  const qrWrapRef = useRef(null);

  if (!record) return null;
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const verifyUrl = `${window.location.origin}/lookup?q=${encodeURIComponent(record.serialNumber)}`;

  const handleDownloadPng = () => {
    setDownloading(true);
    try {
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

      // Decorative subtle frame
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 3;
      ctx.strokeRect(36, 36, 1328, 748);

      // Top accent bar
      ctx.fillStyle = theme.accent;
      ctx.fillRect(36, 36, 1328, 10);

      // Brand header
      ctx.fillStyle = theme.accent;
      ctx.font = "bold 22px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("WARRANTYOPS · DIGITAL CERTIFICATE VAULT", 90, 115);

      ctx.fillStyle = theme.textPrimary;
      ctx.font = "800 44px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("GIẤY CHỨNG NHẬN BẢO HÀNH ĐIỆN TỬ", 90, 175);

      ctx.fillStyle = theme.textMuted;
      ctx.font = "500 20px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(`Mã hồ sơ lưu trữ: ${record.wbCode}   |   Nguồn gốc: ${record.origin || "Chính hãng"}`, 90, 215);

      // Divider
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(90, 250);
      ctx.lineTo(1310, 250);
      ctx.stroke();

      // Main details
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
        ctx.fillText(label, 90, y);

        ctx.fillStyle = idx === 1 ? theme.accent : theme.textPrimary;
        ctx.font = idx === 1 ? "700 24px 'JetBrains Mono', monospace" : "700 23px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText(String(val || "—").slice(0, 56), 370, y);
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
        ctx.fillText("Quét QR xác thực trực tuyến", 1062, 575);
      }

      // Official Verified Stamp
      ctx.fillStyle = theme.accent;
      ctx.font = "700 18px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("✓ ĐÃ XÁC THỰC BỞI HỆ THỐNG WARRANTYOPS", 90, 735);

      ctx.fillStyle = theme.textMuted;
      ctx.font = "500 16px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(`Xuất bản điện tử ngày ${formatDateVN(new Date())}`, 990, 735);

      const link = document.createElement("a");
      link.download = `Chung-nhan-${record.wbCode}-${record.serialNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-600" />
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
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
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
          className={`relative overflow-hidden rounded-3xl border p-7 sm:p-9 shadow-sm transition-all ${theme.cardClass}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-current/10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase opacity-80">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span>WarrantyOps Official Digital Document</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Giấy Chứng Nhận Bảo Hành Số
              </h4>
              <p className="text-xs opacity-70 font-mono">
                Mã lưu trữ: {record.wbCode} · Kênh cấp: {record.activationChannel || "WEB"}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border self-start ${theme.badgeClass}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã ký số xác thực
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
                  <div className="font-mono text-sm font-bold mt-0.5 text-indigo-500">
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
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            In chứng từ
          </button>
          <button
            type="button"
            disabled={downloading}
            onClick={handleDownloadPng}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Đang kết xuất ảnh..." : "Tải ảnh chứng nhận (PNG)"}
          </button>
        </div>
      </div>
    </Modal>
  );
};
