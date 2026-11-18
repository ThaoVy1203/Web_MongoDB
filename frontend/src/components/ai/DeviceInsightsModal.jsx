import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  ExternalLink,
  Check,
  TrendingUp,
  Activity,
  ShieldCheck,
  Newspaper,
} from "lucide-react";
import { Modal } from "../common/Modal";
import { useDeviceInsights } from "../../hooks/useDeviceInsights";

const QUICK_MODELS = ["Acer Nitro 5", "Dell XPS 15 9530", "MacBook Pro M3", "iPhone 15 Pro Max"];

const TREND_META = {
  rising: {
    label: "Xu hướng bảo hành tăng gần đây",
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

export const DeviceInsightsModal = ({ open, onClose, deviceName = "", category = "" }) => {
  const [query, setQuery] = useState(deviceName || "Acer Nitro 5");
  const [timeframeMonths, setTimeframeMonths] = useState(6);
  const { insight, loading, error, analyze, refresh } = useDeviceInsights();

  useEffect(() => {
    if (!open) return;
    const target = (deviceName || "").trim() || "Acer Nitro 5";
    setQuery(target);
    analyze(target, category, { timeframeMonths });
  }, [open, deviceName, category, timeframeMonths, analyze]);

  const handleSearch = (e) => {
    e.preventDefault();
    analyze(query, category, { timeframeMonths });
  };

  const handleSwitchTimeframe = (months) => {
    setTimeframeMonths(months);
    if (query.trim().length >= 2) {
      analyze(query, category, { timeframeMonths: months });
    }
  };

  const trend = TREND_META[insight?.warrantyTrend] || TREND_META.stable;

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title="Phân tích Lỗi & Xu hướng Bảo hành"
      subtitle="Tổng hợp bài viết cộng đồng mới nhất, dữ liệu nội bộ và phân tích bằng AI"
    >
      <div className="space-y-6">
        {/* Search any device directly */}
        <form onSubmit={handleSearch} className="space-y-2.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#86868B] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập tên thiết bị (VD: Acer Nitro 5, ThinkPad X1...)"
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#F5F5F7] text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D1D1F]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="editorial-pill-btn px-5 py-2.5 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-xs font-medium cursor-pointer disabled:opacity-60 shrink-0"
            >
              {loading ? "Đang quét..." : "Phân tích"}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6E6E73]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span>Thử nhanh:</span>
              {QUICK_MODELS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setQuery(m);
                    analyze(m, category, { timeframeMonths });
                  }}
                  className="px-2.5 py-0.5 rounded-full bg-[#F5F5F7] hover:bg-[#1D1D1F] hover:text-white text-[#1D1D1F] transition-colors cursor-pointer"
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="inline-flex p-0.5 rounded-full bg-[#F5F5F7]">
              {[
                { m: 6, label: "6 tháng" },
                { m: 12, label: "12 tháng" },
              ].map((opt) => (
                <button
                  key={opt.m}
                  type="button"
                  onClick={() => handleSwitchTimeframe(opt.m)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                    timeframeMonths === opt.m
                      ? "bg-[#1D1D1F] text-white"
                      : "text-[#6E6E73] hover:text-[#1D1D1F]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3 py-2">
            <div className="h-24 rounded-2xl bg-[#F5F5F7] animate-pulse" />
            <div className="h-36 rounded-2xl bg-[#F5F5F7] animate-pulse" />
            <p className="text-center text-xs text-[#6E6E73]">
              Đang thu thập bài viết mới nhất &amp; tổng hợp lỗi phổ biến cho &ldquo;{query}&rdquo;...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="rounded-2xl bg-rose-50 px-5 py-4 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Result */}
        {!loading && insight && (
          <div className="space-y-6">
            {/* Trend Summary Card */}
            <div className="rounded-[22px] bg-[#111111] text-white p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#A1A1A6]">
                <span className="inline-flex items-center gap-2 text-white font-medium">
                  <span className={`w-2 h-2 rounded-full ${trend.dot}`} />
                  {trend.label}
                </span>
                <div className="flex items-center gap-2">
                  <span>{insight.provider}</span>
                  <button
                    type="button"
                    onClick={refresh}
                    title="Quét dữ liệu mới nhất"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Quét mới</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-base sm:text-lg font-semibold leading-snug text-white">
                  {insight.trendHeadline}
                </h4>
                <p className="text-[13px] text-[#D2D2D7] leading-relaxed">
                  {insight.trendSummary}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
                <div>
                  <div className="text-[#86868B]">Bài viết đã quét</div>
                  <div className="text-base font-semibold mt-0.5 tabular-nums">
                    {insight.articleCount}
                  </div>
                </div>
                <div>
                  <div className="text-[#86868B]">Phiếu BH nội bộ</div>
                  <div className="text-base font-semibold mt-0.5 tabular-nums">
                    {insight.internalStats?.totalTickets || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[#86868B]">30 ngày gần đây</div>
                  <div className="text-base font-semibold mt-0.5 tabular-nums">
                    {insight.internalStats?.recent30d || 0} phiếu
                  </div>
                </div>
              </div>
            </div>

            {/* Top Common Issues */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">
                Lỗi gặp nhiều nhất gần đây
              </h5>
              <div className="space-y-2.5">
                {(insight.topCommonIssues || []).map((issue, idx) => (
                  <div
                    key={`${issue.title}-${idx}`}
                    className="rounded-2xl bg-[#F5F5F7] p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[#1D1D1F]">{issue.title}</span>
                      <span className="font-mono text-xs font-semibold text-[#1D1D1F] shrink-0">
                        {issue.sharePercent}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-black/[0.07] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#1D1D1F]"
                        style={{ width: `${Math.min(100, issue.sharePercent)}%` }}
                      />
                    </div>
                    {issue.symptoms && (
                      <p className="text-xs text-[#6E6E73] leading-relaxed">{issue.symptoms}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pre-expiry Checklist */}
            {insight.preExpiryChecklist?.length > 0 && (
              <div className="space-y-2.5">
                <h5 className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">
                  Nên kiểm tra trước khi hết hạn bảo hành
                </h5>
                <div className="rounded-2xl border border-black/[0.08] p-4 space-y-2">
                  {insight.preExpiryChecklist.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-[#1D1D1F]">
                      <Check className="w-3.5 h-3.5 text-[#1D1D1F] shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real Cited Articles */}
            {insight.sources?.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1.5">
                    <Newspaper className="w-3.5 h-3.5" />
                    <span>
                      Cộng đồng hãng &amp; thảo luận gần đây ({insight.sources.length})
                    </span>
                  </span>
                  {insight.brandDetected && (
                    <span className="text-[11px] font-medium normal-case tracking-normal text-[#1D1D1F]">
                      Nguồn ưu tiên: {insight.brandDetected}
                    </span>
                  )}
                </div>
                <div className="divide-y divide-black/[0.06] rounded-2xl border border-black/[0.08] px-4">
                  {insight.sources.map((src, i) => {
                    const channelLabel =
                      src.channel === "brand_community"
                        ? "Community hãng"
                        : src.channel === "reddit"
                          ? "Reddit EN"
                          : src.lang === "en"
                            ? "Quốc tế EN"
                            : "VN";
                    return (
                      <a
                        key={`${src.url}-${i}`}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="py-3 flex items-start justify-between gap-3 hover:opacity-75 transition-opacity"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="text-xs font-medium text-[#1D1D1F] line-clamp-2">
                            {src.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#86868B]">
                            <span className="font-medium text-[#1D1D1F]">{channelLabel}</span>
                            <span>·</span>
                            <span>{src.source}</span>
                            {src.publishedAt && (
                              <>
                                <span>·</span>
                                <span className="font-mono">{src.publishedAt}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-[#86868B] shrink-0 mt-0.5" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
