import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: "success" | "error";
}

interface ToastInput {
  title: string;
  description?: string;
}

interface ToastContextValue {
  showSuccess: (toast: ToastInput) => void;
  showError: (toast: ToastInput) => void;
}

interface ToastProviderProps {
  children: ReactNode;
}

const TOAST_DURATION_MS = 3600;
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, TOAST_DURATION_MS)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts]);

  function showToast(variant: Toast["variant"], toast: ToastInput) {
    setToasts((current) => [
      ...current,
      {
        id: window.crypto?.randomUUID?.() ?? `${Date.now()}-${current.length}`,
        title: toast.title,
        description: toast.description,
        variant,
      },
    ]);
  }

  const value: ToastContextValue = {
    showSuccess: (toast) => showToast("success", toast),
    showError: (toast) => showToast("error", toast),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(28rem,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto overflow-hidden rounded-[1.35rem] border px-4 py-4 shadow-[0_18px_50px_rgba(2,6,23,0.45)] backdrop-blur-xl ${
              toast.variant === "success"
                ? "border-emerald-400/30 bg-emerald-500/14 text-emerald-50"
                : "border-rose-400/30 bg-rose-500/14 text-rose-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-sm leading-6 text-white/80">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() =>
                  setToasts((current) => current.filter((item) => item.id !== toast.id))
                }
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80 transition hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
