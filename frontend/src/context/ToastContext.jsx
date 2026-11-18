import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
      setTimeout(() => remove(id), 4200);
    },
    [remove]
  );

  const toast = {
    success: (msg) => push("success", msg),
    error: (msg) => push("error", msg),
    info: (msg) => push("info", msg),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-md w-full px-4 sm:px-0 pointer-events-none no-print">
        <AnimatePresence>
          {toasts.map((item) => {
            const styles =
              item.type === "success"
                ? "bg-white border-emerald-200/90 text-slate-800 shadow-lg shadow-slate-900/5"
                : item.type === "error"
                  ? "bg-white border-rose-200/90 text-slate-800 shadow-lg shadow-slate-900/5"
                  : "bg-white border-indigo-200/90 text-slate-800 shadow-lg shadow-slate-900/5";
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.22 }}
                className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl border ${styles}`}
              >
                {item.type === "success" && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                {item.type === "error" && (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                {item.type === "info" && (
                  <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                )}
                <p className="text-sm font-medium leading-relaxed flex-1">{item.message}</p>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
