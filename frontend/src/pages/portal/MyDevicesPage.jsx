import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { recordsApi } from "../../api/client";
import { formatDateVN, getRecordStatusMeta } from "../../utils/format";
import { CertificateStudioModal } from "../../components/certificate/CertificateStudioModal";
import { Modal } from "../../components/common/Modal";
import { useToast } from "../../context/ToastContext";

export const MyDevicesPage = () => {
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [counts, setCounts] = useState({ all: 0, active: 0, expiring: 0, expired: 0 });
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const [studioRecord, setStudioRecord] = useState(null);
  const [renewTarget, setRenewTarget] = useState(null);
  const [renewMonths, setRenewMonths] = useState(12);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [form, setForm] = useState({
    serialNumber: "",
    productName: "",
    category: "Laptop/Máy tính",
    purchaseDate: new Date().toISOString().slice(0, 10),
    periodMonths: 12,
  });

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await recordsApi.list({ status, q, mine: "true" });
      setRecords(res.data || []);
      if (res.counts) setCounts(res.counts);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, [status]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await recordsApi.create(form);
      toast.success(res.message);
      setRegisterOpen(false);
      setForm({
        serialNumber: "",
        productName: "",
        category: "Laptop/Máy tính",
        purchaseDate: new Date().toISOString().slice(0, 10),
        periodMonths: 12,
      });
      loadDevices();
      setStudioRecord(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!renewTarget) return;
    try {
      const res = await recordsApi.renew(renewTarget._id, { months: renewMonths });
      toast.success(res.message);
      setRenewTarget(null);
      loadDevices();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const displayed = records.filter((r) => {
    if (!q.trim()) return true;
    const kw = q.trim().toLowerCase();
    return (
      r.productName.toLowerCase().includes(kw) ||
      r.serialNumber.toLowerCase().includes(kw) ||
      r.wbCode.toLowerCase().includes(kw)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
            <ShieldCheck className="w-4 h-4" />
            <span>Sổ Lưu Trữ Tài Sản &amp; Giấy Bảo Hành</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Thiết bị &amp; Chứng nhận của tôi
          </h1>
          <p className="text-sm text-slate-500">
            Quản lý tập trung toàn bộ thời hạn bảo hành, gia hạn trực tuyến và tải thẻ QR xác thực.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRegisterOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Kích hoạt Serial mới</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "all", label: `Tất cả (${counts.all})` },
            { id: "active", label: `Còn hiệu lực (${counts.active})` },
            { id: "expiring", label: `Sắp đáo hạn (${counts.expiring})` },
            { id: "expired", label: `Đã hết hạn (${counts.expired})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatus(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                status === tab.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên máy, Serial..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayed.map((rec, idx) => {
          const meta = getRecordStatusMeta(rec.computedStatus, rec.daysRemaining);
          return (
            <motion.div
              key={rec._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="flex flex-col rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-[0_2px_10px_rgba(15,23,42,0.02)] hover:border-indigo-200 transition-all"
            >
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <img
                  src={rec.image}
                  alt={rec.productName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md bg-white/90 ${meta.badgeClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                    {meta.label}
                  </span>
                </div>
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/75 backdrop-blur text-white font-mono text-[11px] font-semibold">
                  {rec.wbCode}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-2">
                  <div className="text-[11px] font-mono font-semibold text-indigo-600">
                    SN: {rec.serialNumber}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                    {rec.productName}
                  </h3>
                  <p className="text-xs text-slate-500">{rec.packageName}</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDateVN(rec.purchaseDate)}
                      </span>
                      <span>Đáo hạn: {formatDateVN(rec.endDate)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${meta.barClass}`}
                        style={{ width: `${rec.percentPassed}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStudioRecord(rec)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 hover:border-indigo-300 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Thẻ QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRenewTarget(rec);
                        setRenewMonths(12);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 hover:border-emerald-300 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Gia hạn</span>
                    </button>
                    <Link
                      to={`/submit-request?serial=${encodeURIComponent(rec.serialNumber)}`}
                      className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                      title="Gửi yêu cầu bảo hành"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!loading && displayed.length === 0 && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center space-y-3">
          <img
            src="/assets/empty-vault.jpg"
            alt="Empty Vault"
            className="w-32 h-32 object-cover rounded-2xl mx-auto"
          />
          <h3 className="text-base font-bold text-slate-900">Không tìm thấy thiết bị phù hợp</h3>
          <p className="text-xs text-slate-500">
            Bạn có thể kích hoạt Serial thiết bị mới để lưu trữ giấy chứng nhận điện tử.
          </p>
        </div>
      )}

      {/* Certificate Studio */}
      <CertificateStudioModal
        open={Boolean(studioRecord)}
        onClose={() => setStudioRecord(null)}
        record={studioRecord}
      />

      {/* Register Modal */}
      <Modal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="Kích hoạt Bảo hành Thiết bị Mới"
        subtitle="Đăng ký số Serial để nhận Giấy chứng nhận bảo hành điện tử tức thì"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Số Serial / IMEI trên thân máy *
            </label>
            <input
              required
              value={form.serialNumber}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              placeholder="VD: MBP16-88320-VN"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên sản phẩm *
            </label>
            <input
              required
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              placeholder="VD: MacBook Pro 16 M3 Max Chính hãng"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Danh mục</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
              >
                <option>Laptop/Máy tính</option>
                <option>Điện thoại</option>
                <option>Màn hình</option>
                <option>Thiết bị âm thanh</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày mua</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gói hạn</label>
              <select
                value={form.periodMonths}
                onChange={(e) => setForm({ ...form, periodMonths: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
              >
                <option value={12}>12 tháng</option>
                <option value={24}>24 tháng</option>
                <option value={36}>36 tháng</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setRegisterOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold cursor-pointer"
            >
              Kích hoạt ngay
            </button>
          </div>
        </form>
      </Modal>

      {/* Renew Modal */}
      <Modal
        open={Boolean(renewTarget)}
        onClose={() => setRenewTarget(null)}
        title="Gia hạn Gói Bảo vệ Thiết bị"
        subtitle={renewTarget ? `${renewTarget.productName} (${renewTarget.serialNumber})` : ""}
      >
        <form onSubmit={handleRenewSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[6, 12, 24].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setRenewMonths(m)}
                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                  renewMonths === m
                    ? "border-indigo-600 bg-indigo-50/70 text-indigo-900"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="text-lg font-extrabold">+{m} tháng</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Chứng nhận mở rộng</div>
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRenewTarget(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold cursor-pointer"
            >
              Xác nhận gia hạn
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
