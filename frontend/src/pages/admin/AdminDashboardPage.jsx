import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileBadge,
  Wrench,
  ShieldCheck,
  Users,
  ArrowRight,
  Clock,
  Building2,
} from "lucide-react";
import { analyticsApi } from "../../api/client";
import { formatDateVN, getTicketStatusMeta } from "../../utils/format";
import { useToast } from "../../context/ToastContext";

export const AdminDashboardPage = () => {
  const toast = useToast();
  const [range, setRange] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsApi
      .overview(range)
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [range]);

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Tổng quan Vận hành Bảo hành
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Theo dõi lưu lượng chứng từ bảo hành số, hiệu suất SLA và công suất các trạm kỹ thuật.
          </p>
        </div>

        <div className="inline-flex p-1 rounded-2xl bg-white border border-slate-200/80 self-start">
          {[
            { id: "all", label: "Toàn thời gian" },
            { id: "today", label: "24 giờ qua" },
            { id: "7days", label: "7 ngày" },
            { id: "month", label: "30 ngày" },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                range === r.id ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Chứng nhận đang hiệu lực",
            value: kpis.activeRecords ?? "—",
            sub: `/ ${kpis.totalRecords ?? 0} tổng chứng từ`,
            icon: FileBadge,
            tone: "bg-indigo-50 text-indigo-600",
          },
          {
            label: "Phiếu RMA đang mở",
            value: kpis.openTickets ?? "—",
            sub: `${kpis.completedTickets ?? 0} phiếu đã hoàn tất`,
            icon: Wrench,
            tone: "bg-sky-50 text-sky-600",
          },
          {
            label: "Tỷ lệ đạt chuẩn SLA",
            value: kpis.slaRate ? `${kpis.slaRate}%` : "—",
            sub: `${kpis.slaBreached ?? 0} phiếu quá hạn SLA`,
            icon: ShieldCheck,
            tone: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Khách hàng định danh",
            value: kpis.customerCount ?? "—",
            sub: `${kpis.productCount ?? 0} dòng SKU quản lý`,
            icon: Users,
            tone: "bg-amber-50 text-amber-600",
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-[0_1px_4px_rgba(15,23,42,0.02)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{card.label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.tone}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {loading ? "—" : card.value}
              </span>
              <span className="text-xs text-slate-400">{card.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left: Recent RMA Tickets Table */}
        <div className="xl:col-span-8 rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-[0_1px_6px_rgba(15,23,42,0.02)]">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Hàng đợi Phiếu Bảo hành Mới nhất</h2>
              <p className="text-xs text-slate-500 mt-0.5">Nhấp vào mã phiếu để mở bàn điều phối kỹ thuật</p>
            </div>
            <Link
              to="/admin/tickets"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <span>Điều phối tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Mã Phiếu</th>
                  <th className="px-6 py-3.5">Thiết bị &amp; Serial</th>
                  <th className="px-6 py-3.5">Khách hàng</th>
                  <th className="px-6 py-3.5">Trạm phụ trách</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.recentTickets || []).map((t) => {
                  const st = getTicketStatusMeta(t.status);
                  return (
                    <tr key={t._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                        <Link to={`/admin/tickets?ticket=${encodeURIComponent(t.warrantyCode)}`}>
                          {t.warrantyCode}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 max-w-[240px] truncate">
                          {t.productName}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">{t.productSerial}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{t.customerName}</div>
                        <div className="text-slate-400">{t.customerPhone}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {t.assignedBranch?.name || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dotClass}`} />
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Fault Distribution + Branch Load + Expiring */}
        <div className="xl:col-span-4 space-y-6">
          {/* Fault Distribution */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tỷ trọng Nhóm lỗi Kỹ thuật</h3>
            <div className="space-y-3.5">
              {(data?.faultDistribution || []).map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{f.label}</span>
                    <span className="font-bold text-slate-900">
                      {f.pct}% ({f.count})
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, f.pct)}%`, backgroundColor: f.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service Stations Capacity */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Công suất Trạm Ủy quyền</h3>
            </div>
            <div className="space-y-3">
              {(data?.branches || []).map((b) => (
                <div key={b.code} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{b.name}</span>
                    <span className="font-semibold text-slate-500">{b.loadPercent}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        b.loadPercent > 60 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${b.loadPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expiring Certificates */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Chứng nhận Sắp hết hạn</h3>
              </div>
              <Link to="/admin/records" className="text-xs font-semibold text-indigo-600">
                Quản lý →
              </Link>
            </div>
            {(data?.expiringAlerts || []).slice(0, 3).map((r) => (
              <div
                key={r._id}
                className="p-3 rounded-2xl bg-amber-50/40 border border-amber-200/60 text-xs flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate">{r.productName}</div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    {r.wbCode} · Hạn {formatDateVN(r.endDate)}
                  </div>
                </div>
                <span className="font-bold text-amber-700 shrink-0">{r.daysRemaining} ngày</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
