import { useEffect, useState } from "react";
import {
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Layers,
  Trash2,
} from "lucide-react";
import { recordsApi } from "../../api/client";
import { formatDateVN, getRecordStatusMeta } from "../../utils/format";
import { CertificateStudioModal } from "../../components/certificate/CertificateStudioModal";
import { Modal } from "../../components/common/Modal";
import { useToast } from "../../context/ToastContext";

export const AdminRecordsPage = () => {
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [counts, setCounts] = useState({ all: 0, active: 0, expiring: 0, expired: 0 });
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [studioRecord, setStudioRecord] = useState(null);

  // Issue new modal
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    serialNumber: "",
    productName: "",
    category: "Laptop/Máy tính",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    periodMonths: 24,
    activationChannel: "ADMIN",
  });

  // Batch check modal
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchInput, setBatchInput] = useState("DLXPS-99281-VN\nMACM3P-77410-VN\nSN-CHUA-KICH-HOAT");
  const [batchResults, setBatchResults] = useState([]);

  const loadRecords = async () => {
    try {
      const res = await recordsApi.list({ status, q });
      setRecords(res.data || []);
      if (res.counts) setCounts(res.counts);
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [status]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await recordsApi.create(form);
      toast.success(res.message);
      setCreateOpen(false);
      setForm({
        serialNumber: "",
        productName: "",
        category: "Laptop/Máy tính",
        customerName: "",
        customerPhone: "",
        customerAddress: "",
        periodMonths: 24,
        activationChannel: "ADMIN",
      });
      loadRecords();
      setStudioRecord(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRenew = async (id) => {
    try {
      const res = await recordsApi.renew(id, { months: 12 });
      toast.success(res.message);
      loadRecords();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await recordsApi.remove(id);
      toast.info(res.message);
      loadRecords();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBatchCheck = async (e) => {
    e.preventDefault();
    try {
      const res = await recordsApi.batchCheck(batchInput);
      setBatchResults(res.data || []);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = records.filter((r) => {
    if (!q.trim()) return true;
    const s = q.trim().toLowerCase();
    return (
      r.wbCode.toLowerCase().includes(s) ||
      r.serialNumber.toLowerCase().includes(s) ||
      r.productName.toLowerCase().includes(s) ||
      r.customerName.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Kho Hồ sơ &amp; Chứng nhận Bảo hành
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cấp mới chứng từ số, gia hạn thời hạn bảo vệ, kết xuất ảnh QR và kiểm tra lô Serial.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setBatchOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Batch Check Serial</span>
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cấp chứng nhận mới</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "all", label: `Tất cả (${counts.all})` },
            { id: "active", label: `Còn hạn (${counts.active})` },
            { id: "expiring", label: `Sắp hết hạn (${counts.expiring})` },
            { id: "expired", label: `Đã hết hạn (${counts.expired})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setStatus(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                status === t.id ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo WB-xxxx, Serial, tên khách..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-[0_1px_6px_rgba(15,23,42,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Mã Chứng Nhận</th>
                <th className="px-6 py-4">Thiết bị &amp; Serial</th>
                <th className="px-6 py-4">Chủ sở hữu</th>
                <th className="px-6 py-4">Hiệu lực</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((rec) => {
                const meta = getRecordStatusMeta(rec.computedStatus, rec.daysRemaining);
                return (
                  <tr key={rec._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">{rec.wbCode}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 max-w-[260px] truncate">
                        {rec.productName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">{rec.serialNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{rec.customerName}</div>
                      <div className="text-slate-400">{rec.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div>{formatDateVN(rec.purchaseDate)} →</div>
                      <div className="font-semibold text-slate-800">{formatDateVN(rec.endDate)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setStudioRecord(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 font-semibold cursor-pointer"
                          title="Mở Studio Thẻ QR"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRenew(rec._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 font-semibold cursor-pointer"
                          title="Gia hạn thêm 12 tháng"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>+12T</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rec._id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Xóa hồ sơ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Studio Modal */}
      <CertificateStudioModal
        open={Boolean(studioRecord)}
        onClose={() => setStudioRecord(null)}
        record={studioRecord}
      />

      {/* Issue Certificate Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Cấp Mới Chứng Nhận Bảo Hành Điện Tử"
        subtitle="Khởi tạo chứng từ gốc lưu trữ trên MongoDB"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số Serial *</label>
              <input
                required
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                placeholder="DELL-2026-8891"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Thời hạn</label>
              <select
                value={form.periodMonths}
                onChange={(e) => setForm({ ...form, periodMonths: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              >
                <option value={12}>12 tháng</option>
                <option value={24}>24 tháng</option>
                <option value={36}>36 tháng</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên thiết bị *</label>
            <input
              required
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              placeholder="Dell Precision 5680 Workstation"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Khách hàng *</label>
              <input
                required
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại *</label>
              <input
                required
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ</label>
            <input
              value={form.customerAddress}
              onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
            >
              Cấp chứng nhận
            </button>
          </div>
        </form>
      </Modal>

      {/* Batch Check Serial Modal */}
      <Modal
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        title="Kiểm tra Hàng loạt Serial / IMEI"
        subtitle="Nhập mỗi dòng 1 mã Serial hoặc phân tách bằng dấu phẩy"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleBatchCheck} className="space-y-4">
          <textarea
            rows={4}
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
            className="w-full p-3.5 rounded-2xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
            >
              Đối chiếu hàng loạt
            </button>
          </div>

          {batchResults.length > 0 && (
            <div className="rounded-2xl border border-slate-200 overflow-hidden mt-3">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Mã tra cứu</th>
                    <th className="px-4 py-2.5">Thiết bị</th>
                    <th className="px-4 py-2.5">Mã giấy</th>
                    <th className="px-4 py-2.5">Kết quả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batchResults.map((r, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 font-mono font-bold">{r.query}</td>
                      <td className="px-4 py-2.5">{r.productName}</td>
                      <td className="px-4 py-2.5 font-mono text-indigo-600">{r.wbCode}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            r.found
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {r.found ? `Còn ${r.daysRemaining} ngày` : "Chưa kích hoạt"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};
