import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  QrCode,
  Plus,
  ChevronRight,
  MapPin,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { analyticsApi, recordsApi } from "../../api/client";
import { formatDateVN, getRecordStatusMeta, getTicketStatusMeta } from "../../utils/format";
import { CertificateStudioModal } from "../../components/certificate/CertificateStudioModal";
import { AiExpiryRouteAdvisor } from "../../components/ai/AiExpiryRouteAdvisor";
import { DeviceInsightsModal } from "../../components/ai/DeviceInsightsModal";
import { DeviceNewsroomRadar } from "../../components/ai/DeviceNewsroomRadar";
import { Modal } from "../../components/common/Modal";
import { useToast } from "../../context/ToastContext";

const CATEGORY_LIST = [
  "Laptop/Máy tính",
  "Điện thoại",
  "Màn hình",
  "Thiết bị âm thanh",
  "Linh kiện",
  "Thiết bị gia dụng",
  "Phụ kiện",
  "Khác",
];

export const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "ai"
      ? "ai"
      : searchParams.get("tab") === "news"
        ? "news"
        : "vault";
  const toast = useToast();

  const [activeView, setActiveView] = useState(initialTab);
  const [radarDevice, setRadarDevice] = useState({
    name: "",
    category: "",
  });
  const [overview, setOverview] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [recordFilter, setRecordFilter] = useState("all");
  const [advisorRefreshKey, setAdvisorRefreshKey] = useState(0);

  // Modals
  const [studioRecord, setStudioRecord] = useState(null);
  const [insightTarget, setInsightTarget] = useState(null);
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

  useEffect(() => {
    const tab = searchParams.get("tab");
    setActiveView(tab === "ai" ? "ai" : tab === "news" ? "news" : "vault");
  }, [searchParams]);

  const switchView = (next) => {
    setActiveView(next);
    if (next === "ai" || next === "news") setSearchParams({ tab: next });
    else setSearchParams({});
  };

  const openNewsroomForDevice = (rec) => {
    setRadarDevice({
      name: rec?.productName || "Acer Nitro 5",
      category: rec?.category || "Laptop/Máy tính",
    });
    const el = document.getElementById("community-newsroom");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      switchView("news");
    }
  };

  const fetchWorkspace = async () => {
    setLoading(true);
    try {
      const [ovRes, recRes] = await Promise.allSettled([
        analyticsApi.overview("all"),
        recordsApi.list({ status: "all" }),
      ]);

      if (ovRes.status === "fulfilled") setOverview(ovRes.value.data);
      if (recRes.status === "fulfilled") {
        const list = recRes.value.data || [];
        setRecords(list);
        // Tự chọn đúng thiết bị người dùng đang có (ưu tiên thiết bị sắp hết hạn) để quét lỗi chính xác
        if (list.length > 0) {
          const preferred = list.find((r) => r.computedStatus === "expiring") || list[0];
          setRadarDevice((prev) =>
            prev.name
              ? prev
              : { name: preferred.productName, category: preferred.category || "" }
          );
        }
      }

      const firstErr = [ovRes, recRes].find((r) => r.status === "rejected");
      if (firstErr) {
        toast.error(firstErr.reason?.message || "Một số dữ liệu chưa thể tải từ máy chủ.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, []);

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
      setAdvisorRefreshKey((k) => k + 1);
      setStudioRecord(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchStatus = recordFilter === "all" || r.computedStatus === recordFilter;
    const q = searchText.trim().toLowerCase();
    const matchQ =
      !q ||
      r.productName?.toLowerCase().includes(q) ||
      r.serialNumber?.toLowerCase().includes(q) ||
      r.wbCode?.toLowerCase().includes(q) ||
      r.customerName?.toLowerCase().includes(q);
    return matchStatus && matchQ;
  });

  const kpis = overview?.kpis || {
    totalRecords: 0,
    expiringCount: 0,
    openTickets: 0,
    slaRate: 99.6,
  };

  return (
    <div className="space-y-12">
      {/* 1. Spacious Apple Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#6E6E73]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                overview === null
                  ? "bg-neutral-300 animate-pulse"
                  : overview.dbConnected
                    ? "bg-emerald-500"
                    : "bg-amber-500"
              }`}
            />
            <span>
              {overview === null
                ? "Đang đồng bộ..."
                : overview.dbConnected
                  ? "MongoDB đã kết nối"
                  : "Chưa kết nối CSDL"}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#1D1D1F]">
            Không gian Hồ sơ
          </h1>
          <p className="text-sm sm:text-base text-[#6E6E73]">
            Quản lý giấy bảo hành số hóa, quét thiết bị sắp hết hạn và định tuyến GPS tới trung tâm gần nhất.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => switchView("news")}
            className="editorial-pill-btn inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#F5F5F7] hover:bg-[#EAEAEF] text-[#1D1D1F] text-[13px] font-medium cursor-pointer"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Bản tin lỗi cộng đồng</span>
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="editorial-pill-btn inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-[13px] font-medium cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cấp chứng nhận mới</span>
          </button>
        </div>
      </div>

      {/* 2. Ultra-Quiet 4-Metric Strip — Zero loud icon squares */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[
          { label: "Hồ sơ chứng nhận", value: loading ? "—" : kpis.totalRecords, sub: "Đang lưu trữ" },
          { label: "Sắp đáo hạn", value: loading ? "—" : kpis.expiringCount, sub: "Trong 30 ngày tới" },
          { label: "Phiếu RMA đang mở", value: loading ? "—" : kpis.openTickets, sub: "Đang xử lý kỹ thuật" },
          { label: "Đúng hạn SLA", value: `${kpis.slaRate}%`, sub: "Hiệu suất 5 trung tâm" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[22px] bg-[#F5F5F7] px-6 py-5 space-y-1.5"
          >
            <div className="text-xs text-[#6E6E73]">{stat.label}</div>
            <div className="font-display text-3xl font-semibold tracking-[-0.03em] text-[#1D1D1F] tabular-nums">
              {stat.value}
            </div>
            <div className="text-xs text-[#86868B]">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* 3. Spacious Apple Segmented Workspace Switch with Framer Motion spring pill */}
      <div className="inline-flex flex-wrap p-1.5 rounded-full bg-[#F5F5F7]">
        {[
          { id: "vault", label: "Kho Chứng nhận & Bản tin", count: null },
          { id: "ai", label: "AI Cảnh báo & Định tuyến GPS", count: kpis.expiringCount },
          { id: "news", label: "Bản tin Lỗi Cộng đồng", count: null },
        ].map((tab) => {
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchView(tab.id)}
              className={`relative px-6 py-2.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                isActive ? "text-[#1D1D1F]" : "text-[#6E6E73] hover:text-[#1D1D1F]"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="homeActiveTabPill"
                  transition={{ type: "spring", stiffness: 360, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-white shadow-xs"
                />
              )}
              <span className="relative z-10">{tab.label}</span>
              {tab.count > 0 && (
                <span className="relative z-10 w-5 h-5 rounded-full bg-[#1D1D1F] text-white text-[11px] font-semibold inline-flex items-center justify-center">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
      {/* VIEW A: SPACIOUS DIGITAL WARRANTY VAULT + RECENT RMA */}
      {activeView === "vault" && (
        <motion.div
          key="vault-view"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-14"
        >
          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "Tất cả" },
                { id: "active", label: "Còn hiệu lực" },
                { id: "expiring", label: "Sắp đáo hạn" },
                { id: "expired", label: "Đã hết hạn" },
                { id: "rejected", label: "Đã thu hồi" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRecordFilter(tab.id)}
                  className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
                    recordFilter === tab.id
                      ? "bg-[#1D1D1F] text-white"
                      : "bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-[#86868B] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Lọc theo tên máy, Serial, mã WB..."
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#F5F5F7] text-[13px] text-[#1D1D1F] placeholder:text-[#86868B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D1D1F]"
              />
            </div>
          </div>

          {/* Spacious 3-Column Apple Wallet Card Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-56 rounded-[24px] bg-[#F5F5F7] animate-pulse" />
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="rounded-[28px] bg-[#F5F5F7] py-16 px-6 text-center space-y-2">
              <p className="text-base font-semibold text-[#1D1D1F]">
                Không tìm thấy chứng nhận phù hợp
              </p>
              <p className="text-sm text-[#6E6E73]">
                Thử đổi bộ lọc trạng thái hoặc cấp giấy chứng nhận mới.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecords.map((rec) => {
                const meta = getRecordStatusMeta(rec.computedStatus, rec.daysRemaining);
                return (
                  <div
                    key={rec._id}
                    className="apple-card rounded-[24px] bg-[#F5F5F7] hover:bg-[#EFEFF4] p-6 flex flex-col justify-between gap-6"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono text-[#6E6E73]">{rec.wbCode}</span>
                        <span className="inline-flex items-center gap-1.5 font-medium text-[#1D1D1F]">
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                          {meta.label}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-[#1D1D1F] leading-snug line-clamp-2">
                          {rec.productName}
                        </h3>
                        <div className="font-mono text-xs text-[#86868B]">{rec.serialNumber}</div>
                      </div>

                      <div className="space-y-1.5 pt-2 text-xs text-[#6E6E73]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#86868B] shrink-0" />
                          <span>
                            {rec.customerName} · Hạn {formatDateVN(rec.endDate)}
                          </span>
                        </div>
                        {rec.customerAddress && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-[#86868B] shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{rec.customerAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-4 border-t border-black/[0.06]">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setStudioRecord(rec)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-[#1D1D1F] hover:text-white text-xs font-medium text-[#1D1D1F] transition-colors cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Thẻ QR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openNewsroomForDevice(rec)}
                          title="Xem lỗi phổ biến & bài viết cộng đồng về dòng máy này"
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-white hover:bg-[#1D1D1F] hover:text-white text-xs font-medium text-[#6E6E73] transition-colors cursor-pointer"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Lỗi hay gặp</span>
                        </button>
                      </div>
                      <Link
                        to={`/lookup?q=${encodeURIComponent(rec.serialNumber)}`}
                        className="inline-flex items-center gap-0.5 text-xs font-medium text-[#1D1D1F] hover:text-[#6E6E73] transition-colors shrink-0"
                      >
                        <span>Chi tiết</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent RMA Tickets — Clean Spacious Rows */}
          <div className="space-y-5 pt-4 border-t border-black/[0.08]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-[#1D1D1F]">
                  Phiếu yêu cầu RMA gần đây
                </h2>
                <p className="text-xs text-[#6E6E73] mt-0.5">
                  Theo dõi tiến độ sửa chữa 6 bước thời gian thực
                </p>
              </div>
              <Link
                to="/track"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#1D1D1F] hover:text-[#6E6E73]"
              >
                <span>Mở cổng theo dõi</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-black/[0.06] rounded-[24px] border border-black/[0.08] bg-white px-6">
              {loading ? (
                <div className="py-6 space-y-3">
                  {[1, 2].map((n) => (
                    <div key={n} className="h-14 rounded-xl bg-[#F5F5F7] animate-pulse" />
                  ))}
                </div>
              ) : (overview?.recentTickets || []).length === 0 ? (
                <div className="py-10 text-center text-sm text-[#86868B]">
                  Chưa có phiếu yêu cầu bảo hành nào đang hoạt động.
                </div>
              ) : (
                (overview?.recentTickets || []).slice(0, 5).map((t) => {
                  const st = getTicketStatusMeta(t.status);
                  return (
                    <Link
                      key={t._id}
                      to={`/track?ticket=${encodeURIComponent(t.warrantyCode)}`}
                      className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:opacity-75 transition-opacity"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-mono text-xs font-semibold text-[#1D1D1F]">
                            {t.warrantyCode}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#6E6E73]">
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dotClass}`} />
                            {t.status}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-[#1D1D1F] truncate">
                          {t.productName}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#6E6E73] shrink-0">
                        <span>
                          {[
                            t.assignedBranch?.name,
                            t.assignedTechnician?.name ? `KTV ${t.assignedTechnician.name}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Chờ điều phối"}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#86868B]" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
          {/* Editorial Community Error Newsroom — Prominent right on /home! */}
          <div className="pt-8 border-t border-black/[0.08]">
            <DeviceNewsroomRadar
              initialDeviceName={radarDevice.name}
              initialCategory={radarDevice.category}
              suggestedDevices={records}
            />
          </div>
        </motion.div>
      )}

      {/* VIEW B: FULL-WIDTH SPACIOUS AI EXPIRY & GPS ROUTE ADVISOR */}
      {activeView === "ai" && (
        <motion.div
          key="ai-view"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <AiExpiryRouteAdvisor
            onRenewed={fetchWorkspace}
            refreshKey={advisorRefreshKey}
          />
        </motion.div>
      )}

      {/* VIEW C: DEDICATED FULL-FOCUS NEWSROOM VIEW */}
      {activeView === "news" && (
        <motion.div
          key="news-view"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <DeviceNewsroomRadar
            initialDeviceName={radarDevice.name}
            initialCategory={radarDevice.category}
            suggestedDevices={records}
          />
        </motion.div>
      )}
      </AnimatePresence>

      {/* Certificate Studio Modal */}
      <CertificateStudioModal
        open={Boolean(studioRecord)}
        onClose={() => setStudioRecord(null)}
        record={studioRecord}
      />

      {/* Plug-and-play AI Device Warranty Insights Modal */}
      <DeviceInsightsModal
        open={Boolean(insightTarget)}
        onClose={() => setInsightTarget(null)}
        deviceName={insightTarget?.productName || ""}
        category={insightTarget?.category || ""}
      />

      {/* Quick Issue New Certificate Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Cấp Giấy Chứng Nhận Bảo Hành"
        subtitle="Lưu trữ hồ sơ vào MongoDB và khởi tạo mã QR xác thực"
      >
        <form onSubmit={handleQuickCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6E6E73] mb-1.5">
                Số Serial / IMEI *
              </label>
              <input
                required
                minLength={3}
                value={newForm.serialNumber}
                onChange={(e) => setNewForm({ ...newForm, serialNumber: e.target.value })}
                placeholder="VD: DLXPS-2026-998"
                className="w-full px-4 py-2.5 rounded-xl bg-[#F5F5F7] border border-transparent text-sm font-mono uppercase focus:bg-white focus:outline-none focus:border-[#1D1D1F]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6E6E73] mb-1.5">
                Nhóm thiết bị
              </label>
              <select
                value={newForm.category}
                onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F5F5F7] border border-transparent text-sm focus:bg-white focus:outline-none focus:border-[#1D1D1F]"
              >
                {CATEGORY_LIST.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6E6E73] mb-1.5">
              Tên thiết bị đầy đủ *
            </label>
            <input
              required
              minLength={2}
              value={newForm.productName}
              onChange={(e) => setNewForm({ ...newForm, productName: e.target.value })}
              placeholder="VD: MacBook Air 15 M3 16GB/512GB"
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F5F7] border border-transparent text-sm focus:bg-white focus:outline-none focus:border-[#1D1D1F]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6E6E73] mb-1.5">
                Chủ sở hữu
              </label>
              <input
                value={newForm.customerName}
                onChange={(e) => setNewForm({ ...newForm, customerName: e.target.value })}
                placeholder="Nguyễn Minh Quân"
                className="w-full px-4 py-2.5 rounded-xl bg-[#F5F5F7] border border-transparent text-sm focus:bg-white focus:outline-none focus:border-[#1D1D1F]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6E6E73] mb-1.5">
                Số điện thoại
              </label>
              <input
                value={newForm.customerPhone}
                onChange={(e) => setNewForm({ ...newForm, customerPhone: e.target.value })}
                placeholder="0912.345.678"
                className="w-full px-4 py-2.5 rounded-xl bg-[#F5F5F7] border border-transparent text-sm focus:bg-white focus:outline-none focus:border-[#1D1D1F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#6E6E73] mb-1.5">
                Địa chỉ trên chứng từ (AI tự định tuyến)
              </label>
              <input
                value={newForm.customerAddress}
                onChange={(e) => setNewForm({ ...newForm, customerAddress: e.target.value })}
                placeholder="VD: 142 Nguyễn Thị Minh Khai, Q.3, TP.HCM"
                className="w-full px-4 py-2.5 rounded-xl bg-[#F5F5F7] border border-transparent text-sm focus:bg-white focus:outline-none focus:border-[#1D1D1F]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6E6E73] mb-1.5">
                Thời hạn (tháng)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={newForm.periodMonths}
                onChange={(e) => setNewForm({ ...newForm, periodMonths: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F5F5F7] border border-transparent text-sm focus:bg-white focus:outline-none focus:border-[#1D1D1F]"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-5 py-2.5 rounded-full text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={creating}
              className="editorial-pill-btn px-6 py-2.5 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-xs font-medium cursor-pointer disabled:opacity-60"
            >
              {creating ? "Đang lưu..." : "Lưu & tạo thẻ QR"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
