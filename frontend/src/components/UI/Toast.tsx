import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import type { ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> =
  {
    success: {
      bg: "var(--color-success-soft)",
      border: "rgba(16, 185, 129, 0.3)",
      icon: "var(--color-success)",
    },
    error: {
      bg: "var(--color-danger-soft)",
      border: "rgba(239, 68, 68, 0.3)",
      icon: "var(--color-danger)",
    },
    info: {
      bg: "var(--color-info-soft)",
      border: "rgba(6, 182, 212, 0.3)",
      icon: "var(--color-info)",
    },
  };

const AUTO_DISMISS_MS = 4000;

function ToastItemComponent({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const Icon = ICONS[item.type];
  const color = COLORS[item.type];
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(item.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timerRef.current);
  }, [item.id, onDismiss]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-sm)",
        padding: "var(--space-md) var(--space-lg)",
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: "var(--radius-md)",
        backdropFilter: "blur(12px)",
        boxShadow: "var(--shadow-md)",
        animation: "toastSlideIn 0.3s ease forwards",
        minWidth: 280,
        maxWidth: 420,
      }}
    >
      <Icon size={18} style={{ color: color.icon, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: "0.9rem", color: "var(--color-text)" }}>
        {item.message}
      </span>
      <button
        onClick={() => onDismiss(item.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--color-text-muted)",
          padding: 2,
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: "var(--space-xl)",
          right: "var(--space-xl)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-sm)",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <ToastItemComponent item={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
