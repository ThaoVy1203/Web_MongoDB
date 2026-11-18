import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Search,
  FolderKanban,
  Send,
  Activity,
  LayoutDashboard,
  LogOut,
  UserCheck,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const navItems = [
  { to: "/", label: "Không gian Hồ sơ", icon: FolderKanban, end: true },
  { to: "/lookup", label: "Tra cứu & Chứng nhận", icon: Search },
  { to: "/my-devices", label: "Sổ Thiết bị", icon: ShieldCheck },
  { to: "/submit-request", label: "Gửi yêu cầu", icon: Send },
  { to: "/track", label: "Theo dõi tiến độ", icon: Activity },
];

export const PortalLayout = () => {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.info("Đã đăng xuất khỏi phiên làm việc.");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900">
      {/* Clean Frosted Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/75 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:bg-indigo-700 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                Warranty<span className="text-indigo-600">Ops</span>
              </span>
              <span className="hidden sm:block text-[11px] text-slate-400 font-medium">
                Digital Document Vault
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-50/90 text-indigo-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`
                }
              >
                <item.icon className="w-4 h-4 opacity-80" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/70 transition-colors"
              title="Mở Bàn điều hành Quản trị"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isAdmin ? "Quản trị" : "Admin Workspace"}</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-2 pl-1">
                <Link
                  to="/my-devices"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-300 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="max-w-[130px] truncate">{user.fullname}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                    isActive ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
                Admin Workspace
              </Link>
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-semibold text-rose-600 px-3 py-2"
                >
                  Đăng xuất ({user.fullname})
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Outlet />
      </main>

      {/* Minimalist Airy Footer */}
      <footer className="border-t border-slate-200/70 bg-white mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-700">WarrantyOps Platform</span>
            <span>·</span>
            <span>Hệ thống lưu trữ chứng từ bảo hành số &amp; điều phối kỹ thuật thông minh</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/lookup" className="hover:text-indigo-600 transition-colors">
              Xác thực QR / Serial
            </Link>
            <Link to="/submit-request" className="hover:text-indigo-600 transition-colors">
              Định tuyến Trạm AI
            </Link>
            <Link to="/admin" className="hover:text-indigo-600 transition-colors">
              Cổng Quản trị
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
