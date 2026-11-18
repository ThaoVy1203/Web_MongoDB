import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import {
  Search,
  ShieldCheck,
  QrCode,
  Calendar,
  CalendarPlus,
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  FileText,
  Layers,
  History,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { recordsApi } from "../../api/client";
import { formatDateVN, getRecordStatusMeta, getTicketStatusMeta } from "../../utils/format";
import { downloadWarrantyReminderIcs } from "../../utils/calendar";
import { CertificateStudioModal } from "../../components/certificate/CertificateStudioModal";
import { DeviceInsightsModal } from "../../components/ai/DeviceInsightsModal";
import { useToast } from "../../context/ToastContext";

const SAMPLES = [
  { code: "DLXPS-99281-VN", name: "Dell XPS 15 OLED" },
  { code: "MACM3P-77410-VN", name: "MacBook Pro M3" },
  { code: "IMEI-3589120941", name: "iPhone 15 Pro Max" },
  { code: "WB-2026-8802", name: "Dell UltraSharp 4K" },
];

export const LookupPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "DLXPS-99281-VN";
  const toast = useToast();

  const [mode, setMode] = useState("single"); // single | batch
  const [input, setInput] = useState(initialQ);
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [studioOpen, setStudioOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  // Batch lookup state
  const [batchText, setBatchText] = useState("DLXPS-99281-VN\nMACM3P-77410-VN\nIMEI-3589120941\nSN-CHUA-DANG-KY");
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResults, setBatchResults] = useState([]);

  const runLookup = async (q) => {
    const trimmed = String(q || "").trim();
    if (!trimmed) return;
    setLoading(true);
    setNotFound(false);
    setErrorMsg("");
    try {
      const res = await recordsApi.lookup(trimmed);
      if (res.found && res.data) {
        setDevice(res.data);
      } else {
        setDevice(null);
        setNotFound(true);
      }
    } catch (err) {
      setDevice(null);
      setErrorMsg(err.message || "Không thể kết nối máy chủ tra cứu.");
      toast.error(err.message || "Lỗi kết nối máy chủ tra cứu.");
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
    const trimmed = input.trim();
    if (!trimmed) return;
    if (trimmed === initialQ) {
      runLookup(trimmed);
    } else {
      setSearchParams({ q: trimmed });
    }
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    if (!batchText.trim()) return;
    setBatchLoading(true);
    try {
      const res = await recordsApi.batchCheck(batchText);
      setBatchResults(res.data || []);
      toast.success(`Đã đối chiếu ${(res.data || []).length} mã thiết bị.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBatchLoading(false);
    }
  };

  const statusMeta = device
    ? getRecordStatusMeta(device.computedStatus, device.daysRemaining)
    : null;
  const isInactive =
    device && (device.computedStatus === "expired" || device.computedStatus === "rejected");

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header & Mode Switch */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4F5F7] text-[#0A0A0A] text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Cổng Xác Thực Chứng Từ Bảo Hành Toàn Quốc</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Tra cứu thời hạn &amp; Giấy chứng nhận điện tử
        </h1>
        <p className="text-sm text-slate-500">
          Nhập Số Serial, IMEI, Số điện thoại hoặc Mã giấy bảo hành để đối chiếu hồ sơ gốc trên hệ thống.
        </p>

        {/* Single vs Batch Toggle */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200/70">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === "single" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Tra cứu đơn lẻ</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("batch")}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === "batch" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Kiểm tra hàng loạt (Batch)</span>
          </button>
        </div>

        {mode === "single" && (
          <>
            <form onSubmit={handleSubmit} className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập Serial / IMEI / SĐT / Mã WB-xxxx..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-[#0A0A0A]"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-2xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
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
                      ? "bg-[#F4F5F7] border-neutral-300 text-[#0A0A0A] font-semibold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-mono">{s.code}</span> · {s.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* BATCH CHECK MODE */}
      {mode === "batch" && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 space-y-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div>
            <h2 className="text-base font-bold text-slate-900">Đối chiếu Hàng loạt Serial / IMEI (tối đa 40 thiết bị)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Phù hợp cho doanh nghiệp kiểm kê nhanh hạn bảo hành dàn máy. Nhập mỗi mã 1 dòng hoặc phân tách bằng dấu phẩy.
            </p>
          </div>
          <form onSubmit={handleBatchSubmit} className="space-y-3">
            <textarea
              rows={4}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white font-mono text-xs focus:outline-none focus:border-[#0A0A0A]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={batchLoading}
                className="px-5 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
              >
                {batchLoading ? "Đang đối chiếu..." : "Kiểm tra danh sách"}
              </button>
            </div>
          </form>

          {batchResults.length > 0 && (
            <div className="rounded-2xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Mã tra cứu</th>
                    <th className="px-4 py-3">Thiết bị</th>
                    <th className="px-4 py-3">Mã giấy BH</th>
                    <th className="px-4 py-3">Ngày hết hạn</th>
                    <th className="px-4 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batchResults.map((row, idx) => {
                    const meta = row.found
                      ? getRecordStatusMeta(row.computedStatus, row.daysRemaining)
                      : null;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {row.found ? (
                            <button
                              type="button"
                              onClick={() => {
                                setMode("single");
                                setSearchParams({ q: row.serialNumber });
                              }}
                              className="text-[#0A0A0A] hover:underline cursor-pointer"
                            >
                              {row.query}
                            </button>
                          ) : (
                            row.query
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{row.productName}</td>
                        <td className="px-4 py-3 font-mono text-[#0A0A0A]">{row.wbCode}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDateVN(row.endDate)}</td>
                        <td className="px-4 py-3">
                          {meta ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${meta.badgeClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                              {meta.label}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                              Chưa kích hoạt
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SINGLE RESULT DISPLAY */}
      {mode === "single" && loading && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center text-sm text-slate-500">
          Đang truy xuất dữ liệu chứng nhận bảo hành...
        </div>
      )}

      {mode === "single" && !loading && errorMsg && (
        <div className="rounded-3xl bg-white border border-rose-200/80 p-10 text-center max-w-lg mx-auto space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Không thể kết nối máy chủ tra cứu</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{errorMsg}</p>
          <button
            type="button"
            onClick={() => runLookup(initialQ)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A0A0A] text-white text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Thử lại ngay
          </button>
        </div>
      )}

      {mode === "single" && !loading && !errorMsg && notFound && (
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

      {mode === "single" && !loading && device && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.04)]"
        >
          {/* Warning Ribbon for Revoked / Expired */}
          {device.computedStatus === "rejected" && (
            <div className="px-6 sm:px-9 py-3 bg-rose-50 border-b border-rose-200/80 flex items-center gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Chứng nhận đã bị thu hồi hiệu lực:</strong>{" "}
                {device.voidReason || "Vi phạm điều khoản bảo hành chính hãng."}
              </span>
            </div>
          )}

          {device.computedStatus === "expired" && (
            <div className="px-6 sm:px-9 py-3 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between gap-2.5 text-xs text-amber-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Thiết bị đã hết hạn bảo hành tiêu chuẩn. Bạn vẫn có thể yêu cầu dịch vụ sửa chữa có tính phí ưu đãi.</span>
              </div>
            </div>
          )}

          {/* Top Certificate Ribbon */}
          <div className="px-6 sm:px-9 py-6 bg-[#F4F5F7]/80 border-b border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-[#0A0A0A] bg-[#F4F5F7] px-2.5 py-1 rounded-lg">
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

            <div className="flex flex-wrap items-center gap-2">
              {!isInactive && (
                <button
                  type="button"
                  onClick={() => {
                    downloadWarrantyReminderIcs(device, 7);
                    toast.success("Đã xuất tệp nhắc lịch hết hạn (.ics)!");
                  }}
                  title="Thêm nhắc lịch hết hạn vào Calendar"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-amber-300 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-amber-600" />
                  <span>Nhắc lịch</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setInsightsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-neutral-400 text-slate-700 hover:text-[#0A0A0A] text-xs font-semibold transition-all cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Xu hướng lỗi</span>
              </button>
              <button
                type="button"
                onClick={() => setStudioOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-neutral-400 text-slate-700 hover:text-[#0A0A0A] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0A0A0A]" />
                <span>Tạo ảnh PNG</span>
              </button>
              <Link
                to={`/submit-request?serial=${encodeURIComponent(device.serialNumber)}`}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-semibold transition-colors ${
                  isInactive
                    ? "bg-slate-800 hover:bg-slate-900"
                    : "bg-[#0A0A0A] hover:bg-neutral-800"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isInactive ? "Đặt sửa chữa dịch vụ" : "Gửi yêu cầu bảo hành"}</span>
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
                      title={item.value || "—"}
                      className={`text-sm font-bold text-slate-800 mt-1 truncate ${
                        item.mono ? "font-mono text-[#0A0A0A]" : ""
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
                    <Calendar className="w-4 h-4 text-[#0A0A0A]" />
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
                          badge: "CHÍNH HÃNG",
                          desc: device.commitText || "Thay thế miễn phí linh kiện lỗi kỹ thuật nhà sản xuất.",
                        },
                        {
                          title: "Hỗ trợ toàn hệ thống trạm ủy quyền",
                          badge: "ĐIỆN TỬ",
                          desc: "Tra cứu điện tử không cần mang theo hóa đơn giấy.",
                        },
                      ]
                  ).map((b, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/60 flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800">{b.title}</span>
                          {b.badge && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4F5F7] text-[#0A0A0A] shrink-0">
                              {b.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {device.exclusionText && (
                  <p className="text-xs text-slate-400 pt-1">{device.exclusionText}</p>
                )}
              </div>

              {/* Renewal History */}
              {device.renewalHistory?.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <History className="w-4 h-4 text-[#0A0A0A]" />
                    <span>Lịch sử Gia hạn Chứng nhận ({device.renewalHistory.length})</span>
                  </div>
                  <div className="space-y-2">
                    {device.renewalHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-bold text-emerald-800">+{item.addedMonths} tháng</span>
                          <span className="text-slate-500"> · {item.note || "Gia hạn gói bảo vệ"}</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-500">
                          Hạn mới: {formatDateVN(item.newEndDate)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Visual Card + QR + History */}
            <div className="lg:col-span-4 space-y-5">
              <div className="rounded-2xl border border-slate-200/80 p-5 flex flex-col items-center text-center bg-slate-50/40">
                {device.image && (
                  <img
                    src={device.image}
                    alt={device.productName}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
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
                  <QrCode className="w-3.5 h-3.5 text-[#0A0A0A]" />
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
                    <FileText className="w-3.5 h-3.5 text-[#0A0A0A]" />
                    <span>Lịch sử tiếp nhận kỹ thuật</span>
                  </div>
                  {device.relatedTickets.map((t) => {
                    const st = getTicketStatusMeta(t.status);
                    return (
                      <Link
                        key={t._id}
                        to={`/track?ticket=${encodeURIComponent(t.warrantyCode)}`}
                        className="block p-3 rounded-xl bg-slate-50 hover:bg-[#F4F5F7] transition-colors"
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

      <DeviceInsightsModal
        open={insightsOpen}
        onClose={() => setInsightsOpen(false)}
        deviceName={device?.productName || ""}
        category={device?.category || ""}
      />
    </div>
  );
};
