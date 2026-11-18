import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  ArrowUpRight,
  Check,
  TrendingUp,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { useDeviceInsights } from "../../hooks/useDeviceInsights";

const FALLBACK_COVERS = [
  "/assets/apple-hero-devices.jpg",
  "/assets/apple-service-lounge.jpg",
  "/assets/apple-gps-route.jpg",
];

const getCoverImage = (src, idx = 0) => {
  if (src?.imageUrl && /^https?:\/\//i.test(src.imageUrl)) return src.imageUrl;
  return FALLBACK_COVERS[idx % FALLBACK_COVERS.length];
};

const TREND_META = {
  rising: {
    label: "Tín hiệu lỗi tăng gần đây",
    dot: "bg-rose-500",
    icon: TrendingUp,
  },
  stable: {
    label: "Mức độ phát sinh lỗi ổn định",
    dot: "bg-amber-500",
    icon: Activity,
  },
  low: {
    label: "Ít phản ánh lỗi diện rộng",
    dot: "bg-emerald-500",
    icon: ShieldCheck,
  },
};

const getChannelLabel = (src) => {
  if (src?.channel === "brand_community") return "Community chính hãng";
  if (src?.channel === "reddit") return "Reddit EN";
  if (src?.lang === "en") return "Tech News EN";
  return "Tin tức VN";
};

export const DeviceNewsroomRadar = ({
  initialDeviceName = "",
  initialCategory = "",
  suggestedDevices = [],
}) => {
  const defaultOwned =
    (initialDeviceName || "").trim() ||
    suggestedDevices[0]?.productName ||
    "";
  const [query, setQuery] = useState(defaultOwned);
  const [timeframeMonths, setTimeframeMonths] = useState(6);
  const { insight, loading, error, analyze, refresh } = useDeviceInsights();

  // Sync strictly to the user's own selected device from MongoDB records
  useEffect(() => {
    const target = (initialDeviceName || "").trim() || suggestedDevices[0]?.productName || "";
    if (!target) return;
    setQuery(target);
    analyze(target, initialCategory || suggestedDevices[0]?.category || "", { timeframeMonths });
  }, [initialDeviceName, initialCategory, suggestedDevices, timeframeMonths, analyze]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      analyze(query.trim(), initialCategory, { timeframeMonths });
    }
  };

  const handleSwitchDevice = (name, category = "") => {
    setQuery(name);
    analyze(name, category, { timeframeMonths });
  };

  const handleSwitchTimeframe = (months) => {
    setTimeframeMonths(months);
    if (query.trim().length >= 2) {
      analyze(query.trim(), initialCategory, { timeframeMonths: months });
    }
  };

  // CHỈ hiển thị đúng các thiết bị người dùng đang sở hữu trong kho hồ sơ
  const seenNames = new Set();
  const quickPills = suggestedDevices
    .filter((d) => {
      const key = String(d.productName || "").trim().toLowerCase();
      if (!key || seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    })
    .map((d) => ({
      name: d.productName,
      category: d.category || "",
      serial: d.serialNumber || "",
    }))
    .slice(0, 6);

  const trend = TREND_META[insight?.warrantyTrend] || TREND_META.stable;
  const sources = insight?.sources || [];
  const leadSource = sources[0] || null;
  const newsCards = sources.slice(0, 6);

  return (
    <section id="community-newsroom" className="space-y-8 scroll-mt-24">
      {/* Editorial Newsroom Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#6E6E73]">
            <span className={`w-1.5 h-1.5 rounded-full ${trend.dot}`} />
            <span>
              Bản tin cộng đồng chính hãng &amp; diễn đàn quốc tế
              {insight?.brandDetected ? ` · ${insight.brandDetected}` : ""}
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-[#1D1D1F]">
            Cảnh báo lỗi nổi bật gần đây
          </h2>
        </div>

        {/* Clean inline search + timeframe switch */}
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#86868B] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm thiết bị (VD: Acer Nitro 5)..."
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#F5F5F7] text-[13px] text-[#1D1D1F] placeholder:text-[#86868B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D1D1F]"
            />
          </div>

          <div className="inline-flex p-1 rounded-full bg-[#F5F5F7]">
            {[
              { m: 6, label: "6 tháng" },
              { m: 12, label: "12 tháng" },
            ].map((opt) => (
              <button
                key={opt.m}
                type="button"
                onClick={() => handleSwitchTimeframe(opt.m)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  timeframeMonths === opt.m
                    ? "bg-[#1D1D1F] text-white"
                    : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="editorial-pill-btn px-5 py-2.5 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-xs font-medium cursor-pointer disabled:opacity-60"
          >
            {loading ? "Đang quét..." : "Phân tích"}
          </button>

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            title="Quét dữ liệu mới nhất"
            className="w-9 h-9 rounded-full bg-[#F5F5F7] hover:bg-[#EAEAEF] flex items-center justify-center text-[#1D1D1F] cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </form>
      </div>

      {/* Quick Device Switcher Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[#86868B] mr-1">Thiết bị theo dõi:</span>
        {quickPills.map((d) => {
          const isSelected = query.trim().toLowerCase() === d.name.trim().toLowerCase();
          return (
            <button
              key={d.name}
              type="button"
              onClick={() => handleSwitchDevice(d.name, d.category)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer max-w-[240px] truncate ${
                isSelected
                  ? "bg-[#1D1D1F] text-white"
                  : "bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]"
              }`}
            >
              {d.name}
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 h-[380px] rounded-[28px] bg-[#F5F5F7] animate-pulse" />
            <div className="lg:col-span-5 h-[380px] rounded-[28px] bg-[#F5F5F7] animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-72 rounded-[24px] bg-[#F5F5F7] animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="rounded-[24px] bg-rose-50 px-6 py-5 text-sm text-rose-700">{error}</div>
      )}

      {/* Newsroom Content */}
      {!loading && insight && (
        <div className="space-y-10">
          {/* TOP FEATURED NEWSROOM HERO (7 cols Lead Story + 5 cols Top Issues Breakdown) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Lead Featured Story Card */}
            <div className="lg:col-span-7 rounded-[28px] overflow-hidden bg-[#111111] text-white flex flex-col justify-between">
              <div className="apple-photo-wrap relative h-56 sm:h-64 bg-[#1D1D1F]">
                <img
                  src={getCoverImage(leadSource, 0)}
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_COVERS[0];
                  }}
                  alt={insight.deviceName}
                  className="w-full h-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/35 to-transparent" />
                <div className="absolute top-5 left-6 right-6 flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full ${trend.dot}`} />
                    {trend.label}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-black/55 backdrop-blur-md text-[#D2D2D7] font-mono text-[11px]">
                    {insight.provider}
                  </span>
                </div>
              </div>

              <div className="p-7 sm:p-8 space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="text-xs text-[#A1A1A6]">
                    {insight.deviceName} · {insight.articleCount} thảo luận gần đây ({timeframeMonths} tháng) ·{" "}
                    {insight.internalStats?.totalTickets || 0} phiếu nội bộ
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-semibold tracking-tight leading-snug text-white">
                    {insight.trendHeadline}
                  </h3>
                  <p className="text-sm text-[#A1A1A6] leading-relaxed">{insight.trendSummary}</p>
                </div>

                {leadSource && (
                  <a
                    href={leadSource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-2xl bg-white/[0.06] hover:bg-white/[0.11] border border-white/10 p-4 flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="text-[11px] text-[#A1A1A6]">
                        Thảo luận mới nhất · {leadSource.source}
                        {leadSource.publishedAt ? ` · ${leadSource.publishedAt}` : ""}
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-white line-clamp-1">
                        {leadSource.title}
                      </div>
                    </div>
                    <span className="w-8 h-8 rounded-full bg-white text-[#111111] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </a>
                )}
              </div>
            </div>

            {/* Right 5 cols: Top Common Issues + Pre-Expiry Checklist */}
            <div className="lg:col-span-5 rounded-[28px] bg-[#F5F5F7] p-7 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[#1D1D1F]">
                    Lỗi gặp nhiều nhất gần đây
                  </h3>
                  <span className="text-xs text-[#6E6E73]">{timeframeMonths} tháng</span>
                </div>

                <div className="space-y-4">
                  {(insight.topCommonIssues || []).slice(0, 4).map((issue, idx) => (
                    <div key={`${issue.title}-${idx}`} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-[#1D1D1F] leading-snug">
                          {issue.title}
                        </span>
                        <span className="font-mono font-semibold text-[#1D1D1F] shrink-0">
                          {issue.sharePercent}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-black/[0.08] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#1D1D1F]"
                          style={{ width: `${Math.min(100, issue.sharePercent)}%` }}
                        />
                      </div>
                      {issue.symptoms && (
                        <p className="text-[11px] text-[#6E6E73] leading-relaxed">
                          {issue.symptoms}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {insight.preExpiryChecklist?.length > 0 && (
                <div className="pt-5 border-t border-black/[0.08] space-y-2.5">
                  <div className="text-xs font-semibold text-[#1D1D1F]">
                    Kiểm tra trước khi hết hạn bảo hành
                  </div>
                  <div className="space-y-1.5">
                    {insight.preExpiryChecklist.slice(0, 3).map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#6E6E73]">
                        <Check className="w-3.5 h-3.5 text-[#1D1D1F] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3-COLUMN APPLE NEWSROOM STYLE FEATURED ARTICLE CARDS */}
          {newsCards.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-[#1D1D1F]">
                  Bài viết &amp; báo lỗi nổi bật từ cộng đồng
                </h3>
                <span className="text-xs text-[#6E6E73]">
                  Cập nhật tự động · Bấm để đọc nguồn gốc
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsCards.map((src, idx) => (
                  <a
                    key={`${src.url}-${idx}`}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="apple-card group rounded-[24px] bg-[#F5F5F7] hover:bg-[#EFEFF4] overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="apple-photo-wrap h-44 bg-[#EAEAEF] relative">
                        <img
                          src={getCoverImage(src, idx + 1)}
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_COVERS[(idx + 1) % FALLBACK_COVERS.length];
                          }}
                          alt={src.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[11px] font-medium text-[#1D1D1F]">
                          {getChannelLabel(src)}
                        </span>
                      </div>

                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-[#6E6E73]">
                          <span className="font-medium truncate">{src.source}</span>
                          {src.publishedAt && (
                            <span className="font-mono shrink-0">{src.publishedAt}</span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-[#1D1D1F] leading-snug line-clamp-2 group-hover:underline">
                          {src.title}
                        </h4>
                        {src.snippet && (
                          <p className="text-xs text-[#6E6E73] leading-relaxed line-clamp-2">
                            {src.snippet}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-2 flex items-center justify-between text-xs font-medium text-[#1D1D1F]">
                      <span>Đọc bài gốc</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#6E6E73] group-hover:text-[#1D1D1F] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
