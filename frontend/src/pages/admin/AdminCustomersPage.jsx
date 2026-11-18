import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Download,
  Lock,
  Unlock,
  ArrowUpRight,
  Users,
  Building2,
  Award,
  MapPin,
} from "lucide-react";
import { analyticsApi, customersApi } from "../../api/client";
import { formatDateVN } from "../../utils/format";
import { Modal } from "../../components/common/Modal";
import { useToast } from "../../context/ToastContext";

const TYPE_META = {
  vip: {
    label: "VIP • Doanh nghiệp",
    badgeClass: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/80",
  },
  daily: {
    label: "Đại lý ủy quyền",
    badgeClass: "bg-[#F4F5F7] text-[#0A0A0A] ring-1 ring-inset ring-neutral-300/80",
  },
  canhan: {
    label: "Cá nhân",
    badgeClass: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
  },
};

export const AdminCustomersPage = () => {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("all");
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    customerType: "canhan",
    idNumber: "",
    city: "Hà Nội",
    address: "",
  });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await customersApi.list({ category, city, q });
      setCustomers(res.data || []);
      setTotal(res.total ?? (res.data || []).length);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [category, city]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await customersApi.create(form);
      toast.success(res.message);
      setCreateOpen(false);
      setForm({
        fullName: "",
        phone: "",
        email: "",
        customerType: "canhan",
        idNumber: "",
        city: "Hà Nội",
        address: "",
      });
      loadCustomers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLock = async (customer) => {
    try {
      const res = await customersApi.toggleLock(customer._id);
      toast.info(res.message);
      loadCustomers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const visibleCustomers = customers.filter((c) => {
    if (!q.trim()) return true;
    const kw = q.trim().toLowerCase();
    return (
      (c.fullName || "").toLowerCase().includes(kw) ||
      (c.customerCode || "").toLowerCase().includes(kw) ||
      (c.phone || "").toLowerCase().includes(kw) ||
      (c.email || "").toLowerCase().includes(kw) ||
      (c.idNumber || "").toLowerCase().includes(kw)
    );
  });

  const vipCount = customers.filter((c) => c.customerType === "vip").length;
  const dealerCount = customers.filter((c) => c.customerType === "daily").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Hồ sơ Khách hàng (CRM)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản lý định danh khách hàng, phân hạng VIP/Đại lý, danh mục thiết bị sở hữu và nhật ký CSKH.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <a
            href={analyticsApi.exportUrl("customers")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Xuất CSV</span>
          </a>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm khách hàng</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Tổng hồ sơ khách hàng</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{total}</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#F4F5F7] text-[#0A0A0A] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Khách VIP (Đang hiển thị)</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-1 tabular-nums">{vipCount}</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Đại lý / Đối tác B2B</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{dealerCount}</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "Tất cả" },
            { id: "vip", label: "VIP • Doanh nghiệp" },
            { id: "canhan", label: "Cá nhân" },
            { id: "daily", label: "Đại lý ủy quyền" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategory(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                category === tab.id
                  ? "bg-[#F4F5F7] text-[#0A0A0A]"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:border-[#0A0A0A]"
          >
            <option value="">Tất cả khu vực</option>
            <option value="Hà Nội">Hà Nội</option>
            <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
            <option value="Đà Nẵng">Đà Nẵng</option>
          </select>

          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm tên, mã KH, SĐT, CCCD..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-[0_1px_6px_rgba(15,23,42,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Mã KH</th>
                <th className="px-6 py-4">Khách hàng &amp; Liên hệ</th>
                <th className="px-6 py-4">Phân hạng</th>
                <th className="px-6 py-4">Địa chỉ</th>
                <th className="px-6 py-4">Tài sản / RMA</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    Đang tải danh sách khách hàng...
                  </td>
                </tr>
              ) : visibleCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    Không tìm thấy khách hàng phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                visibleCustomers.map((c) => {
                  const typeMeta = TYPE_META[c.customerType] || TYPE_META.canhan;
                  const isLocked = c.status === "locked";
                  return (
                    <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          to={`/admin/customers/${encodeURIComponent(c.customerCode || c._id)}`}
                          className="font-mono font-bold text-[#0A0A0A] hover:underline"
                        >
                          {c.customerCode}
                        </Link>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateVN(c.joinedAt || c.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/admin/customers/${encodeURIComponent(c.customerCode || c._id)}`}
                          className="font-bold text-slate-900 hover:text-[#0A0A0A] transition-colors"
                        >
                          {c.fullName}
                        </Link>
                        <div className="text-slate-500 mt-0.5">
                          {c.phone} {c.email ? `· ${c.email}` : ""}
                        </div>
                        {c.idNumber && (
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                            Định danh: {c.idNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${typeMeta.badgeClass}`}>
                          {typeMeta.label}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">Hạng: {c.rank || "Standard"}</div>
                      </td>
                      <td className="px-6 py-4 max-w-[240px]">
                        <div className="font-medium text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{c.city || "—"}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {c.address || "Chưa cập nhật địa chỉ"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{c.deviceCount ?? 0} thiết bị</div>
                        <div className="text-[11px] text-slate-500">{c.warrantyClaimCount ?? 0} phiếu BH</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            isLocked
                              ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200"
                              : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isLocked ? "bg-rose-500" : "bg-emerald-500"}`} />
                          {isLocked ? "Tạm khóa" : "Hoạt động"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/customers/${encodeURIComponent(c.customerCode || c._id)}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-neutral-400 text-slate-700 hover:text-[#0A0A0A] font-semibold"
                          >
                            <span>Hồ sơ</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleToggleLock(c)}
                            title={isLocked ? "Mở khóa hồ sơ" : "Tạm khóa hồ sơ"}
                            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
                          >
                            {isLocked ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Customer Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Thêm Hồ sơ Khách hàng Mới"
        subtitle="Lưu trữ định danh khách hàng đồng bộ với hệ thống chứng từ bảo hành"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên / Doanh nghiệp *</label>
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Nguyễn Minh Khang"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại *</label>
              <input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0912.345.678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="khang.nguyen@email.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phân loại</label>
              <select
                value={form.customerType}
                onChange={(e) => setForm({ ...form, customerType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
              >
                <option value="canhan">Cá nhân</option>
                <option value="vip">VIP • Doanh nghiệp</option>
                <option value="daily">Đại lý ủy quyền</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">CCCD / Mã số thuế</label>
              <input
                value={form.idNumber}
                onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                placeholder="001095012345"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tỉnh / Thành phố</label>
              <select
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
              >
                <option value="Hà Nội">Hà Nội</option>
                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Hải Phòng">Hải Phòng</option>
                <option value="Cần Thơ">Cần Thơ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ chi tiết</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Số nhà, đường, quận/huyện..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-semibold cursor-pointer"
            >
              {submitting ? "Đang lưu..." : "Lưu khách hàng"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
