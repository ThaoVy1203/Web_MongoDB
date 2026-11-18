import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Download,
  Edit3,
  Trash2,
  Package,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { analyticsApi, productsApi } from "../../api/client";
import { formatPriceNumber } from "../../utils/format";
import { Modal } from "../../components/common/Modal";
import { useToast } from "../../context/ToastContext";

const CATEGORY_OPTIONS = [
  { id: "all", label: "Tất cả" },
  { id: "laptop", label: "Laptop/Máy tính" },
  { id: "phone", label: "Điện thoại" },
  { id: "monitor", label: "Màn hình" },
  { id: "audio", label: "Âm thanh" },
  { id: "component", label: "Linh kiện" },
];

const STATUS_META = {
  selling: {
    label: "Đang kinh doanh",
    badgeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    dotClass: "bg-emerald-500",
  },
  coming: {
    label: "Sắp ra mắt",
    badgeClass: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
    dotClass: "bg-sky-500",
  },
  stop: {
    label: "Ngừng phân phối",
    badgeClass: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
    dotClass: "bg-slate-400",
  },
};

const EMPTY_FORM = {
  sku: "",
  name: "",
  category: "laptop",
  warrantyMonths: 24,
  price: 0,
  businessStatus: "selling",
  serialSample: "",
  warrantyPolicyName: "",
  specs: "",
  commonFaultPart: "",
  imageUrl: "",
};

export const AdminProductsPage = () => {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productsApi.list({ category, status, q });
      setProducts(res.data || []);
      setTotal(res.total ?? (res.data || []).length);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [category, status]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingId(p._id);
    setForm({
      sku: p.sku || "",
      name: p.name || "",
      category: p.category || "laptop",
      warrantyMonths: p.warrantyMonths || 12,
      price: p.price || 0,
      businessStatus: p.businessStatus || "selling",
      serialSample: p.serialSample || "",
      warrantyPolicyName: p.warrantyPolicyName || "",
      specs: p.specs || "",
      commonFaultPart: p.commonFaultPart || "",
      imageUrl: p.imageUrl || "",
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        warrantyMonths: Number(form.warrantyMonths) || 12,
        price: Number(form.price) || 0,
      };
      if (editingId) {
        const res = await productsApi.update(editingId, payload);
        toast.success(res.message);
      } else {
        const res = await productsApi.create(payload);
        toast.success(res.message);
      }
      setModalOpen(false);
      loadProducts();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Xóa dòng sản phẩm [${p.sku}] ${p.name} khỏi danh mục?`)) return;
    try {
      const res = await productsApi.remove(p._id);
      toast.info(res.message);
      loadProducts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const visibleProducts = products.filter((p) => {
    if (!q.trim()) return true;
    const kw = q.trim().toLowerCase();
    return (
      (p.sku || "").toLowerCase().includes(kw) ||
      (p.name || "").toLowerCase().includes(kw) ||
      (p.specs || "").toLowerCase().includes(kw) ||
      (p.serialSample || "").toLowerCase().includes(kw)
    );
  });

  const highDefectCount = products.filter((p) => p.defectRate >= 3).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Danh mục Thiết bị &amp; Mã SKU
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Chuẩn hóa cấu hình sản phẩm, chính sách thời hạn bảo hành hãng và theo dõi tỷ lệ lỗi theo từng dòng máy.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <a
            href={analyticsApi.exportUrl("products")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Xuất CSV</span>
          </a>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm dòng SKU</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Tổng dòng SKU quản lý</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{total}</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#F4F5F7] text-[#0A0A0A] flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Đang kích hoạt bán mới</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">
              {products.filter((p) => p.businessStatus === "selling").length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">SKU cần theo dõi tỷ lệ lỗi (≥ 3%)</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-1 tabular-nums">{highDefectCount}</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setCategory(opt.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                category === opt.id
                  ? "bg-[#F4F5F7] text-[#0A0A0A]"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:border-[#0A0A0A]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="selling">Đang kinh doanh</option>
            <option value="coming">Sắp ra mắt</option>
            <option value="stop">Ngừng phân phối</option>
          </select>

          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm mã SKU, tên sản phẩm, mẫu Serial..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-[0_1px_6px_rgba(15,23,42,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Mã SKU</th>
                <th className="px-6 py-4">Thiết bị &amp; Cấu hình</th>
                <th className="px-6 py-4">Bảo hành &amp; Serial</th>
                <th className="px-6 py-4">Giá niêm yết</th>
                <th className="px-6 py-4">Tỷ lệ lỗi / RMA</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    Đang tải danh mục thiết bị...
                  </td>
                </tr>
              ) : visibleProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    Không tìm thấy dòng sản phẩm phù hợp.
                  </td>
                </tr>
              ) : (
                visibleProducts.map((p) => {
                  const st = STATUS_META[p.businessStatus] || STATUS_META.selling;
                  const defectHigh = p.defectRate >= 3;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-[#0A0A0A]">{p.sku}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{p.subSku || p.lotCode}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                          />
                          <div className="min-w-0 max-w-[260px]">
                            <div className="font-bold text-slate-900 truncate">{p.name}</div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {p.specs || p.categoryLabel}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{p.warrantyMonths} tháng chính hãng</div>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                          {p.serialType || "SN"}: {p.serialSample || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 tabular-nums">
                        {formatPriceNumber(p.price)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                            defectHigh
                              ? "bg-rose-50 text-rose-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {p.defectRate}% ({p.claimCount ?? 0} phiếu)
                        </span>
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px] mt-0.5">
                          {p.commonFaultPart}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dotClass}`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-[#0A0A0A] hover:border-neutral-400 cursor-pointer"
                            title="Chỉnh sửa SKU"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Create / Edit SKU Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? `Cập nhật SKU ${form.sku}` : "Thêm Dòng Thiết bị & SKU Mới"}
        subtitle="Thiết lập chính sách bảo hành chuẩn hãng và cấu hình kỹ thuật"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã SKU *</label>
              <input
                required
                disabled={Boolean(editingId)}
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="LAP-THINKPAD-X1G12"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Danh mục</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              >
                <option value="laptop">Laptop/Máy tính</option>
                <option value="phone">Điện thoại</option>
                <option value="monitor">Màn hình</option>
                <option value="audio">Thiết bị âm thanh</option>
                <option value="component">Linh kiện / Phụ kiện</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên thiết bị *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Lenovo ThinkPad X1 Carbon Gen 12"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Thời hạn BH (tháng)</label>
              <select
                value={form.warrantyMonths}
                onChange={(e) => setForm({ ...form, warrantyMonths: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              >
                <option value={12}>12 tháng</option>
                <option value={24}>24 tháng</option>
                <option value={36}>36 tháng</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Giá niêm yết (VNĐ)</label>
              <input
                type="number"
                min={0}
                step={100000}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái</label>
              <select
                value={form.businessStatus}
                onChange={(e) => setForm({ ...form, businessStatus: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              >
                <option value="selling">Đang kinh doanh</option>
                <option value="coming">Sắp ra mắt</option>
                <option value="stop">Ngừng phân phối</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mẫu Serial / IMEI</label>
              <input
                value={form.serialSample}
                onChange={(e) => setForm({ ...form, serialSample: e.target.value })}
                placeholder="TPX1-2026-VN"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gói chính sách bảo hành</label>
              <input
                value={form.warrantyPolicyName}
                onChange={(e) => setForm({ ...form, warrantyPolicyName: e.target.value })}
                placeholder="Premier Support 24/7"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Thông số kỹ thuật tóm tắt</label>
            <input
              value={form.specs}
              onChange={(e) => setForm({ ...form, specs: e.target.value })}
              placeholder="Core Ultra 7 • 32GB LPDDR5X • 1TB NVMe • 14'' 2.8K OLED"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Linh kiện theo dõi lỗi</label>
              <input
                value={form.commonFaultPart}
                onChange={(e) => setForm({ ...form, commonFaultPart: e.target.value })}
                placeholder="Cáp màn hình / Pin / Cổng sạc"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">URL Ảnh minh họa</label>
              <input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-semibold cursor-pointer"
            >
              {submitting ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm vào danh mục"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
