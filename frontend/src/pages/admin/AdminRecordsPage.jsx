import { useEffect, useState } from "react";
import {
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Layers,
  Trash2,
  Edit3,
  Ban,
  RotateCcw,
} from "lucide-react";
import { recordsApi } from "../../api/client";
import { formatDateVN, getRecordStatusMeta } from "../../utils/format";
import { CertificateStudioModal } from "../../components/certificate/CertificateStudioModal";
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

export const AdminRecordsPage = () => {
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [counts, setCounts] = useState({ all: 0, active: 0, expiring: 0, expired: 0, rejected: 0 });
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [studioRecord, setStudioRecord] = useState(null);

  // Issue new modal
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    serialNumber: "",
    productName: "",
    category: "Laptop/Máy tính",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    periodMonths: 24,
    activationChannel: "ADMIN",
  });

  // Edit record modal
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    productName: "",
    category: "Laptop/Máy tính",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    packageName: "",
    notes: "",
  });

  // Revoke modal
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [voidReason, setVoidReason] = useState("");

  // Batch check modal
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchInput, setBatchInput] = useState("DLXPS-99281-VN\nMACM3P-77410-VN\nSN-CHUA-KICH-HOAT");
  const [batchResults, setBatchResults] = useState([]);

  const loadRecords = async () => {
    try {
      const res = await recordsApi.list({ status });
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
    setSubmitting(true);
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
        customerEmail: "",
        customerAddress: "",
        periodMonths: 24,
        activationChannel: "ADMIN",
      });
      loadRecords();
      setStudioRecord(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (rec) => {
    setEditTarget(rec);
    setEditForm({
      productName: rec.productName || "",
      category: rec.category || "Laptop/Máy tính",
      customerName: rec.customerName || "",
      customerPhone: rec.customerPhone || "",
      customerEmail: rec.customerEmail || "",
      customerAddress: rec.customerAddress || "",
      packageName: rec.packageName || "",
      notes: rec.notes || "",
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const res = await recordsApi.update(editTarget._id, editForm);
      toast.success(res.message);
      setEditTarget(null);
      loadRecords();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (e) => {
    e.preventDefault();
    if (!revokeTarget) return;
    try {
      await recordsApi.update(revokeTarget._id, {
        statusOverride: "rejected",
        voidReason: voidReason.trim() || "Vi phạm điều khoản bảo hành chính hãng.",
      });
      toast.info(`Đã thu hồi hiệu lực chứng nhận ${revokeTarget.wbCode}.`);
      setRevokeTarget(null);
      setVoidReason("");
      loadRecords();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReinstate = async (rec) => {
    try {
      await recordsApi.update(rec._id, { statusOverride: "", voidReason: "" });
      toast.success(`Đã khôi phục hiệu lực chứng nhận ${rec.wbCode}!`);
      loadRecords();
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
    if (!window.confirm("Bạn có chắc chắn muốn xóa chứng nhận bảo hành này không?")) return;
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
            Cấp mới chứng từ số, gia hạn thời hạn bảo vệ, thu hồi/khôi phục hiệu lực và kiểm tra lô Serial.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setBatchOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#0A0A0A]" />
            <span>Batch Check Serial</span>
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
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
            { id: "all", label: `Tất cả (${counts.all || 0})` },
            { id: "active", label: `Còn hạn (${counts.active || 0})` },
            { id: "expiring", label: `Sắp hết hạn (${counts.expiring || 0})` },
            { id: "expired", label: `Đã hết hạn (${counts.expired || 0})` },
            { id: "rejected", label: `Đã thu hồi (${counts.rejected || 0})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setStatus(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                status === t.id ? "bg-[#F4F5F7] text-[#0A0A0A]" : "text-slate-600 hover:bg-slate-50"
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
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-[#0A0A0A]"
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
                const isRejected = rec.computedStatus === "rejected";
                return (
                  <tr key={rec._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#0A0A0A]">{rec.wbCode}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 max-w-[240px] truncate">
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
                      {isRejected && rec.voidReason && (
                        <div className="text-[10px] text-rose-500 mt-1 max-w-[160px] truncate" title={rec.voidReason}>
                          {rec.voidReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setStudioRecord(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-neutral-400 text-slate-700 hover:text-[#0A0A0A] font-semibold cursor-pointer"
                          title="Mở Studio Thẻ QR"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR</span>
                        </button>
                        {!isRejected ? (
                          <button
                            type="button"
                            onClick={() => handleRenew(rec._id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 font-semibold cursor-pointer"
                            title="Gia hạn thêm 12 tháng"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>+12T</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReinstate(rec)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold cursor-pointer"
                            title="Khôi phục hiệu lực chứng nhận"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Khôi phục</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditModal(rec)}
                          className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-[#0A0A0A] hover:border-neutral-400 cursor-pointer"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {!isRejected && (
                          <button
                            type="button"
                            onClick={() => {
                              setRevokeTarget(rec);
                              setVoidReason("");
                            }}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                            title="Thu hồi / Vô hiệu hóa chứng nhận"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    Không có chứng nhận bảo hành nào trong mục này.
                  </td>
                </tr>
              )}
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
                minLength={3}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên thiết bị *</label>
              <input
                required
                minLength={2}
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                placeholder="Dell Precision 5680 Workstation"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Danh mục</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              >
                {CATEGORY_LIST.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ</label>
              <input
                value={form.customerAddress}
                onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#0A0A0A] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              {submitting ? "Đang cấp..." : "Cấp chứng nhận"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Certificate Modal */}
      <Modal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Chỉnh sửa Chứng nhận Bảo hành"
        subtitle={editTarget ? `${editTarget.wbCode} · SN: ${editTarget.serialNumber}` : ""}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên thiết bị *</label>
              <input
                required
                value={editForm.productName}
                onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Danh mục</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              >
                {CATEGORY_LIST.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chủ sở hữu *</label>
              <input
                required
                value={editForm.customerName}
                onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
              <input
                value={editForm.customerPhone}
                onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ trên giấy bảo hành</label>
            <input
              value={editForm.customerAddress}
              onChange={(e) => setEditForm({ ...editForm, customerAddress: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú lưu trữ</label>
            <textarea
              rows={2}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditTarget(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#0A0A0A] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Revoke Certificate Modal */}
      <Modal
        open={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        title="Thu hồi Hiệu lực Chứng nhận"
        subtitle={revokeTarget ? `${revokeTarget.wbCode} · ${revokeTarget.productName}` : ""}
      >
        <form onSubmit={handleRevoke} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Chứng nhận bị thu hồi sẽ hiển thị cảnh báo vô hiệu hóa khi tra cứu công khai và không thể gia hạn cho tới khi được quản trị viên khôi phục.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Lý do thu hồi *</label>
            <textarea
              required
              rows={2}
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="VD: Thiết bị bị ngấm chất lỏng hoặc rách tem niêm phong hãng"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRevokeTarget(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
            >
              Xác nhận thu hồi
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
            className="w-full p-3.5 rounded-2xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-[#0A0A0A]"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#0A0A0A] text-white text-xs font-semibold cursor-pointer"
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
                      <td className="px-4 py-2.5 font-mono text-[#0A0A0A]">{r.wbCode}</td>
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
