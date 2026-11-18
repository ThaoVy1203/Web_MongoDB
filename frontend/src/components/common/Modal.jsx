import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export const Modal = ({ open, onClose, title, subtitle, maxWidth = "max-w-xl", children }) => {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-[3px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-[28px] bg-white border border-neutral-200 shadow-2xl shadow-black/15`}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-7 py-5 bg-white/95 backdrop-blur border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-[#0A0A0A]">{title}</h3>
                {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-[#0A0A0A] hover:border-[#0A0A0A] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-7">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
