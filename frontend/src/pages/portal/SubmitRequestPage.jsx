import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Send,
  Sparkles,
  MapPin,
  Paperclip,
  Laptop,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { analyticsApi, recordsApi, ticketsApi } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const ISSUE_TAGS = [
  "Màn hình chập chờn / sọc",
  "Không nhận sạc / sụt pin",
  "Nóng máy bất thường",
  "Cổng kết nối USB-C / HDMI",
  "Bàn phím / Trackpad",
  "Kiểm tra định kỳ",
];

export const SubmitRequestPage = () => {
  const [searchParams] = useSearchParams();
  const prefillSerial = searchParams.get("serial") || "";
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiMatch, setAiMatch] = useState(null);

  const [form, setForm] = useState({
    productSerial: prefillSerial || "DLXPS-99281-VN",
    productName: "Dell XPS 15 9530 OLED (Core i7 / 32GB / 1TB)",
    category: "Laptop/Máy tính",
    customerName: user?.fullname || "Trần Anh Tuấn",
    customerPhone: user?.phone || "0912.345.891",
    customerEmail: user?.email || "tuan.tran@gmail.com",
    customerAddress: "Số 45 Trần Thái Tông, Cầu Giấy, Hà Nội",
    issueCategories: ["Màn hình chập chờn / sọc"],
    issueDescription: "",
    pickupMode: "center",
    preferredTime: "Trong giờ hành chính (08:30 - 17:30)",
    borrowLaptop: false,
    priority: "standard_48h",
    attachmentName: "",
  });

  useEffect(() => {
    recordsApi.list({ status: "all" }).then((res) => {
      const list = res.data || [];
      setDevices(list);
      const found = prefillSerial
        ? list.find((d) => d.serialNumber.toUpperCase() === prefillSerial.toUpperCase())
        : list[0];
      if (found) {
        setForm((prev) => ({
          ...prev,
          productSerial: found.serialNumber,
          productName: found.productName,
          category: found.category || "Laptop/Máy tính",
          customerName: user?.fullname || found.customerName || prev.customerName,
          customerPhone: user?.phone || found.customerPhone || prev.customerPhone,
          customerAddress: found.customerAddress || prev.customerAddress,
        }));
      }
    });
  }, [prefillSerial]);

  // Auto-run AI dispatch preview whenever address or category changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!form.customerAddress.trim()) return;
      analyticsApi
        .suggestBranch({
          address: form.customerAddress,
          category: form.category,
          issueDescription: form.issueDescription || "Tiếp nhận bảo hành",
        })
        .then((res) => setAiMatch(res.data))
        .catch(() => null);
    }, 350);
    return () => clearTimeout(timer);
  }, [form.customerAddress, form.category, form.issueDescription]);

  const toggleTag = (tag) => {
    setForm((prev) => {
      const exists = prev.issueCategories.includes(tag);
      return {
        ...prev,
        issueCategories: exists
          ? prev.issueCategories.filter((t) => t !== tag)
          : [...prev.issueCategories, tag],
      };
    });
  };

  const handleSelectSavedDevice = (serial) => {
    const d = devices.find((x) => x.serialNumber === serial);
    if (!d) return;
    setForm((prev) => ({
      ...prev,
      productSerial: d.serialNumber,
      productName: d.productName,
      category: d.category || "Laptop/Máy tính",
      customerName: d.customerName || prev.customerName,
      customerPhone: d.customerPhone || prev.customerPhone,
      customerAddress: d.customerAddress || prev.customerAddress,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.issueDescription.trim()) {
      toast.error("Vui lòng mô tả chi tiết triệu chứng kỹ thuật.");
      return;
    }
    setSubmitting(true);
    try {
      const attachments = form.attachmentName.trim()
        ? [{ filename: form.attachmentName.trim(), fileType: "document", sizeLabel: "Đính kèm điện tử" }]
        : [];
      const res = await ticketsApi.create({
        ...form,
        attachments,
      });
      toast.success(res.message);
      navigate(`/track?ticket=${encodeURIComponent(res.data.warrantyCode)}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
          <Sparkles className="w-4 h-4" />
          <span>Khởi Tạo Hồ Sơ RMA &amp; Điều Phối Trạm Tự Động</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Gửi yêu cầu bảo hành trực tuyến
        </h1>
        <p className="text-sm text-slate-500">
          Điền thông tin thiết bị và địa chỉ — hệ thống AI sẽ tự động phân luồng về trạm kỹ thuật gần nhất.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="lg:col-span-7 rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-[0_2px_10px_rgba(15,23,42,0.02)]"
        >
          {/* Quick select from vault */}
          {devices.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Chọn nhanh từ Sổ chứng nhận đã kích hoạt
              </label>
              <div className="flex flex-wrap gap-2">
                {devices.slice(0, 4).map((d) => (
                  <button
                    key={d._id}
                    type="button"
                    onClick={() => handleSelectSavedDevice(d.serialNumber)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      form.productSerial === d.serialNumber
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                    }`}
                  >
                    <span className="font-mono">{d.serialNumber}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Device Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số Serial / IMEI *
              </label>
              <input
                required
                value={form.productSerial}
                onChange={(e) => setForm({ ...form, productSerial: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nhóm thiết bị
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
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
              Tên thiết bị *
            </label>
            <input
              required
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Issue Tags & Description */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">
              Nhóm triệu chứng gặp phải
            </label>
            <div className="flex flex-wrap gap-2">
              {ISSUE_TAGS.map((tag) => {
                const active = form.issueCategories.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      active
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mô tả chi tiết tình trạng lỗi *
              </label>
              <textarea
                rows={3}
                required
                value={form.issueDescription}
                onChange={(e) => setForm({ ...form, issueDescription: e.target.value })}
                placeholder="Mô tả biểu hiện lỗi, tần suất xuất hiện để kỹ thuật viên chuẩn bị sẵn linh kiện..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tài liệu / Ảnh hiện trạng đính kèm (tùy chọn)
              </label>
              <div className="relative">
                <Paperclip className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  value={form.attachmentName}
                  onChange={(e) => setForm({ ...form, attachmentName: e.target.value })}
                  placeholder="VD: anh-man-hinh-loi.jpg hoặc hoa-don-vat.pdf"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Contact & Address */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ tên liên hệ *
                </label>
                <input
                  required
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại *
                </label>
                <input
                  required
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Địa chỉ nhận / gửi thiết bị (AI tự động định tuyến trạm)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  value={form.customerAddress}
                  onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hình thức bàn giao
                </label>
                <select
                  value={form.pickupMode}
                  onChange={(e) => setForm({ ...form, pickupMode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="center">Mang trực tiếp tới Trạm ủy quyền</option>
                  <option value="onsite">Thu nhận tận nơi (Courier VIP)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mức ưu tiên SLA
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="standard_48h">Tiêu chuẩn 48 giờ</option>
                  <option value="urgent_24h">Khẩn cấp VIP 24 giờ</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-xs font-medium text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.borrowLaptop}
                onChange={(e) => setForm({ ...form, borrowLaptop: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Laptop className="w-4 h-4 text-slate-400" />
              <span>Đăng ký mượn thiết bị làm việc tạm thời nếu thời gian xử lý trên 24h</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? "Đang khởi tạo hồ sơ..." : "Xác nhận gửi & Tạo phiếu RMA"}</span>
          </button>
        </motion.form>

        {/* Right Column: Live AI Dispatch Preview */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 space-y-5 shadow-[0_2px_10px_rgba(15,23,42,0.02)]">
            <div className="flex items-center gap-3">
              <img
                src="/assets/ai-routing.jpg"
                alt="AI Station Routing"
                className="w-16 h-16 rounded-2xl object-cover border border-slate-100"
              />
              <div>
                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  AI Station Matcher
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Trạm tiếp nhận đề xuất tự động
                </h3>
                <p className="text-xs text-slate-500">Cập nhật tức thì theo địa chỉ của bạn</p>
              </div>
            </div>

            {aiMatch?.matched && aiMatch.primary ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      {aiMatch.primary.name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white border border-indigo-200 text-indigo-700 text-[11px] font-bold">
                      {aiMatch.confidence}% phù hợp
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{aiMatch.primary.address}</p>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Khoảng cách</div>
                      <div className="font-bold text-slate-800 mt-0.5">{aiMatch.primary.distanceText}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Công suất trạm</div>
                      <div className="font-bold text-emerald-700 mt-0.5">
                        {aiMatch.primary.loadPercent}% ({aiMatch.primary.loadLabel})
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Kỹ thuật viên dự kiến tiếp nhận
                  </div>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">
                      {aiMatch.primary.recommendedTech?.name}
                    </span>{" "}
                    ({aiMatch.primary.recommendedTech?.level}) — {aiMatch.primary.recommendedTech?.teamName}
                  </p>
                  <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                    {aiMatch.primary.reason}
                  </p>
                </div>

                {aiMatch.alternatives?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Trạm dự phòng lân cận
                    </div>
                    {aiMatch.alternatives.map((alt) => (
                      <div
                        key={alt.code}
                        className="flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50/50"
                      >
                        <span className="font-medium text-slate-700">{alt.name}</span>
                        <span className="text-slate-400">Tải {alt.loadPercent}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Nhập địa chỉ để xem gợi ý trạm bảo hành.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
