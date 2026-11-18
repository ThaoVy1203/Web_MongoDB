import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  Printer,
  Wrench,
  CheckCircle2,
  Clock,
  Wallet,
  Search,
  Star,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { analyticsApi } from "../../api/client";
import { formatPriceNumber } from "../../utils/format";
import { useToast } from "../../context/ToastContext";

export const AdminAnalyticsPage = () => {
  const toast = useToast();
  const [branch, setBranch] = useState("all");
  const [category, setCategory] = useState("all");
  const [techSearch, setTechSearch] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.reports({ branch, category });
      setData(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [branch, category]);

  const kpis = data?.kpis || {};
  const rc = data?.rootCauseStats || {
    oemPct: 0,
    userPct: 0,
    envPct: 0,
    oemCount: 0,
    userCount: 0,
    envCount: 0,
  };

  // SVG Donut math (r = 56, circumference = 2 * PI * 56 ≈ 351.86)
  const C = 351.86;
  const oemLen = (rc.oemPct / 100) * C;
  const userLen = (rc.userPct / 100) * C;
  const envLen = Math.max(0, C - oemLen - userLen);

  const visibleTechs = (data?.techScorecard || []).filter((t) => {
    if (!techSearch.trim()) return true;
    const kw = techSearch.trim().toLowerCase();
    return (
      t.name.toLowerCase().includes(kw) ||
      t.code.toLowerCase().includes(kw) ||
      t.branch.toLowerCase().includes(kw) ||
      (t.teamName || "").toLowerCase().includes(kw)
    );
  });

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Báo cáo &amp; Phân tích Vận hành
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Đo lường tỷ lệ xử lý thành công (FCR), phân loại nguyên nhân lỗi, xếp hạng rủi ro SKU và hiệu suất kỹ thuật viên.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>In PDF</span>
          </button>
          <a
            href={analyticsApi.exportUrl("tickets")}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Xuất CSV Phiếu RMA</span>
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 no-print">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-[#0A0A0A]"
          >
            <option value="all">Toàn quốc (Tất cả trạm)</option>
            {(data?.branches || []).map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-[#0A0A0A]"
          >
            <option value="all">Tất cả nhóm thiết bị</option>
            <option value="Laptop/Máy tính">Laptop/Máy tính</option>
            <option value="Điện thoại">Điện thoại</option>
            <option value="Màn hình">Màn hình</option>
            <option value="Phụ kiện">Phụ kiện</option>
            <option value="Thiết bị gia dụng">Thiết bị gia dụng</option>
          </select>
        </div>

        <button
          type="button"
          onClick={loadReports}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Làm mới số liệu</span>
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng phiếu tiếp nhận",
            value: kpis.totalTickets ?? "—",
            sub: "Trong phạm vi bộ lọc",
            icon: Wrench,
            tone: "bg-[#F4F5F7] text-[#0A0A0A]",
          },
          {
            label: "Tỷ lệ xử lý đạt chuẩn (FCR)",
            value: kpis.fcrRate ? `${kpis.fcrRate}%` : "—",
            sub: "Mục tiêu QC ≥ 93.0%",
            icon: CheckCircle2,
            tone: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Thời gian sửa TB (MTTR)",
            value: kpis.mttrDays ? `${kpis.mttrDays} ngày` : "—",
            sub: "Chuẩn hãng < 2.5 ngày",
            icon: Clock,
            tone: "bg-sky-50 text-sky-600",
          },
          {
            label: "Chi phí bảo hành ước tính",
            value: formatPriceNumber(kpis.totalCost),
            sub: "Gồm linh kiện & công sửa",
            icon: Wallet,
            tone: "bg-amber-50 text-amber-600",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-[0_1px_4px_rgba(15,23,42,0.02)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{card.label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.tone}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-extrabold text-slate-900 tabular-nums">
              {loading ? "—" : card.value}
            </div>
            <div className="text-xs text-slate-400 mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts + Defect Ranking Row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Root Cause Donut */}
        <div className="xl:col-span-5 rounded-3xl bg-white border border-slate-200/80 p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Phân loại Nguyên nhân Lỗi</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tỷ trọng lỗi phần cứng nhà sản xuất (OEM) so với tác động ngoại lực &amp; môi trường
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-40 h-40 shrink-0">
              <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                <circle cx="70" cy="70" r="56" fill="none" stroke="#f1f5f9" strokeWidth="16" />
                <circle
                  cx="70"
                  cy="70"
                  r="56"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="16"
                  strokeDasharray={`${oemLen} ${C}`}
                  strokeDashoffset="0"
                />
                <circle
                  cx="70"
                  cy="70"
                  r="56"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="16"
                  strokeDasharray={`${userLen} ${C}`}
                  strokeDashoffset={-oemLen}
                />
                <circle
                  cx="70"
                  cy="70"
                  r="56"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="16"
                  strokeDasharray={`${envLen} ${C}`}
                  strokeDashoffset={-(oemLen + userLen)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{rc.oemPct}%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lỗi OEM</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-3 text-xs">
              {[
                { label: "Lỗi phần cứng OEM / Hãng", pct: rc.oemPct, count: rc.oemCount, color: "bg-[#0A0A0A]" },
                { label: "Rơi vỡ / Tác động người dùng", pct: rc.userPct, count: rc.userCount, color: "bg-amber-500" },
                { label: "Môi trường / Quá nhiệt / Ẩm", pct: rc.envPct, count: rc.envCount, color: "bg-sky-500" },
              ].map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-700">
                      <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                      {row.label}
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {row.pct}% ({row.count})
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.max(4, row.pct)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Top 5 Defect Ranking */}
        <div className="xl:col-span-7 rounded-3xl bg-white border border-slate-200/80 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Top 5 SKU Phát sinh Bảo hành Cao nhất</h2>
              <p className="text-xs text-slate-500 mt-0.5">Cảnh báo lô hàng vượt ngưỡng chuẩn lỗi 2.5%</p>
            </div>
            <Link to="/admin/products" className="text-xs font-semibold text-[#0A0A0A] hover:underline">
              Danh mục SKU →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Thiết bị &amp; SKU</th>
                  <th className="px-5 py-3.5">Phiếu / Bán</th>
                  <th className="px-5 py-3.5">Tỷ lệ lỗi</th>
                  <th className="px-5 py-3.5">Linh kiện thường gặp</th>
                  <th className="px-5 py-3.5">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.defectRanking || []).map((p) => {
                  const high = p.defectRate >= 3;
                  const med = p.defectRate >= 1.5 && p.defectRate < 3;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 max-w-[200px] truncate">{p.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{p.sku}</div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-700">
                        {p.claimCount} / {p.soldCount || 100}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{p.defectRate}%</td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-[170px] truncate">
                        {p.commonFaultPart}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            high
                              ? "bg-rose-50 text-rose-700"
                              : med
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {high && <AlertTriangle className="w-3 h-3" />}
                          {high ? "Nguy cơ cao" : med ? "Theo dõi" : "Ổn định"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Technician SLA Scorecard */}
      <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Bảng Hiệu suất Kỹ thuật viên &amp; Trung tâm (SLA Scorecard)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Đánh giá tiến độ hoàn tất, MTTR và chỉ số hài lòng khách hàng (CSAT)
            </p>
          </div>
          <div className="relative w-full sm:w-72 no-print">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={techSearch}
              onChange={(e) => setTechSearch(e.target.value)}
              placeholder="Tìm tên KTV, mã KTV, trạm..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Kỹ thuật viên</th>
                <th className="px-6 py-3.5">Trung tâm &amp; Đội chuyên môn</th>
                <th className="px-6 py-3.5">Phiếu xử lý</th>
                <th className="px-6 py-3.5">MTTR</th>
                <th className="px-6 py-3.5">Tuân thủ SLA</th>
                <th className="px-6 py-3.5">CSAT</th>
                <th className="px-6 py-3.5">Xếp loại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleTechs.map((tech) => (
                <tr key={tech.code} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{tech.name}</div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {tech.code} · {tech.level}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{tech.branch}</div>
                    <div className="text-[11px] text-slate-500">{tech.teamName}</div>
                  </td>
                  <td className="px-6 py-4 font-mono">
                    <span className="font-bold text-slate-900">{tech.doneHandled}</span>
                    <span className="text-slate-400"> / {tech.totalHandled}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{tech.mttrDays} ngày</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            tech.slaPct >= 95 ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${tech.slaPct}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 tabular-nums">{tech.slaPct}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                      {tech.csat}
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        tech.grade.includes("A+")
                          ? "bg-[#F4F5F7] text-[#0A0A0A]"
                          : tech.grade.includes("(A)")
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {tech.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
