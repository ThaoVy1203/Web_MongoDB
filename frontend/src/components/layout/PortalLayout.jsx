import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const navItems = [
  { to: "/", label: "Giới thiệu", end: true },
  { to: "/home", label: "Không gian Home" },
  { to: "/lookup", label: "Tra cứu" },
  { to: "/my-devices", label: "Thiết bị" },
  { to: "/submit-request", label: "Gửi yêu cầu" },
  { to: "/track", label: "Theo dõi" },
];

export const PortalLayout = () => {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLanding = location.pathname === "/";

  const handleLogout = async () => {
    await logout();
    toast.info("Đã đăng xuất khỏi phiên làm việc.");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1D1D1F]">
      {/* Apple-Minimalist Frosted Top Bar — seamless with full-bleed hero on / */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-xl no-print transition-colors ${
          isLanding
            ? "bg-[#F6F7F9]/85 border-b border-transparent"
            : "bg-white/80 border-b border-black/[0.06]"
        }`}
      >
        <div
          className={`mx-auto px-6 sm:px-10 h-16 flex items-center justify-between gap-6 ${
            isLanding ? "max-w-[1380px]" : "max-w-[1180px]"
          }`}
        >
          {/* Clean Wordmark */}
          <Link
            to="/"
            className="font-display font-semibold text-[15px] tracking-[-0.02em] text-[#1D1D1F] shrink-0"
          >
            WarrantyOps
          </Link>

          {/* Calm Centered Nav — Apple clarity */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `text-[13px] transition-colors ${
                    isActive
                      ? "text-[#1D1D1F] font-semibold"
                      : "text-[#6E6E73] hover:text-[#1D1D1F] font-normal"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/admin"
              className="text-[13px] text-[#6E6E73] hover:text-[#1D1D1F] font-normal transition-colors"
            >
              {isAdmin ? "Quản trị" : "Admin"}
            </Link>
          </nav>

          {/* Right Action Pill + Mobile Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                <>
                  <Link
                    to="/home"
                    className="editorial-pill-btn inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-[#EAEAEF] text-[13px] font-medium text-[#1D1D1F]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="max-w-[130px] truncate">{user.fullname}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-8 h-8 rounded-full hover:bg-[#F5F5F7] flex items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="editorial-pill-btn inline-flex items-center justify-center px-5 py-2 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-[13px] font-medium"
                >
                  Đăng nhập
                </Link>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Mở menu điều hướng"
              aria-expanded={mobileOpen}
              className="lg:hidden w-9 h-9 rounded-full hover:bg-[#F5F5F7] flex items-center justify-center text-[#1D1D1F]"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-black/[0.06] bg-white px-6 py-5 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm ${
                    isActive
                      ? "bg-[#F5F5F7] text-[#1D1D1F] font-semibold"
                      : "text-[#6E6E73] hover:text-[#1D1D1F]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-4 mt-3 border-t border-black/[0.06] flex items-center justify-between gap-3">
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-[#6E6E73] hover:text-[#1D1D1F] px-4 py-2"
              >
                Quản trị
              </Link>
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-full bg-[#F5F5F7] text-xs font-medium text-[#1D1D1F]"
                >
                  Đăng xuất
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="px-5 py-2 rounded-full bg-[#1D1D1F] text-white text-xs font-medium"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content — Landing gets full-bleed Apple bands, inner app pages get generous centered canvas */}
      <main
        className={
          isLanding
            ? "flex-1 w-full"
            : "flex-1 w-full max-w-[1180px] mx-auto px-6 sm:px-8 py-10 sm:py-14"
        }
      >
        <Outlet />
      </main>

      {/* Quiet Apple-Style Footer */}
      <footer className="bg-[#F5F5F7] border-t border-black/[0.06] no-print">
        <div className="max-w-[1180px] mx-auto px-6 sm:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-black/[0.06]">
            <div className="md:col-span-5 space-y-3">
              <Link
                to="/"
                className="inline-block font-display font-semibold text-sm text-[#1D1D1F]"
              >
                WarrantyOps
              </Link>
              <p className="text-[13px] text-[#6E6E73] leading-relaxed max-w-xs">
                Lưu trữ chứng từ bảo hành số, tự động nhắc hạn và dẫn đường GPS tới trung tâm kỹ thuật gần nhất.
              </p>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="text-xs font-semibold text-[#1D1D1F]">Khám phá</div>
              <ul className="space-y-2.5 text-[13px] text-[#6E6E73]">
                <li>
                  <Link to="/" className="hover:text-[#1D1D1F] transition-colors">
                    Giới thiệu
                  </Link>
                </li>
                <li>
                  <Link to="/home" className="hover:text-[#1D1D1F] transition-colors">
                    Không gian Home
                  </Link>
                </li>
                <li>
                  <Link to="/lookup" className="hover:text-[#1D1D1F] transition-colors">
                    Tra cứu QR
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <div className="text-xs font-semibold text-[#1D1D1F]">Dịch vụ</div>
              <ul className="space-y-2.5 text-[13px] text-[#6E6E73]">
                <li>
                  <Link to="/my-devices" className="hover:text-[#1D1D1F] transition-colors">
                    Sổ thiết bị cá nhân
                  </Link>
                </li>
                <li>
                  <Link to="/submit-request" className="hover:text-[#1D1D1F] transition-colors">
                    Gửi yêu cầu bảo hành
                  </Link>
                </li>
                <li>
                  <Link to="/track" className="hover:text-[#1D1D1F] transition-colors">
                    Theo dõi tiến độ 6 bước
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="text-xs font-semibold text-[#1D1D1F]">Hệ thống</div>
              <ul className="space-y-2.5 text-[13px] text-[#6E6E73]">
                <li>
                  <Link to="/admin" className="hover:text-[#1D1D1F] transition-colors">
                    Cổng Quản trị
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="hover:text-[#1D1D1F] transition-colors">
                    Tài khoản
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#86868B]">
            <span>© 2026 WarrantyOps. Bảo lưu mọi quyền.</span>
            <span>Nền tảng Quản lý Chứng từ Bảo hành &amp; Điều phối GPS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
