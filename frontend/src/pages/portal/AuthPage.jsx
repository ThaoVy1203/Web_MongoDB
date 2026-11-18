import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Mail, Phone, User, ArrowUpRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export const AuthPage = () => {
  const [tab, setTab] = useState("login");
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ identifier: "", password: "" });
  const [regForm, setRegForm] = useState({
    fullname: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const u = await login(loginForm);
      toast.success(`Xin chào ${u.fullname}!`);
      navigate(u.role === "admin" ? "/admin" : "/my-devices");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const u = await register(regForm);
      toast.success(`Tạo tài khoản thành công (${u.customerCode})!`);
      navigate("/my-devices");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const quickDemoLogin = async (identifier, password, target) => {
    setSubmitting(true);
    try {
      const u = await login({ identifier, password });
      toast.success(`Đăng nhập nhanh tài khoản ${u.fullname}!`);
      navigate(target);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[32px] bg-white border border-neutral-200/90 p-8 sm:p-10 space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-xs font-medium text-[#6E6E73]">Tài khoản</div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1D1D1F]">
            WarrantyOps
          </h1>
          <p className="text-xs text-[#6E6E73]">
            Đồng bộ sổ chứng nhận bảo hành điện tử &amp; lịch sử kỹ thuật
          </p>
        </div>

        {/* Pill Mode Switch */}
        <div className="grid grid-cols-2 p-1 rounded-full bg-[#F4F5F7]">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              tab === "login" ? "bg-[#0A0A0A] text-white" : "text-neutral-500 hover:text-[#0A0A0A]"
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              tab === "register" ? "bg-[#0A0A0A] text-white" : "text-neutral-500 hover:text-[#0A0A0A]"
            }`}
          >
            Tạo tài khoản
          </button>
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Email / Số điện thoại / Mã NV
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  required
                  value={loginForm.identifier}
                  onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                  placeholder="tuan.tran@gmail.com hoặc admin@warrantyops.com"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F4F5F7] border border-neutral-200 text-sm focus:bg-white focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F4F5F7] border border-neutral-200 text-sm focus:bg-white focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="editorial-pill-btn w-full py-3.5 rounded-full bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-bold tracking-wide cursor-pointer disabled:opacity-60"
            >
              {submitting ? "Đang xác thực..." : "Đăng nhập vào không gian"}
            </button>

            {/* 1-Click Quick Demo Accounts */}
            <div className="pt-5 border-t border-neutral-100 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400 text-center">
                Đăng nhập nhanh tài khoản mẫu
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => quickDemoLogin("admin@warrantyops.com", "admin123", "/admin")}
                  className="group p-3.5 rounded-2xl border border-neutral-200 hover:border-[#0A0A0A] bg-[#F4F5F7]/60 hover:bg-white text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#0A0A0A]">
                    <span>Admin</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#0A0A0A]" />
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono mt-1 truncate">
                    admin@warrantyops.com
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => quickDemoLogin("tuan.tran@gmail.com", "123456", "/my-devices")}
                  className="group p-3.5 rounded-2xl border border-neutral-200 hover:border-[#0A0A0A] bg-[#F4F5F7]/60 hover:bg-white text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#0A0A0A]">
                    <span>Khách hàng</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#0A0A0A]" />
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono mt-1 truncate">
                    tuan.tran@gmail.com
                  </div>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Họ và tên *</label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  required
                  value={regForm.fullname}
                  onChange={(e) => setRegForm({ ...regForm, fullname: e.target.value })}
                  placeholder="Nguyễn Văn Minh"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F4F5F7] border border-neutral-200 text-sm focus:bg-white focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="minh.nguyen@email.com"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F4F5F7] border border-neutral-200 text-sm focus:bg-white focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Số điện thoại</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  placeholder="0909123456"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F4F5F7] border border-neutral-200 text-sm focus:bg-white focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Mật khẩu (tối thiểu 6 ký tự) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  required
                  minLength={6}
                  type="password"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F4F5F7] border border-neutral-200 text-sm focus:bg-white focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="editorial-pill-btn w-full py-3.5 rounded-full bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-bold tracking-wide cursor-pointer disabled:opacity-60"
            >
              {submitting ? "Đang khởi tạo..." : "Đăng ký tài khoản mới"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
