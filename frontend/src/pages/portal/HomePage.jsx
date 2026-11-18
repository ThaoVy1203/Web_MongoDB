import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  ShieldCheck,
  Clock,
  Wrench,
  CheckCircle2,
  Sparkles,
  MapPin,
  ArrowRight,
  QrCode,
  Plus,
  CalendarClock,
  FileText,
} from "lucide-react";
import { analyticsApi, recordsApi } from "../../api/client";
import { formatDateVN, getRecordStatusMeta, getTicketStatusMeta } from "../../utils/format";
import { CertificateStudioModal } from "../../components/certificate/CertificateStudioModal";
import { Modal } from "../../components/common/Modal";
import { useToast } from "../../context/ToastContext";

export const HomePage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [overview, setOverview] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickQuery, setQuickQuery] = useState("");
  const [recordFilter, setRecordFilter] = useState("all");

  // AI Branch Interactive Widget
  const [aiAddress, setAiAddress] = useState("Số 45 Trần Thái Tông, Cầu Giấy, Hà Nội");
  const [aiCategory, setAiCategory] = useState("Laptop/Máy tính");
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Modals
  const [studioRecord, setStudioRecord] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    serialNumber: "",
    productName: "",
    category: "Laptop/Máy tính",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    periodMonths: 12,
  });

  const fetchWorkspace = async () => {
    try {
      const [ovRes, recRes, aiRes] = await Promise.all([
        analyticsApi.overview("all"),
        recordsApi.list({ status: "all" }),
        analyticsApi.suggestBranch({
          address: aiAddress,
          category: aiCategory,
          issueDescription: "Kiểm tra định kỳ",
        }),
      ]);
      setOverview(ovRes.data);
      setRecords(recRes.data || []);
      setAiResult(aiRes.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, []);

  const handleAnalyzeBranch = async (e) => {
    e?.preventDefault();
    setAiLoading(true);
    try {
      const res = await analyticsApi.suggestBranch({
        address: aiAddress,
        category: aiCategory,
        issueDescription: "Kiểm tra chứng từ & bảo hành",
      });
      setAiResult(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleQuickCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await recordsApi.create(newForm);
      toast.success(res.message);
      setCreateOpen(false);
      setNewForm({
        serialNumber: "",
        productName: "",
        category: "Laptop/Máy tính",
        customerName: "",
        customerPhone: "",
        customerAddress: "",
        periodMonths: 12,
      });
      fetchWorkspace();
      setStudioRecord(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleQuickRenew = async (rec) => {
    try {
      const res = await recordsApi.renew(rec._id, { months: 12 });
      toast.success(res.message);
      fetchWorkspace();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (recordFilter === "all") return true;
    return r.computedStatus === recordFilter;
  });

  const kpis = overview?.kpis || {
    totalRecords: 0,
    expiringCount: 0,
    openTickets: 0,
    slaRate: 98.5,
  };

  return (
    <div className="space-y-10">
      {/* 1. Spacious Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-10 shadow-[0_2px_12px_rgba(15,23,42,0.03)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/90 text-xs font-medium text-slate-600">
              <span
                className={`w-2 h-2 rounded-full ${
                  overview?.dbConnected !== false ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span>{overview?.dbConnected !== false ? "MongoDB Cloud Đã Kết Nối" : "Đang kết nối dữ liệu"}</span>
              <span className="text-slate-300">·</span>
              <span className="text-indigo-600 font-semibold">Digital Warranty Vault</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.18]">
              Quản lý hồ sơ chứng nhận &amp; theo dõi bảo hành tinh gọn.
            </h1>

            <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-xl">
              Lưu trữ giấy tờ bảo hành số hóa, kết xuất thẻ QR xác thực độ phân giải cao, cảnh báo thiết bị sắp đáo hạn và định tuyến trạm kỹ thuật bằng AI.
            </p>

            {/* Instant Search Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/lookup?q=${encodeURIComponent(quickQuery.trim() || "DLXPS-99281-VN")}`);
              }}
              className="flex flex-col sm:flex-row gap-2.5 max-w-xl pt-1"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  placeholder="Nhập Serial, IMEI hoặc mã giấy WB-2026-8801..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-all cursor-pointer shrink-0"
              >
                <span>Tra cứu ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
              <span>Thử nhanh:</span>
              {["DLXPS-99281-VN", "MACM3P-77410-VN", "IMEI-3589120941"].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => navigate(`/lookup?q=${sample}`)}
                  className="font-mono px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition-colors cursor-pointer"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner">
              <img
                src="/assets/hero-workspace.jpg"
                alt="Digital Warranty Certificate Illustration"
                className="w-full h-64 sm:h-72 object-cover"
              />
              <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/90 backdrop-blur-md border border-white/80 px-4 py-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Studio Chứng Nhận Số</div>
                    <div className="text-[11px] text-slate-500">Tạo &amp; tải ảnh thẻ bảo hành PNG</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => records[0] && setStudioRecord(records[0])}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Mở thử →
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 2. Clean 4-Card KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Hồ sơ chứng nhận số",
            value: kpis.totalRecords,
            sub: "giấy tờ đang lưu trữ",
            icon: FileText,
            tone: "bg-indigo-50 text-indigo-600",
          },
          {
            label: "Sắp hết hạn (≤ 30 ngày)",
            value: kpis.expiringCount,
            sub: "cần lưu ý gia hạn",
            icon: Clock,
            tone: "bg-amber-50 text-amber-600",
          },
          {
            label: "Phiếu đang xử lý",
            value: kpis.openTickets,
            sub: "tại trạm kỹ thuật",
            icon: Wrench,
            tone: "bg-sky-50 text-sky-600",
          },
          {
            label: "Cam kết đúng hạn SLA",
            value: `${kpis.slaRate}%`,
            sub: "hiệu suất toàn hệ thống",
            icon: CheckCircle2,
            tone: "bg-emerald-50 text-emerald-600",
          },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.28 }}
            className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-[0_1px_4px_rgba(15,23,42,0.02)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500">{item.label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.tone}`}>
                <item.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                {loading ? "—" : item.value}
              </span>
              <span className="text-xs text-slate-400">{item.sub}</span>
            </div>
          </motion.div>
        ))}
      </section>

      {/* 3. Main 2-Column Workspace */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Digital Documents & Active Tickets */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-[0_1px_6px_rgba(15,23,42,0.02)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Kho Hồ sơ &amp; Giấy Bảo hành</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhấp vào từng hồ sơ để kết xuất ảnh chứng nhận QR hoặc tra cứu chi tiết.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer self-start"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cấp chứng nhận mới</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 py-4">
              {[
                { id: "all", label: "Tất cả hồ sơ" },
                { id: "active", label: "Còn hiệu lực" },
                { id: "expiring", label: "Sắp đáo hạn" },
                { id: "expired", label: "Đã hết hạn" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRecordFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    recordFilter === tab.id
                      ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Document List */}
            <div className="space-y-3">
              {filteredRecords.slice(0, 5).map((rec) => {
                const meta = getRecordStatusMeta(rec.computedStatus, rec.daysRemaining);
                return (
                  <div
                    key={rec._id}
                    className="group rounded-2xl border border-slate-200/75 hover:border-indigo-200 bg-slate-50/40 hover:bg-white p-4 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600">
                            {rec.wbCode}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono text-xs text-slate-500">{rec.serialNumber}</span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${meta.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                            {meta.label}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {rec.productName}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Chủ sở hữu: <span className="font-medium text-slate-700">{rec.customerName}</span> · Hạn đến {formatDateVN(rec.endDate)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setStudioRecord(rec)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Thẻ QR</span>
                        </button>
                        <Link
                          to={`/lookup?q=${encodeURIComponent(rec.serialNumber)}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 transition-colors"
                        >
                          <span>Chi tiết</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!loading && filteredRecords.length === 0 && (
                <div className="text-center py-10">
                  <img
                    src="/assets/empty-vault.jpg"
                    alt="Empty Vault"
                    className="w-28 h-28 object-cover rounded-2xl mx-auto mb-3 opacity-90"
                  />
                  <p className="text-sm font-semibold text-slate-700">Chưa có hồ sơ trong nhóm này</p>
                  <p className="text-xs text-slate-400 mt-1">Hãy chọn bộ lọc khác hoặc cấp giấy chứng nhận mới.</p>
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Hiển thị {Math.min(5, filteredRecords.length)} / {filteredRecords.length} chứng từ</span>
              <Link to="/my-devices" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Xem toàn bộ sổ thiết bị →
              </Link>
            </div>
          </div>

          {/* Active Repair Tickets Preview */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-[0_1px_6px_rgba(15,23,42,0.02)]">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Phiếu Yêu cầu Bảo hành Gần đây</h2>
                <p className="text-xs text-slate-500 mt-0.5">Theo dõi tiến độ sửa chữa 6 bước thời gian thực</p>
              </div>
              <Link
                to="/track"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Mở cổng theo dõi →
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {(overview?.recentTickets || []).slice(0, 4).map((t) => {
                const st = getTicketStatusMeta(t.status);
                return (
                  <Link
                    key={t._id}
                    to={`/track?ticket=${encodeURIComponent(t.warrantyCode)}`}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 -mx-3 px-3 rounded-xl transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">{t.warrantyCode}</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${st.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dotClass}`} />
                          {t.status}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {t.productName}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {t.assignedBranch?.name} · KTV: {t.assignedTechnician?.name}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: AI Smart Branch Assistant + Expiring Alerts */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Routing Assistant Card */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-[0_1px_6px_rgba(15,23,42,0.02)] space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Smart Dispatch</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  Định tuyến Trạm Tiếp nhận
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhập địa chỉ trên giấy bảo hành để gợi ý trạm gần nhất &amp; ít tải nhất.
                </p>
              </div>
              <img
                src="/assets/ai-routing.jpg"
                alt="AI Routing"
                className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0"
              />
            </div>

            <form onSubmit={handleAnalyzeBranch} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Địa chỉ khách hàng / chứng từ
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={aiAddress}
                    onChange={(e) => setAiAddress(e.target.value)}
                    placeholder="VD: 204 Phan Văn Trị, Bình Thạnh, TP.HCM"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <select
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
                >
                  <option>Laptop/Máy tính</option>
                  <option>Điện thoại</option>
                  <option>Màn hình</option>
                  <option>Thiết bị âm thanh</option>
                </select>
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {aiLoading ? "Đang quét..." : "Phân tích AI"}
                </button>
              </div>
            </form>

            {aiResult?.matched && aiResult.primary && (
              <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100 p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-indigo-900">
                    {aiResult.primary.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                    Độ khớp {aiResult.confidence}%
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{aiResult.primary.address}</p>
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600 pt-1">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200/80">
                    {aiResult.primary.distanceText}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200/80">
                    Tải trạm {aiResult.primary.loadPercent}%
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200/80">
                    KTV: {aiResult.primary.recommendedTech?.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  {aiResult.primary.reason}
                </p>
              </div>
            )}
          </div>

          {/* Expiring Documents Alert Box */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-[0_1px_6px_rgba(15,23,42,0.02)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Hồ sơ Sắp Đáo Hạn</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                {(overview?.expiringAlerts || []).length} chứng từ
              </span>
            </div>

            <div className="space-y-2.5">
              {(overview?.expiringAlerts || []).slice(0, 4).map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/60"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{item.productName}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {item.wbCode} · {item.daysRemaining >= 0 ? `Còn ${item.daysRemaining} ngày` : `Quá hạn ${Math.abs(item.daysRemaining)} ngày`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickRenew(item)}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-200 text-amber-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    +12 tháng
                  </button>
                </div>
              ))}
              {(overview?.expiringAlerts || []).length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">
                  Tất cả chứng nhận bảo hành đều đang còn hạn dài.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Certificate Studio Modal */}
      <CertificateStudioModal
        open={Boolean(studioRecord)}
        onClose={() => setStudioRecord(null)}
        record={studioRecord}
      />

      {/* Quick Issue New Certificate Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Cấp Giấy Chứng Nhận Bảo Hành Điện Tử"
        subtitle="Lưu trữ hồ sơ mới vào MongoDB & tự động khởi tạo mã QR xác thực"
      >
        <form onSubmit={handleQuickCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số Serial / IMEI *
              </label>
              <input
                required
                value={newForm.serialNumber}
                onChange={(e) => setNewForm({ ...newForm, serialNumber: e.target.value })}
                placeholder="VD: DLXPS-2026-998"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nhóm thiết bị
              </label>
              <select
                value={newForm.category}
                onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option>Laptop/Máy tính</option>
                <option>Điện thoại</option>
                <option>Màn hình</option>
                <option>Thiết bị âm thanh</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên thiết bị đầy đủ *
            </label>
            <input
              required
              value={newForm.productName}
              onChange={(e) => setNewForm({ ...newForm, productName: e.target.value })}
              placeholder="VD: MacBook Air 15 M3 16GB/512GB Chính hãng VN/A"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ tên chủ sở hữu
              </label>
              <input
                value={newForm.customerName}
                onChange={(e) => setNewForm({ ...newForm, customerName: e.target.value })}
                placeholder="VD: Nguyễn Minh Quân"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại
              </label>
              <input
                value={newForm.customerPhone}
                onChange={(e) => setNewForm({ ...newForm, customerPhone: e.target.value })}
                placeholder="VD: 0909123456"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Địa chỉ đăng ký trên phiếu
              </label>
              <input
                value={newForm.customerAddress}
                onChange={(e) => setNewForm({ ...newForm, customerAddress: e.target.value })}
                placeholder="VD: 88 Láng Hạ, Đống Đa, Hà Nội"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thời hạn (tháng)
              </label>
              <select
                value={newForm.periodMonths}
                onChange={(e) => setNewForm({ ...newForm, periodMonths: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value={12}>12 tháng</option>
                <option value={24}>24 tháng</option>
                <option value={36}>36 tháng</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold cursor-pointer"
            >
              {creating ? "Đang lưu..." : "Lưu & Tạo Thẻ QR"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
