import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit3,
  Lock,
  Unlock,
  QrCode,
  RefreshCw,
  Wrench,
  Send,
  Phone,
  Mail,
  MapPin,
  FileBadge,
  MessageSquarePlus,
  History,
  Headphones,
} from "lucide-react";
import { customersApi, recordsApi } from "../../api/client";
import {
  formatCurrencyVN,
  formatDateTimeVN,
  formatDateVN,
  getRecordStatusMeta,
  getTicketStatusMeta,
} from "../../utils/format";
import { CertificateStudioModal } from "../../components/certificate/CertificateStudioModal";
import { Modal } from "../../components/common/Modal";
import { useToast } from "../../context/ToastContext";

export const AdminCustomerDetailPage = () => {
  const { id } = useParams();
  const toast = useToast();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studioRecord, setStudioRecord] = useState(null);
  const [noteInput, setNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    customerType: "canhan",
    rank: "Standard",
    city: "",
    address: "",
  });

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await customersApi.detail(id);
      const d = res.data;
      setCustomer(d);
      setEditForm({
        fullName: d.fullName || "",
        phone: d.phone || "",
        email: d.email || "",
        customerType: d.customerType || "canhan",
        rank: d.rank || "Standard",
        city: d.city || "",
        address: d.address || "",
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await customersApi.update(customer._id, editForm);
      setCustomer(res.data);
      setEditOpen(false);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleLock = async () => {
    try {
      const res = await customersApi.toggleLock(customer._id);
      setCustomer(res.data);
      toast.info(res.message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    setSavingNote(true);
    try {
      const res = await customersApi.addNote(customer._id, { content: noteInput });
      setCustomer(res.data);
      setNoteInput("");
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingNote(false);
    }
  };

  const handleRenewDevice = async (recordId) => {
    try {
      const res = await recordsApi.renew(recordId, { months: 12 });
      toast.success(res.message);
      loadDetail();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center text-sm text-slate-400">
        Đang tải hồ sơ khách hàng...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center space-y-3">
        <div className="text-sm font-bold text-slate-800">Không tìm thấy hồ sơ khách hàng</div>
        <Link to="/admin/customers" className="text-xs font-semibold text-[#0A0A0A] hover:underline">
          ← Quay lại danh sách khách hàng
        </Link>
      </div>
    );
  }

  const isLocked = customer.status === "locked";

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#0A0A0A]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Danh sách Khách hàng</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#0A0A0A]" />
            <span>Chỉnh sửa hồ sơ</span>
          </button>
          <button
            type="button"
            onClick={handleToggleLock}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
              isLocked
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
            }`}
          >
            {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isLocked ? "Mở khóa hồ sơ" : "Tạm khóa"}</span>
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-[0_1px_6px_rgba(15,23,42,0.02)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#F4F5F7] text-[#0A0A0A]">
                {customer.customerCode}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/70">
                Hạng {customer.rank || "Standard"}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  isLocked ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isLocked ? "bg-rose-500" : "bg-emerald-500"}`} />
                {isLocked ? "Đã tạm khóa" : "Đang hoạt động"}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900">{customer.fullName}</h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-800">{customer.phone}</strong>
              </span>
              {customer.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.email}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.address || customer.city || "Chưa cập nhật"}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-xl font-extrabold text-slate-900 tabular-nums">
                {(customer.devices || []).length}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Chứng nhận BH</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-xl font-extrabold text-[#0A0A0A] tabular-nums">
                {(customer.tickets || []).length}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Phiếu RMA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Col CRM Body */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Owned Devices & Ticket History */}
        <div className="xl:col-span-8 space-y-6">
          {/* Devices */}
          <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileBadge className="w-4 h-4 text-[#0A0A0A]" />
                <h2 className="text-sm font-bold text-slate-900">
                  Thiết bị &amp; Chứng nhận Bảo hành ({(customer.devices || []).length})
                </h2>
              </div>
              <Link to="/admin/records" className="text-xs font-semibold text-[#0A0A0A] hover:underline">
                Kho chứng nhận →
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {(customer.devices || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Khách hàng chưa có chứng nhận bảo hành nào được gán.
                </div>
              ) : (
                (customer.devices || []).map((rec) => {
                  const meta = getRecordStatusMeta(rec.computedStatus, rec.daysRemaining);
                  return (
                    <div key={rec._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#0A0A0A]">{rec.wbCode}</span>
                          <span className="font-mono text-[11px] text-slate-400">SN: {rec.serialNumber}</span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${meta.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                            {meta.label}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-slate-900">{rec.productName}</div>
                        <div className="text-xs text-slate-500">
                          {rec.packageName} · Hiệu lực {formatDateVN(rec.purchaseDate)} → {formatDateVN(rec.endDate)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setStudioRecord(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:border-neutral-400 hover:text-[#0A0A0A] cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRenewDevice(rec._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>+12T</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RMA Ticket History */}
          <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#0A0A0A]" />
                <h2 className="text-sm font-bold text-slate-900">
                  Lịch sử Phiếu Yêu cầu &amp; Sửa chữa ({(customer.tickets || []).length})
                </h2>
              </div>
              <Link to="/admin/tickets" className="text-xs font-semibold text-[#0A0A0A] hover:underline">
                Bàn điều phối →
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {(customer.tickets || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Chưa phát sinh yêu cầu bảo hành nào cho khách hàng này.
                </div>
              ) : (
                (customer.tickets || []).map((t) => {
                  const st = getTicketStatusMeta(t.status);
                  return (
                    <div key={t._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/admin/tickets?ticket=${encodeURIComponent(t.warrantyCode)}`}
                            className="font-mono text-xs font-bold text-[#0A0A0A] hover:underline"
                          >
                            #{t.warrantyCode}
                          </Link>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${st.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dotClass}`} />
                            {t.status}
                          </span>
                          <span className="text-[11px] text-slate-400">{formatDateVN(t.receivedDate)}</span>
                        </div>
                        <div className="text-sm font-bold text-slate-900">{t.productName}</div>
                        <p className="text-xs text-slate-500 line-clamp-1">{t.issueDescription}</p>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <div className="text-xs font-bold text-slate-800">{formatCurrencyVN(t.repairCost)}</div>
                        <div className="text-[11px] text-slate-400">{t.assignedBranch?.name || "—"}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Specialist, Notes, Audit Logs */}
        <div className="xl:col-span-4 space-y-6">
          {/* Specialist */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Headphones className="w-4 h-4 text-[#0A0A0A]" />
              <span>Chuyên viên phụ trách</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-sm font-bold text-slate-900">
                {customer.assignedSpecialist?.name || "Nguyễn Hoàng Long"}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Ext: {customer.assignedSpecialist?.ext || "104"} · {customer.assignedSpecialist?.phone || "0909.104.888"}
              </div>
            </div>
          </div>

          {/* CSKH Internal Notes */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <MessageSquarePlus className="w-4 h-4 text-[#0A0A0A]" />
              <span>Ghi chú Nội bộ CSKH</span>
            </div>

            <form onSubmit={handleAddNote} className="space-y-2.5">
              <textarea
                rows={2}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Thêm lưu ý chăm sóc, yêu cầu đặc biệt của khách..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0A0A0A]"
              />
              <button
                type="submit"
                disabled={savingNote}
                className="w-full py-2 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{savingNote ? "Đang lưu..." : "Lưu ghi chú CSKH"}</span>
              </button>
            </form>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {(customer.notes || []).length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">Chưa có ghi chú nội bộ.</div>
              ) : (
                (customer.notes || []).map((n, idx) => (
                  <div key={n._id || idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">{n.authorName}</span>
                      <span className="text-slate-400">{formatDateTimeVN(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit Trail */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <History className="w-4 h-4 text-[#0A0A0A]" />
              <span>Nhật ký Hệ thống (Audit)</span>
            </div>
            <div className="space-y-3">
              {(customer.auditLogs || []).slice(0, 6).map((log, idx) => (
                <div key={log._id || idx} className="pl-3.5 border-l-2 border-neutral-300 space-y-0.5">
                  <div className="text-xs font-semibold text-slate-800">{log.action}</div>
                  {log.description && <div className="text-[11px] text-slate-500">{log.description}</div>}
                  <div className="text-[10px] text-slate-400">
                    {log.actor} · {formatDateTimeVN(log.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Studio QR Modal */}
      <CertificateStudioModal
        open={Boolean(studioRecord)}
        onClose={() => setStudioRecord(null)}
        record={studioRecord}
      />

      {/* Edit Profile Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Chỉnh sửa Hồ sơ Khách hàng"
        subtitle={`Cập nhật thông tin định danh ${customer.customerCode}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên *</label>
              <input
                required
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại *</label>
              <input
                required
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phân loại</label>
              <select
                value={editForm.customerType}
                onChange={(e) => setEditForm({ ...editForm, customerType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              >
                <option value="canhan">Cá nhân</option>
                <option value="vip">VIP • Doanh nghiệp</option>
                <option value="daily">Đại lý ủy quyền</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hạng thành viên</label>
              <input
                value={editForm.rank}
                onChange={(e) => setEditForm({ ...editForm, rank: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tỉnh / Thành phố</label>
              <input
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ đầy đủ</label>
            <input
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0A0A0A] text-white text-xs font-semibold cursor-pointer"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
