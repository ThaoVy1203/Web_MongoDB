import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import {
  Search,
  ShieldCheck,
  QrCode,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileText,
} from "lucide-react";
import { recordsApi } from "../../api/client";
import { formatDateVN, getRecordStatusMeta, getTicketStatusMeta } from "../../utils/format";
import { CertificateStudioModal } from "../../components/certificate/CertificateStudioModal";

const SAMPLES = [
  { code: "DLXPS-99281-VN", name: "Dell XPS 15 OLED" },
  { code: "MACM3P-77410-VN", name: "MacBook Pro M3" },
  { code: "IMEI-3589120941", name: "iPhone 15 Pro Max" },
  { code: "WB-2026-8802", name: "Dell UltraSharp 4K" },
];

export const LookupPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "DLXPS-99281-VN";

  const [input, setInput] = useState(initialQ);
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);

  const runLookup = async (q) => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await recordsApi.lookup(q);
      if (res.found && res.data) {
        setDevice(res.data);
      } else {
        setDevice(null);
        setNotFound(true);
      }
    } catch {
      setDevice(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setInput(initialQ);
    runLookup(initialQ);
  }, [initialQ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSearchParams({ q: input.trim() });
  };

  const statusMeta = device
    ? getRecordStatusMeta(device.computedStatus, device.daysRemaining)
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header & Search Box */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Cổng Xác Thực Chứng Từ Bảo Hành Toàn Quốc</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Tra cứu thời hạn &amp; Giấy chứng nhận điện tử
        </h1>
        <p className="text-sm text-slate-500">
          Nhập Số Serial, IMEI hoặc Mã giấy bảo hành để đối chiếu hồ sơ gốc trên hệ thống.
        </p>

        <form onSubmit={handleSubmit} className="pt-3 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập Serial / IMEI / Mã WB-xxxx..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Kiểm tra hồ sơ
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {SAMPLES.map((s) => (
            <button
              key={s.code}
              type="button"
              onClick={() => setSearchParams({ q: s.code })}
              className={`px-3 py-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                initialQ.toUpperCase() === s.code
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="font-mono">{s.code}</span> · {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Result Display */}
      {loading && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center text-sm text-slate-500">
          Đang truy xuất dữ liệu chứng nhận bảo hành...
        </div>
      )}

      {!loading && notFound && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-10 text-center max-w-lg mx-auto space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            Không tìm thấy chứng từ cho mã &ldquo;{initialQ}&rdquo;
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Vui lòng kiểm tra lại ký tự Serial/IMEI hoặc kích hoạt giấy bảo hành mới trong mục Sổ Thiết Bị.
          </p>
          <Link
            to="/my-devices"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
          >
            Đăng ký thiết bị mới
          </Link>
        </div>
      )}

      {!loading && device && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.04)]"
        >
          {/* Top Certificate Ribbon */}
          <div className="px-6 sm:px-9 py-6 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {device.wbCode}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                  {statusMeta.label}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 pt-1">
                {device.productName}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setStudioOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tạo ảnh chứng nhận PNG</span>
              </button>
              <Link
                to={`/submit-request?serial=${encodeURIComponent(device.serialNumber)}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi yêu cầu bảo hành</span>
              </Link>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-9 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: "Số Serial / Định danh", value: device.serialNumber, mono: true },
                  { label: "Chủ sở hữu", value: device.customerName },
                  { label: "Nguồn gốc", value: device.origin || "Chính hãng VN" },
                  { label: "Ngày kích hoạt", value: formatDateVN(device.purchaseDate) },
                  { label: "Ngày đáo hạn", value: formatDateVN(device.endDate) },
                  { label: "Gói bảo vệ", value: device.packageName },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100"
                  >
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {item.label}
                    </div>
                    <div
                      className={`text-sm font-bold text-slate-800 mt-1 truncate ${
                        item.mono ? "font-mono text-indigo-600" : ""
                      }`}
                    >
                      {item.value || "—"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Validity Timeline Bar */}
              <div className="p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Tiến độ thời hạn bảo hành ({device.periodMonths} tháng)
                  </span>
                  <span className="font-bold text-slate-900">
                    Đã sử dụng {device.percentPassed}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${device.percentPassed}%` }}
                    transition={{ duration: 0.6 }}
                    className={`h-full rounded-full ${statusMeta.barClass}`}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Kích hoạt: {formatDateVN(device.purchaseDate)}</span>
                  <span>Đáo hạn: {formatDateVN(device.endDate)}</span>
                </div>
              </div>

              {/* Coverage Benefits */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Quyền lợi &amp; Điều khoản chứng nhận</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(device.benefits?.length
                    ? device.benefits
                    : [
                        {
                          title: "Linh kiện OEM chính hãng 100%",
                          desc: device.commitText || "Thay thế miễn phí linh kiện lỗi kỹ thuật nhà sản xuất.",
                        },
                        {
                          title: "Hỗ trợ toàn hệ thống trạm ủy quyền",
                          desc: "Tra cứu điện tử không cần mang theo hóa đơn giấy.",
                        },
                      ]
                  ).map((b, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/60 flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">{b.title}</div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Visual Card + QR + History */}
            <div className="lg:col-span-4 space-y-5">
              <div className="rounded-2xl border border-slate-200/80 p-5 flex flex-col items-center text-center bg-slate-50/40">
                {device.image && (
                  <img
                    src={device.image}
                    alt={device.productName}
                    className="w-full h-40 object-cover rounded-xl mb-4 border border-slate-100"
                  />
                )}
                <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  <QRCodeSVG
                    value={`${window.location.origin}/lookup?q=${encodeURIComponent(device.serialNumber)}`}
                    size={124}
                  />
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mã QR Hồ sơ Điện tử</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                   Xuất trình mã này tại quầy tiếp nhận để tra cứu tức thì.
                </p>
              </div>

              {/* Related RMA Tickets */}
              {device.relatedTickets?.length > 0 && (
                <div className="rounded-2xl border border-slate-200/80 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Lịch sử tiếp nhận kỹ thuật</span>
                  </div>
                  {device.relatedTickets.map((t) => {
                    const st = getTicketStatusMeta(t.status);
                    return (
                      <Link
                        key={t._id}
                        to={`/track?ticket=${encodeURIComponent(t.warrantyCode)}`}
                        className="block p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-slate-800">{t.warrantyCode}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.badgeClass}`}>
                            {t.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                          {t.issueDescription}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <CertificateStudioModal
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        record={device}
      />
    </div>
  );
};
