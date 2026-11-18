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
  Phone,
  Navigation,
  LocateFixed,
  Map as MapIcon,
  X,
  UploadCloud,
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

export const SubmitRequestPage = () => {
  const [searchParams] = useSearchParams();
  const prefillSerial = searchParams.get("serial") || "";
  const prefillAddress = searchParams.get("address") || "";
  const prefillBranch = searchParams.get("branch") || "";
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiMatch, setAiMatch] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [form, setForm] = useState({
    productSerial: prefillSerial || "",
    productName: "",
    category: "Laptop/Máy tính",
    customerName: user?.fullname || "",
    customerPhone: user?.phone || "",
    customerEmail: user?.email || "",
    customerAddress: prefillAddress || "",
    issueCategories: ["Màn hình chập chờn / sọc"],
    issueDescription: "",
    pickupMode: "center",
    preferredTime: "Trong giờ hành chính (08:30 - 17:30)",
    customerDeliveryNotes: "",
    borrowLaptop: false,
    priority: "standard_48h",
    preferredBranchCode: prefillBranch || "",
  });

  // Sync user profile when AuthContext hydrates
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      customerName: prev.customerName || user.fullname || "",
      customerPhone: prev.customerPhone || user.phone || "",
      customerEmail: prev.customerEmail || user.email || "",
    }));
  }, [user]);

  useEffect(() => {
    recordsApi
      .list({ status: "all" })
      .then((res) => {
        const list = res.data || [];
        setDevices(list);
        const found = prefillSerial
          ? list.find((d) => d.serialNumber.toUpperCase() === prefillSerial.toUpperCase())
          : !prefillAddress
            ? list[0]
            : null;
        if (found) {
          setForm((prev) => ({
            ...prev,
            productSerial: found.serialNumber,
            productName: found.productName,
            category: found.category || "Laptop/Máy tính",
            customerName: prev.customerName || found.customerName || "",
            customerPhone: prev.customerPhone || found.customerPhone || "",
            customerEmail: prev.customerEmail || found.customerEmail || "",
            customerAddress: prefillAddress || prev.customerAddress || found.customerAddress || "",
          }));
        }
      })
      .catch(() => null);
  }, [prefillSerial, prefillAddress]);

  // Auto-run AI dispatch preview whenever address, category, or GPS changes
  useEffect(() => {
    if (!form.customerAddress.trim() && !userCoords) {
      setAiMatch(null);
      setAiLoading(false);
      return undefined;
    }
    setAiLoading(true);
    const timer = setTimeout(() => {
      analyticsApi
        .suggestBranch({
          address: form.customerAddress,
          category: form.category,
          issueDescription: form.issueDescription || "Tiếp nhận bảo hành",
          ...(userCoords ? { lat: userCoords.lat, lng: userCoords.lng } : {}),
        })
        .then((res) => setAiMatch(res.data))
        .catch(() => setAiMatch(null))
        .finally(() => setAiLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [form.customerAddress, form.category, form.issueDescription, userCoords]);

  const handleUseCurrentGps = () => {
    if (!("geolocation" in navigator)) {
      toast.warning("Trình duyệt hiện tại không hỗ trợ định vị GPS.");
      return;
    }
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        });
        setLocatingGps(false);
        toast.success("Đã lấy vị trí GPS hiện tại và tính khoảng cách tới các trung tâm!");
      },
      () => {
        setLocatingGps(false);
        toast.warning("Không thể lấy tọa độ GPS. Hãy kiểm tra quyền truy cập vị trí của trình duyệt.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

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
      customerEmail: d.customerEmail || prev.customerEmail,
      customerAddress: d.customerAddress || prev.customerAddress,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const mapped = files.slice(0, 5).map((f) => ({
      filename: f.name,
      fileType: f.type?.startsWith("image/") ? "image" : "document",
      sizeLabel: `${(f.size / (1024 * 1024) >= 1
        ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(f.size / 1024))} KB`)}`,
    }));
    setAttachedFiles((prev) => [...prev, ...mapped].slice(0, 5));
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.issueDescription.trim().length < 3) {
      toast.error("Vui lòng mô tả chi tiết triệu chứng kỹ thuật (tối thiểu 3 ký tự).");
      return;
    }
    setSubmitting(true);
    try {
      const res = await ticketsApi.create({
        ...form,
        attachments: attachedFiles,
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
      <div className="space-y-2">
        <div className="text-xs font-medium text-[#6E6E73]">Hỗ trợ kỹ thuật</div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1D1D1F] tracking-[-0.03em]">
          Gửi yêu cầu bảo hành
        </h1>
        <p className="text-sm text-[#6E6E73]">
          Điền thông tin thiết bị và địa chỉ hoặc bật định vị GPS — hệ thống tự động định tuyến về trạm gần nhất.
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
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600">
                Chọn nhanh từ Sổ chứng nhận đã kích hoạt ({devices.length} thiết bị)
              </label>
              <select
                value={devices.some((d) => d.serialNumber === form.productSerial) ? form.productSerial : ""}
                onChange={(e) => e.target.value && handleSelectSavedDevice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#0A0A0A]"
              >
                <option value="">— Chọn thiết bị đã lưu hoặc nhập thủ công bên dưới —</option>
                {devices.map((d) => (
                  <option key={d._id} value={d.serialNumber}>
                    [{d.serialNumber}] {d.productName} ({d.wbCode})
                  </option>
                ))}
              </select>
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
                minLength={3}
                value={form.productSerial}
                onChange={(e) => setForm({ ...form, productSerial: e.target.value })}
                placeholder="VD: DLXPS-99281-VN"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nhóm thiết bị
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
              >
                {CATEGORY_LIST.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên thiết bị *
            </label>
            <input
              required
              minLength={2}
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              placeholder="VD: Dell XPS 15 9530 OLED"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
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
                minLength={3}
                value={form.issueDescription}
                onChange={(e) => setForm({ ...form, issueDescription: e.target.value })}
                placeholder="Mô tả biểu hiện lỗi, tần suất xuất hiện để kỹ thuật viên chuẩn bị sẵn linh kiện..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>

            {/* Real File Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Đính kèm ảnh hiện trạng / hóa đơn (tối đa 5 tệp)
              </label>
              <label className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 hover:bg-[#F4F5F7] hover:border-neutral-400 text-xs font-semibold text-slate-600 cursor-pointer transition-colors">
                <UploadCloud className="w-4 h-4 text-[#0A0A0A]" />
                <span>Chọn ảnh hoặc PDF từ máy (JPG, PNG, PDF)</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {attachedFiles.map((f, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-xs text-slate-700"
                    >
                      <Paperclip className="w-3 h-3 text-neutral-700" />
                      <span className="max-w-[160px] truncate font-medium">{f.filename}</span>
                      <span className="text-[10px] text-slate-400">({f.sizeLabel})</span>
                      <button
                        type="button"
                        onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contact & Address */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ tên liên hệ *
                </label>
                <input
                  required
                  minLength={2}
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại *
                </label>
                <input
                  required
                  minLength={6}
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="0912.345.678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email nhận thông báo
                </label>
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  placeholder="email@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Địa chỉ nhận / gửi thiết bị (AI tự động định tuyến trạm)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleUseCurrentGps}
                    disabled={locatingGps}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F4F5F7] hover:bg-neutral-200/80 text-[#0A0A0A] text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <LocateFixed className={`w-3 h-3 ${locatingGps ? "animate-spin" : ""}`} />
                    <span>
                      {locatingGps
                        ? "Đang định vị..."
                        : userCoords
                          ? `GPS: ${userCoords.lat}, ${userCoords.lng}`
                          : "Dùng GPS hiện tại"}
                    </span>
                  </button>
                  {userCoords && (
                    <button
                      type="button"
                      onClick={() => setUserCoords(null)}
                      title="Xóa GPS"
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="relative">
                <MapPin className="w-4 h-4 text-neutral-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  value={form.customerAddress}
                  onChange={(e) =>
                    setForm({ ...form, customerAddress: e.target.value, preferredBranchCode: "" })
                  }
                  placeholder="VD: Số 45 Trần Thái Tông, Cầu Giấy, Hà Nội"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hình thức bàn giao
                </label>
                <select
                  value={form.pickupMode}
                  onChange={(e) => setForm({ ...form, pickupMode: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="center">Mang tới Trạm ủy quyền</option>
                  <option value="onsite">Thu nhận tận nơi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Khung giờ hẹn
                </label>
                <select
                  value={form.preferredTime}
                  onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                >
                  <option>Buổi sáng (08:30 - 11:30)</option>
                  <option>Buổi chiều (13:30 - 17:30)</option>
                  <option>Trong giờ hành chính (08:30 - 17:30)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mức ưu tiên SLA
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="standard_48h">Tiêu chuẩn 48 giờ</option>
                  <option value="urgent_24h">Khẩn cấp VIP 24 giờ</option>
                </select>
              </div>
            </div>

            {form.pickupMode === "onsite" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú cho nhân viên giao nhận (số tầng, giờ gọi trước...)
                </label>
                <input
                  value={form.customerDeliveryNotes}
                  onChange={(e) => setForm({ ...form, customerDeliveryNotes: e.target.value })}
                  placeholder="VD: Gọi trước 15 phút tại sảnh tòa nhà"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
            )}

            <label className="flex items-center gap-2.5 text-xs font-medium text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.borrowLaptop}
                onChange={(e) => setForm({ ...form, borrowLaptop: e.target.checked })}
                className="rounded border-slate-300 text-[#0A0A0A] focus:ring-black/15"
              />
              <Laptop className="w-4 h-4 text-slate-400" />
              <span>Đăng ký mượn thiết bị làm việc tạm thời nếu thời gian xử lý trên 24h</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="editorial-pill-btn w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-bold tracking-wide cursor-pointer disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? "Đang khởi tạo hồ sơ..." : "Xác nhận gửi & Tạo phiếu RMA"}</span>
          </button>
        </motion.form>

        {/* Right Column: Live AI Dispatch Preview */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
          <div className="rounded-[28px] bg-white border border-neutral-200/90 p-6 sm:p-7 space-y-5">
            <div className="space-y-1">
              <div className="text-xs font-medium text-[#6E6E73]">AI định tuyến</div>
              <h3 className="text-lg font-semibold text-[#1D1D1F]">
                Trạm tiếp nhận đề xuất
              </h3>
              <p className="text-xs text-[#6E6E73]">Cập nhật tức thì theo địa chỉ hoặc GPS của bạn</p>
            </div>

            {aiLoading ? (
              <div className="p-6 rounded-2xl bg-[#F4F5F7] text-center text-xs text-neutral-500 animate-pulse">
                AI đang phân tích địa chỉ &amp; tải trạm...
              </div>
            ) : aiMatch?.matched && aiMatch.primary ? (
              <div className="space-y-4">
                <div
                  onClick={() => setForm((p) => ({ ...p, preferredBranchCode: aiMatch.primary.code }))}
                  className={`p-5 rounded-[24px] border space-y-3 cursor-pointer transition-all ${
                    !form.preferredBranchCode || form.preferredBranchCode === aiMatch.primary.code
                      ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                      : "bg-[#F4F5F7] text-[#0A0A0A] border-neutral-200 hover:border-[#0A0A0A]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold">
                      <Building2 className="w-4 h-4 shrink-0" />
                      {aiMatch.primary.name}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                        !form.preferredBranchCode || form.preferredBranchCode === aiMatch.primary.code
                          ? "bg-white text-[#0A0A0A]"
                          : "bg-[#0A0A0A] text-white"
                      }`}
                    >
                      {aiMatch.confidence}% khớp
                    </span>
                  </div>
                  <p
                    className={`text-xs leading-relaxed ${
                      !form.preferredBranchCode || form.preferredBranchCode === aiMatch.primary.code
                        ? "text-neutral-300"
                        : "text-neutral-600"
                    }`}
                  >
                    {aiMatch.primary.address}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div
                      className={`p-2.5 rounded-xl ${
                        !form.preferredBranchCode || form.preferredBranchCode === aiMatch.primary.code
                          ? "bg-white/10"
                          : "bg-white border border-neutral-200"
                      }`}
                    >
                      <div className="text-[10px] opacity-60 uppercase font-semibold">Khoảng cách</div>
                      <div className="font-bold mt-0.5">
                        {aiMatch.primary.distanceText} · {aiMatch.primary.travelTimeText}
                      </div>
                    </div>
                    <div
                      className={`p-2.5 rounded-xl ${
                        !form.preferredBranchCode || form.preferredBranchCode === aiMatch.primary.code
                          ? "bg-white/10"
                          : "bg-white border border-neutral-200"
                      }`}
                    >
                      <div className="text-[10px] opacity-60 uppercase font-semibold">Công suất trạm</div>
                      <div className="font-bold mt-0.5">
                        {aiMatch.primary.loadPercent}% ({aiMatch.primary.loadLabel})
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px]">
                    <span className="inline-flex items-center gap-1 opacity-80">
                      <Phone className="w-3 h-3" />
                      {aiMatch.primary.phone}
                    </span>
                    <div className="flex items-center gap-3">
                      {aiMatch.primary.embedMapUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMap((v) => !v);
                          }}
                          className="inline-flex items-center gap-1 opacity-80 hover:opacity-100 font-semibold cursor-pointer"
                        >
                          <MapIcon className="w-3 h-3" />
                          <span>{showMap ? "Ẩn bản đồ" : "Xem bản đồ"}</span>
                        </button>
                      )}
                      <a
                        href={
                          aiMatch.primary.directionsUrl ||
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(aiMatch.primary.address)}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-bold underline"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Chỉ đường Maps</span>
                      </a>
                    </div>
                  </div>
                  {showMap && aiMatch.primary.embedMapUrl && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-xl overflow-hidden border border-white/20 mt-2 bg-white"
                    >
                      <iframe
                        title={aiMatch.primary.name}
                        src={aiMatch.primary.embedMapUrl}
                        className="w-full h-44 border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[#F4F5F7] space-y-1.5">
                  <div className="text-xs font-bold text-[#0A0A0A] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Kỹ thuật viên dự kiến tiếp nhận
                  </div>
                  <p className="text-xs text-neutral-600">
                    <span className="font-semibold text-[#0A0A0A]">
                      {aiMatch.primary.recommendedTech?.name}
                    </span>{" "}
                    ({aiMatch.primary.recommendedTech?.level}) — {aiMatch.primary.recommendedTech?.teamName}
                  </p>
                  <p className="text-[11px] text-neutral-500 pt-1 leading-relaxed">
                    {aiMatch.primary.reason}
                  </p>
                </div>

                {aiMatch.alternatives?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                      Hoặc chọn trạm dự phòng lân cận
                    </div>
                    {aiMatch.alternatives.map((alt) => {
                      const picked = form.preferredBranchCode === alt.code;
                      return (
                        <button
                          key={alt.code}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, preferredBranchCode: alt.code }))}
                          className={`w-full flex items-center justify-between text-xs px-4 py-3 rounded-2xl border transition-all cursor-pointer text-left ${
                            picked
                              ? "border-[#0A0A0A] bg-[#0A0A0A] text-white font-bold"
                              : "border-neutral-200 bg-white hover:border-[#0A0A0A] text-[#0A0A0A]"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="truncate font-semibold">{alt.name}</div>
                            <div className={`text-[10px] truncate ${picked ? "text-neutral-300" : "text-neutral-400"}`}>
                              {alt.distanceText} · {alt.travelTimeText} · {alt.address}
                            </div>
                          </div>
                          <span className={`text-[11px] shrink-0 ${picked ? "text-white" : "text-neutral-500"}`}>
                            {picked ? "Đang chọn" : `Tải ${alt.loadPercent}%`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-neutral-400">Nhập địa chỉ hoặc bấm Dùng GPS hiện tại để xem gợi ý trạm gần nhất.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
