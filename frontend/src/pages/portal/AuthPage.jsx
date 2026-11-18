import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, UserCheck, Lock, Mail, Phone, User } from "lucide-react";
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
    <div className="max-w-md mx-auto py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-white border border-slate-200/80 p-7 sm:p-9 shadow-[0_6px_28px_rgba(15,23,42,0.05)] space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Cổng Tài Khoản WarrantyOps
          </h1>
          <p className="text-xs text-slate-500">
            Đồng bộ sổ chứng nhận bảo hành điện tử &amp; lịch sử kỹ thuật
          </p>
        </div>

        {/* Mode Switch */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === "login" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === "register" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
            }`}
          >
            Tạo tài khoản
          </button>
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email / Số điện thoại / Mã NV
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  value={loginForm.identifier}
                  onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                  placeholder="tuan.tran@gmail.com hoặc admin@warrantyops.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {submitting ? "Đang xác thực..." : "Đăng nhập vào không gian"}
            </button>

            {/* 1-Click Quick Demo Accounts */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Đăng nhập nhanh tài khoản mẫu (1-Click)</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => quickDemoLogin("admin@warrantyops.com", "admin123", "/admin")}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/70 hover:bg-indigo-50/50 text-left transition-all cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-800">Admin Vận Hành</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">admin@warrantyops.com</div>
                </button>
                <button
                  type="button"
                  onClick={() => quickDemoLogin("tuan.tran@gmail.com", "123456", "/my-devices")}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50/70 hover:bg-emerald-50/40 text-left transition-all cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-600" /> Khách VIP
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">tuan.tran@gmail.com</div>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  value={regForm.fullname}
                  onChange={(e) => setRegForm({ ...regForm, fullname: e.target.value })}
                  placeholder="Nguyễn Văn Minh"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="minh.nguyen@email.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  placeholder="0909123456"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu (tối thiểu 6 ký tự) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  minLength={6}
                  type="password"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {submitting ? "Đang khởi tạo..." : "Đăng ký tài khoản mới"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
