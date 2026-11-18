import { Link, NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  FileBadge,
  Wrench,
  Users,
  Package,
  BarChart3,
  ArrowUpRight,
  ShieldCheck,
  Database,
  Download,
} from "lucide-react";
import { analyticsApi } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const adminNav = [
  { to: "/admin", label: "Tổng quan vận hành", icon: LayoutDashboard, end: true },
  { to: "/admin/records", label: "Kho Chứng nhận BH", icon: FileBadge },
  { to: "/admin/tickets", label: "Điều phối Phiếu RMA", icon: Wrench },
  { to: "/admin/customers", label: "Hồ sơ Khách hàng", icon: Users },
  { to: "/admin/products", label: "Danh mục Thiết bị", icon: Package },
  { to: "/admin/analytics", label: "Báo cáo & Phân tích", icon: BarChart3 },
];

export const AdminLayout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex bg-slate-50/80 text-slate-900">
      {/* Crisp Minimalist Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-slate-200/80 sticky top-0 h-screen">
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight text-slate-900">
                Warranty<span className="text-indigo-600">Ops</span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Operations Suite
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Quản trị chứng từ &amp; kỹ thuật
          </div>
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold shadow-[inset_0_0_0_1px_rgba(79,70,229,0.12)]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>MongoDB Atlas Cloud</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Đồng bộ thời gian thực với cổng tra cứu &amp; chứng nhận số.
            </p>
          </div>

          <Link
            to="/"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors"
          >
            <span>Về Cổng Khách hàng</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Utility Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/75 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto lg:hidden py-1">
            {adminNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Không gian điều hành tập trung</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <a
              href={analyticsApi.exportUrl("records")}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Xuất sổ CSV</span>
            </a>
            <div className="h-8 px-3 rounded-xl bg-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span>{user?.fullname || "Quản trị viên"}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
