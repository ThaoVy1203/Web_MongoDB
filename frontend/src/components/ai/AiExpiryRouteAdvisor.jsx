import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  LocateFixed,
  Navigation,
  Phone,
  Clock,
  CalendarPlus,
  RefreshCw,
  Map as MapIcon,
  ArrowUpRight,
  Building2,
  Route,
  CheckCircle2,
  X,
} from "lucide-react";
import { analyticsApi, recordsApi } from "../../api/client";
import { downloadWarrantyReminderIcs } from "../../utils/calendar";
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

const QUICK_LOCATIONS = [
  { label: "Hà Nội", lat: 21.0285, lng: 105.8048 },
  { label: "TP.HCM", lat: 10.7769, lng: 106.7009 },
  { label: "Đà Nẵng", lat: 16.0544, lng: 108.2022 },
];

export const AiExpiryRouteAdvisor = ({ onRenewed, refreshKey = 0 }) => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("expiring");
  const [advisorData, setAdvisorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showMapForCode, setShowMapForCode] = useState(null);
  const [renewingId, setRenewingId] = useState(null);

  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("idle");

  const [customAddress, setCustomAddress] = useState("Số 45 Trần Thái Tông, Cầu Giấy, Hà Nội");
  const [customCategory, setCustomCategory] = useState("Laptop/Máy tính");
  const [customResult, setCustomResult] = useState(null);
  const [customLoading, setCustomLoading] = useState(false);

  const fetchAdvisor = useCallback(
    async (coords = gpsCoords) => {
      setLoading(true);
      try {
        const payload = coords ? { lat: coords.lat, lng: coords.lng } : {};
        const res = await analyticsApi.expiringAdvisor(payload);
        const data = res.data;
        setAdvisorData(data);
        if (data?.items?.length > 0) {
          setSelectedId((prev) =>
            prev && data.items.some((i) => i.record._id === prev) ? prev : data.items[0].record._id
          );
        } else {
          setSelectedId(null);
        }
      } catch (err) {
        toast.error(err.message || "Không thể tải phân tích AI.");
      } finally {
        setLoading(false);
      }
    },
    [gpsCoords, toast]
  );

  useEffect(() => {
    fetchAdvisor(gpsCoords);
  }, [fetchAdvisor, gpsCoords, refreshKey]);

  const runCustomAnalyze = useCallback(
    async (addr = customAddress, cat = customCategory, coords = gpsCoords) => {
      setCustomLoading(true);
      try {
        const res = await analyticsApi.suggestBranch({
          address: addr,
          category: cat,
          issueDescription: "Kiểm tra chứng từ & định tuyến trạm",
          ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
        });
        setCustomResult(res.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setCustomLoading(false);
      }
    },
    [customAddress, customCategory, gpsCoords, toast]
  );

  useEffect(() => {
    if (activeTab === "custom" && !customResult && !customLoading) {
      runCustomAnalyze(customAddress, customCategory, gpsCoords);
    }
  }, [activeTab, customResult, customLoading, runCustomAnalyze, customAddress, customCategory, gpsCoords]);

  const handleRequestGps = () => {
    if (!("geolocation" in navigator)) {
      setGpsStatus("denied");
      toast.warning("Trình duyệt không hỗ trợ GPS. Bạn có thể chọn nhanh thành phố bên dưới.");
      return;
    }
    setGpsStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextCoords = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
          label: "Vị trí hiện tại",
        };
        setGpsCoords(nextCoords);
        setGpsStatus("active");
        toast.success("Đã lấy tọa độ GPS hiện tại và tính khoảng cách tới các trung tâm.");
        if (customResult) runCustomAnalyze(customAddress, customCategory, nextCoords);
      },
      (err) => {
        setGpsStatus("denied");
        toast.warning(
          err.code === 1
            ? "Chưa cấp quyền vị trí. Bạn có thể chọn nhanh khu vực bên cạnh."
            : "Không thể xác định GPS lúc này. Hãy chọn nhanh khu vực bên cạnh."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handlePickQuickLocation = (loc) => {
    const nextCoords = { lat: loc.lat, lng: loc.lng, label: loc.label };
    setGpsCoords(nextCoords);
    setGpsStatus("active");
    toast.info(`Đã đặt vị trí định tuyến tại ${loc.label}.`);
    if (customResult) runCustomAnalyze(customAddress, customCategory, nextCoords);
  };

  const handleClearGps = () => {
    setGpsCoords(null);
    setGpsStatus("idle");
    if (customResult) runCustomAnalyze(customAddress, customCategory, null);
  };

  const handleQuickRenew = async (rec) => {
    if (renewingId === rec._id) return;
    if (!window.confirm(`Xác nhận gia hạn thêm 12 tháng cho chứng nhận ${rec.wbCode} (${rec.productName})?`)) {
      return;
    }
    setRenewingId(rec._id);
    try {
      const res = await recordsApi.renew(rec._id, { months: 12 });
      toast.success(res.message);
      await fetchAdvisor(gpsCoords);
      onRenewed?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRenewingId(null);
    }
  };

  const items = advisorData?.items || [];
  const nearestCenters = advisorData?.nearestCenters || [];
  const summary = advisorData?.summary || {
    totalExpiring: 0,
    criticalCount: 0,
    withAddressCount: 0,
    nearestCenterName: "",
    nearestCenterDistanceKm: null,
  };

  const selectedItem = items.find((i) => i.record._id === selectedId) || items[0] || null;

  return (
    <div className="space-y-8">
      {/* Spacious Top GPS Control Bar — Apple calm clarity */}
      <div className="rounded-[24px] bg-[#F5F5F7] p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-[#1D1D1F]">
            <span
              className={`w-2 h-2 rounded-full ${
                gpsStatus === "active"
                  ? "bg-emerald-500"
                  : gpsStatus === "locating"
                    ? "bg-[#0071E3] animate-pulse"
                    : "bg-[#86868B]"
              }`}
            />
            {gpsCoords ? (
              <span>
                Đang định tuyến từ {gpsCoords.label}{" "}
                <span className="font-mono text-xs font-normal text-[#6E6E73]">
                  ({gpsCoords.lat}, {gpsCoords.lng})
                </span>
              </span>
            ) : (
              <span>
                {gpsStatus === "locating"
                  ? "Đang xác định vị trí GPS của bạn..."
                  : "Bật định vị GPS để tính chính xác khoảng cách & tuyến đường"}
              </span>
            )}
          </div>

          <p className="text-[13px] text-[#6E6E73]">
            {gpsCoords && summary.nearestCenterName
              ? `Trung tâm gần nhất: ${summary.nearestCenterName} (${summary.nearestCenterDistanceKm} km)`
              : "AI tự động đọc địa chỉ ghi trên giấy bảo hành và kết hợp với vị trí hiện tại của bạn."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!gpsCoords &&
            QUICK_LOCATIONS.map((loc) => (
              <button
                key={loc.label}
                type="button"
                onClick={() => handlePickQuickLocation(loc)}
                className="px-4 py-2 rounded-full bg-white hover:bg-[#1D1D1F] hover:text-white text-[13px] font-medium text-[#1D1D1F] transition-colors cursor-pointer"
              >
                {loc.label}
              </button>
            ))}

          <button
            type="button"
            onClick={handleRequestGps}
            disabled={gpsStatus === "locating"}
            className="editorial-pill-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-[13px] font-medium cursor-pointer disabled:opacity-60"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${gpsStatus === "locating" ? "animate-spin" : ""}`} />
            <span>{gpsCoords ? "Cập nhật GPS" : "Lấy vị trí hiện tại"}</span>
          </button>

          {gpsCoords && (
            <button
              type="button"
              onClick={handleClearGps}
              title="Tắt GPS"
              className="w-9 h-9 rounded-full bg-white hover:bg-[#E8E8ED] flex items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchAdvisor(gpsCoords)}
            disabled={loading}
            title="Quét lại"
            className="w-9 h-9 rounded-full bg-white hover:bg-[#E8E8ED] flex items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Sub-view Switch */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.08] pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "expiring", label: `Sắp hết hạn (${summary.totalExpiring})` },
            { id: "nearest", label: `Trung tâm gần nhất (${nearestCenters.length})` },
            { id: "custom", label: "Tra cứu địa chỉ bất kỳ" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#1D1D1F] text-white"
                  : "text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#6E6E73] flex items-center gap-4">
          <span>
            Khẩn cấp ≤ 7 ngày: <strong className="text-[#1D1D1F]">{summary.criticalCount}</strong>
          </span>
          <span>
            Tự trích xuất địa chỉ: <strong className="text-[#1D1D1F]">{summary.withAddressCount}</strong>
          </span>
        </div>
      </div>

      {/* TAB 1: FULL-WIDTH SPACIOUS 2-COLUMN EXPIRING + ROUTE */}
      {activeTab === "expiring" && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="h-28 rounded-[22px] bg-[#F5F5F7] animate-pulse" />
                ))}
              </div>
              <div className="lg:col-span-7 h-80 rounded-[28px] bg-[#F5F5F7] animate-pulse" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[28px] bg-[#F5F5F7] py-16 px-6 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#1D1D1F] mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-[#1D1D1F]">
                Tất cả giấy bảo hành đều còn hạn dài
              </h3>
              <p className="text-sm text-[#6E6E73] max-w-md mx-auto">
                Không có chứng từ nào sắp hết hạn trong 30 ngày tới. Bạn vẫn có thể xem các trung tâm gần nhất hoặc tra cứu địa chỉ.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 5 cols: Spacious Expiring Records List */}
              <div className="lg:col-span-5 space-y-3">
                {items.map((item) => {
                  const active = selectedItem?.record._id === item.record._id;
                  const dotColor =
                    item.urgency === "critical" || item.urgency === "expired_recent"
                      ? "bg-rose-500"
                      : "bg-amber-500";
                  return (
                    <button
                      key={item.record._id}
                      type="button"
                      onClick={() => {
                        setSelectedId(item.record._id);
                        setShowMapForCode(null);
                      }}
                      className={`w-full text-left p-5 rounded-[22px] border transition-all cursor-pointer space-y-2.5 ${
                        active
                          ? "bg-[#F5F5F7] border-[#1D1D1F]"
                          : "bg-white border-black/[0.08] hover:border-black/25"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-[#6E6E73]">{item.record.wbCode}</span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1D1D1F]">
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          {item.urgencyLabel}
                        </span>
                      </div>

                      <div className="text-[15px] font-semibold text-[#1D1D1F] leading-snug">
                        {item.record.productName}
                      </div>

                      <div className="flex items-start gap-2 text-xs text-[#6E6E73]">
                        <MapPin className="w-3.5 h-3.5 text-[#1D1D1F] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          {item.extractedAddress.found
                            ? item.extractedAddress.address
                            : "Chưa có địa chỉ trên giấy — định tuyến theo GPS"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right 7 cols: Spacious Dark Route Recommendation Card */}
              {selectedItem && selectedItem.routing?.primary && (
                <div className="lg:col-span-7 rounded-[28px] bg-[#111111] text-white p-7 sm:p-9 space-y-7">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#A1A1A6]">
                      <span>Khuyến nghị cho {selectedItem.record.wbCode}</span>
                      {selectedItem.extractedAddress.found && (
                        <span>Nguồn: {selectedItem.extractedAddress.source}</span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                      {selectedItem.routing.primary.name}
                    </h3>
                    <p className="text-sm text-[#A1A1A6] leading-relaxed">
                      {selectedItem.routing.primary.address}
                    </p>
                  </div>

                  {/* Clean 3-Stat Line */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5 border-y border-white/10">
                    <div>
                      <div className="text-xs text-[#86868B]">Khoảng cách &amp; di chuyển</div>
                      <div className="text-sm font-semibold text-white mt-1 flex items-center gap-1.5">
                        <Route className="w-3.5 h-3.5 text-[#A1A1A6]" />
                        {selectedItem.routing.primary.distanceText}
                      </div>
                      <div className="text-xs text-[#A1A1A6] mt-0.5">
                        {selectedItem.routing.primary.travelTimeText}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#86868B]">Công suất &amp; SLA</div>
                      <div className="text-sm font-semibold text-white mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#A1A1A6]" />
                        Tải {selectedItem.routing.primary.loadPercent}% · {selectedItem.routing.primary.slaHours}h
                      </div>
                      <div className="text-xs text-[#A1A1A6] mt-0.5">
                        {selectedItem.routing.primary.openHours}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#86868B]">Hotline trung tâm</div>
                      <div className="text-sm font-semibold text-white mt-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#A1A1A6]" />
                        {selectedItem.routing.primary.phone}
                      </div>
                      <div className="text-xs text-[#A1A1A6] mt-0.5">
                        {selectedItem.routing.gpsUsed
                          ? "Ưu tiên theo GPS"
                          : `Độ khớp ${selectedItem.routing.confidence}%`}
                      </div>
                    </div>
                  </div>

                  {/* Calm AI Explanation */}
                  <p className="text-[13px] text-[#D2D2D7] leading-relaxed">
                    {selectedItem.aiActionAdvice} {selectedItem.routing.primary.reason}
                  </p>

                  {/* Primary Action Row */}
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={selectedItem.routing.primary.directionsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="editorial-pill-btn inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-[#E8E8ED] text-[#1D1D1F] text-[13px] font-semibold"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Chỉ đường Google Maps</span>
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        setShowMapForCode((prev) =>
                          prev === selectedItem.routing.primary.code
                            ? null
                            : selectedItem.routing.primary.code
                        )
                      }
                      className="editorial-pill-btn inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/20 hover:border-white text-white text-[13px] font-medium cursor-pointer"
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      <span>
                        {showMapForCode === selectedItem.routing.primary.code
                          ? "Ẩn bản đồ"
                          : "Xem bản đồ trực tiếp"}
                      </span>
                    </button>
                    <Link
                      to={`/submit-request?serial=${encodeURIComponent(
                        selectedItem.record.serialNumber
                      )}&address=${encodeURIComponent(
                        selectedItem.extractedAddress.address || ""
                      )}&branch=${encodeURIComponent(selectedItem.routing.primary.code)}`}
                      className="inline-flex items-center gap-1 px-4 py-3 text-[13px] font-medium text-white hover:underline"
                    >
                      <span>Đặt lịch kiểm tra</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {showMapForCode === selectedItem.routing.primary.code && (
                    <div className="rounded-2xl overflow-hidden border border-white/15 bg-white">
                      <iframe
                        title={selectedItem.routing.primary.name}
                        src={selectedItem.routing.primary.embedMapUrl}
                        className="w-full h-64 border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}

                  {/* Secondary Quick Actions + Alternatives */}
                  <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          downloadWarrantyReminderIcs(selectedItem.record, 7);
                          toast.info("Đã xuất tệp nhắc lịch bảo hành (.ics)");
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white cursor-pointer"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span>Xuất nhắc lịch (.ics)</span>
                      </button>
                      <button
                        type="button"
                        disabled={renewingId === selectedItem.record._id}
                        onClick={() => handleQuickRenew(selectedItem.record)}
                        className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white cursor-pointer disabled:opacity-50"
                      >
                        {renewingId === selectedItem.record._id ? "Đang gia hạn..." : "Gia hạn +12 tháng"}
                      </button>
                    </div>

                    {selectedItem.routing.alternatives?.[0] && (
                      <a
                        href={selectedItem.routing.alternatives[0].directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#A1A1A6] hover:text-white transition-colors"
                      >
                        Trạm dự phòng: {selectedItem.routing.alternatives[0].name} (
                        {selectedItem.routing.alternatives[0].distanceText}) ↗
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* TAB 2: ALL NEAREST CENTERS GRID */}
      {activeTab === "nearest" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nearestCenters.map((c, idx) => {
            const isTop = idx === 0 && gpsCoords;
            return (
              <div
                key={c.code}
                className={`apple-card rounded-[24px] p-6 flex flex-col justify-between gap-5 border ${
                  isTop
                    ? "bg-[#111111] text-white border-[#111111]"
                    : "bg-[#F5F5F7] text-[#1D1D1F] border-transparent"
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className={isTop ? "text-[#A1A1A6]" : "text-[#6E6E73]"}>
                      {isTop ? "Gần vị trí bạn nhất" : c.city}
                    </span>
                    <span className="font-semibold">{c.distanceText}</span>
                  </div>
                  <h4 className="text-base font-semibold leading-snug">{c.name}</h4>
                  <p className={`text-[13px] leading-relaxed ${isTop ? "text-[#A1A1A6]" : "text-[#6E6E73]"}`}>
                    {c.address}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className={`text-xs ${isTop ? "text-[#A1A1A6]" : "text-[#6E6E73]"}`}>
                    {c.travelTimeText} · Tải {c.loadPercent}% · {c.phone}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-current/10">
                    <button
                      type="button"
                      onClick={() => setShowMapForCode((prev) => (prev === c.code ? null : c.code))}
                      className="text-xs font-medium opacity-80 hover:opacity-100 cursor-pointer"
                    >
                      {showMapForCode === c.code ? "Ẩn bản đồ" : "Xem bản đồ"}
                    </button>
                    <a
                      href={c.directionsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Chỉ đường</span>
                    </a>
                  </div>
                  {showMapForCode === c.code && (
                    <div className="rounded-xl overflow-hidden bg-white mt-2">
                      <iframe
                        title={c.name}
                        src={c.embedMapUrl}
                        className="w-full h-44 border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: CUSTOM ADDRESS */}
      {activeTab === "custom" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runCustomAnalyze(customAddress, customCategory, gpsCoords);
            }}
            className="lg:col-span-5 rounded-[24px] bg-[#F5F5F7] p-6 sm:p-7 space-y-5"
          >
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-[#1D1D1F]">Tra cứu theo địa chỉ bất kỳ</h4>
              <p className="text-xs text-[#6E6E73]">
                Nhập địa chỉ ghi trên giấy bảo hành hoặc nơi ở của bạn để AI chọn trạm phù hợp nhất.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="VD: 204 Phan Văn Trị, Bình Thạnh, TP.HCM"
                className="w-full px-4 py-3 rounded-2xl bg-white border border-black/[0.08] text-sm text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F]"
              />
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-black/[0.08] text-sm text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F]"
              >
                {CATEGORY_LIST.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={customLoading}
              className="editorial-pill-btn w-full py-3 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-[13px] font-semibold cursor-pointer disabled:opacity-60"
            >
              {customLoading ? "Đang phân tích..." : "Phân tích & gợi ý trạm"}
            </button>
          </form>

          <div className="lg:col-span-7">
            {customResult?.matched && customResult.primary ? (
              <div className="rounded-[28px] bg-[#111111] text-white p-7 sm:p-9 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-[#A1A1A6]">Trung tâm phù hợp nhất</div>
                    <h4 className="text-xl font-semibold mt-1">{customResult.primary.name}</h4>
                    <p className="text-sm text-[#A1A1A6] mt-1">{customResult.primary.address}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white text-[#1D1D1F] text-xs font-semibold shrink-0">
                    Khớp {customResult.confidence}%
                  </span>
                </div>

                <p className="text-[13px] text-[#D2D2D7] leading-relaxed">
                  {customResult.primary.reason}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#A1A1A6]">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {customResult.primary.distanceText} · {customResult.primary.travelTimeText}
                  </span>
                  <span>Tải {customResult.primary.loadPercent}%</span>
                  <span>{customResult.primary.phone}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href={customResult.primary.directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="editorial-pill-btn inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-[#E8E8ED] text-[#1D1D1F] text-[13px] font-semibold"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Chỉ đường Google Maps</span>
                  </a>
                  <Link
                    to={`/submit-request?address=${encodeURIComponent(
                      customAddress
                    )}&branch=${encodeURIComponent(customResult.primary.code)}`}
                    className="inline-flex items-center gap-1 px-4 py-3 text-[13px] font-medium text-white hover:underline"
                  >
                    <span>Gửi yêu cầu tới trạm này</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] bg-[#F5F5F7] p-10 text-center text-sm text-[#6E6E73]">
                {customResult?.message || "Nhập địa chỉ bên trái để AI tính tuyến đường tới trung tâm gần nhất."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
