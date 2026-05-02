"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
};

type ToastContextValue = {
  toast: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const toastStyles: Record<ToastType, { icon: LucideIcon; iconClass: string }> = {
  success: { icon: CheckCircle2, iconClass: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" },
  error: { icon: XCircle, iconClass: "border-rose-400/30 bg-rose-500/10 text-rose-300" },
  warning: { icon: AlertTriangle, iconClass: "border-orange-400/30 bg-orange-500/10 text-orange-300" },
  info: { icon: Info, iconClass: "border-blue-400/30 bg-blue-500/10 text-blue-300" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 11);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[110] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => {
            const { icon: Icon, iconClass } = toastStyles[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 24, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.96 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="pointer-events-auto"
              >
                <div className="glass-panel flex min-w-[300px] max-w-[380px] items-start gap-3 rounded-[12px] border border-white/[0.12] px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                  <div className={`rounded-[8px] border p-1.5 ${iconClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-white">{t.title}</div>
                    {t.description && <div className="mt-0.5 text-[11px] text-slate-400">{t.description}</div>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
