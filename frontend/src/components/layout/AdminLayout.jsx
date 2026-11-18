import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileBadge,
  Wrench,
  Users,
  Package,
  BarChart3,
  ArrowUpRight,
  Database,
  Download,
  LogOut,
} from "lucide-react";
import { analyticsApi } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const adminNav = [
  { to: "/admin", label: "Tổng quan vận hành", icon: LayoutDashboard, end: true },
  { to: "/admin/records", label: "Kho Chứng nhận BH", icon: FileBadge },
  { to: "/admin/tickets", label: "Điều phối Phiếu RMA", icon: Wrench },
  { to: "/admin/customers", label: "Hồ sơ Khách hàng", icon: Users },
  { to: "/admin/products", label: "Danh mục Thiết bị", icon: Package },
  { to: "/admin/analytics", label: "Báo cáo & Phân tích", icon: BarChart3 },
];

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.info("Đã đăng xuất khỏi phiên quản trị.");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex bg-[#F4F5F7] text-[#0A0A0A]">
      {/* Crisp Monochrome Editorial Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-neutral-200/80 sticky top-0 h-screen no-print">
        <div className="h-[72px] px-6 flex items-center justify-between border-b border-neutral-100">
          <Link to="/admin" className="space-y-0.5">
            <div className="font-display text-sm font-bold tracking-[0.06em] uppercase text-[#0A0A0A]">
              WARRANTY<span className="text-neutral-400">.</span>OPS
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              Operations Suite
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="px-3.5 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Điều hành hệ thống
          </div>
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#0A0A0A] text-white"
                    : "text-neutral-600 hover:text-[#0A0A0A] hover:bg-neutral-100"
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-100 space-y-3">
          <div className="rounded-2xl bg-[#F4F5F7] border border-neutral-200/70 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0A0A0A]">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>MongoDB Connected</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
              Đồng bộ thời gian thực với cổng tra cứu &amp; chứng nhận số.
            </p>
          </div>

          <Link
            to="/"
            className="flex items-center justify-between px-4 py-2.5 rounded-full border border-neutral-200 hover:border-[#0A0A0A] text-xs font-semibold text-[#0A0A0A] transition-colors"
          >
            <span>Về Cổng Khách hàng</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Utility Bar */}
        <header className="sticky top-0 z-30 h-[72px] bg-[#F4F5F7]/90 backdrop-blur-md border-b border-neutral-200/70 px-4 sm:px-8 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-2 overflow-x-auto lg:hidden py-1">
            {adminNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                    isActive ? "bg-[#0A0A0A] text-white" : "bg-white border border-neutral-200 text-neutral-600"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Không gian điều hành tập trung</span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <a
              href={analyticsApi.exportUrl("records")}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-200 bg-white hover:border-[#0A0A0A] text-xs font-semibold text-[#0A0A0A] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất sổ CSV</span>
            </a>
            <div className="h-9 px-4 rounded-full bg-white border border-neutral-200 flex items-center gap-2 text-xs font-semibold text-[#0A0A0A]">
              <span className="w-2 h-2 rounded-full bg-[#0A0A0A]" />
              <span className="max-w-[140px] truncate">{user?.fullname || "Quản trị viên"}</span>
            </div>
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                title="Đăng xuất"
                className="w-9 h-9 rounded-full bg-white border border-neutral-200 hover:border-[#0A0A0A] flex items-center justify-center text-neutral-500 hover:text-[#0A0A0A] transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                to="/auth"
                className="px-5 py-2 rounded-full bg-[#0A0A0A] text-white text-xs font-semibold hover:bg-neutral-800"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-8 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
