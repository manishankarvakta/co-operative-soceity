"use client";

import React from "react";

import { useCallback, useState } from "react";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
export type ModalVariant = "approve" | "reject" | "delete" | "warning" | "info";
export type ToastType = "success" | "error" | "warning";

export interface ConfirmModalProps {
  open: boolean;
  variant?: ModalVariant;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ToastState {
  visible: boolean;
  type: ToastType | null;
  title: string;
  message: string;
  exiting: boolean;
}

/* ─────────────────────────────────────────────
   ICONS
───────────────────────────────────────────── */
const icons: Record<ModalVariant, React.ReactNode> = {
  approve: (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  reject: (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  delete: (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
};

const variantStyles: Record<ModalVariant, { accent: string; iconBg: string; confirmBtn: string }> = {
  approve: {
    accent: "bg-emerald-500",
    iconBg: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
    confirmBtn: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-white",
  },
  reject: {
    accent: "bg-red-500",
    iconBg: "bg-red-100 dark:bg-red-950/40 text-red-500 dark:text-red-400",
    confirmBtn: "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white",
  },
  delete: {
    accent: "bg-red-600",
    iconBg: "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400",
    confirmBtn: "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white",
  },
  warning: {
    accent: "bg-amber-500",
    iconBg: "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
    confirmBtn: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400 text-white",
  },
  info: {
    accent: "bg-blue-500",
    iconBg: "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
    confirmBtn: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white",
  },
};

/* ─────────────────────────────────────────────
   CONFIRM MODAL COMPONENT
───────────────────────────────────────────── */
export function ConfirmModal({
  open,
  variant = "warning",
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: "cm-fadeIn 0.18s ease" }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loading && onCancel()} />

      {/* Dialog */}
      <div
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-700 overflow-hidden"
        style={{ animation: "cm-slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        {/* Top accent */}
        <div className={`h-1 w-full ${styles.accent}`} />

        <div className="p-7">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${styles.iconBg}`}>
            {icons[variant]}
          </div>

          {/* Text */}
          <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">{title}</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-7">{message}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 flex items-center justify-center gap-2 ${styles.confirmBtn}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cm-fadeIn  { from { opacity: 0 }                              to { opacity: 1 } }
        @keyframes cm-slideUp { from { opacity:0; transform:translateY(24px) scale(.96) } to { opacity:1; transform:translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOAST COMPONENT
───────────────────────────────────────────── */
export function Toast({ toast }: { toast: ToastState }) {
  if (!toast.visible) return null;

  const styles = {
    success: {
      wrap: "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800",
      icon: "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400",
      title: "text-emerald-800 dark:text-emerald-200",
      msg: "text-emerald-600 dark:text-emerald-400",
      bar: "bg-emerald-400",
      svg: <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />,
    },
    error: {
      wrap: "bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800",
      icon: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400",
      title: "text-red-800 dark:text-red-200",
      msg: "text-red-600 dark:text-red-400",
      bar: "bg-red-400",
      svg: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
    },
    warning: {
      wrap: "bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800",
      icon: "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400",
      title: "text-amber-800 dark:text-amber-200",
      msg: "text-amber-600 dark:text-amber-400",
      bar: "bg-amber-400",
      svg: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12V16.5z" />,
    },
  };

  const s = styles[toast.type ?? "success"];

  return (
    <div
      className="fixed top-5 right-5 z-[60] max-w-sm w-full"
      style={{ animation: `${toast.exiting ? "cm-toastOut" : "cm-toastIn"} 0.35s ease forwards` }}
    >
      <div className={`relative flex items-start gap-4 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-sm overflow-hidden ${s.wrap}`}>
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${s.icon}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            {s.svg}
          </svg>
        </div>
        <div className="flex-1 pt-0.5">
          <p className={`text-sm font-semibold ${s.title}`}>{toast.title}</p>
          <p className={`text-xs mt-0.5 ${s.msg}`}>{toast.message}</p>
        </div>
        {/* Progress bar */}
        <div className={`absolute bottom-0 left-0 h-0.5 ${s.bar}`} style={{ animation: "cm-progress 3s linear forwards" }} />
      </div>

      <style>{`
        @keyframes cm-toastIn  { from { opacity:0; transform:translateX(100%) } to { opacity:1; transform:translateX(0) } }
        @keyframes cm-toastOut { from { opacity:1; transform:translateX(0) }   to { opacity:0; transform:translateX(100%) } }
        @keyframes cm-progress { from { width:100% } to { width:0% } }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   useToast HOOK — use in any page
───────────────────────────────────────────── */
export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: null,
    title: "",
    message: "",
    exiting: false,
  });

  const showToast = useCallback((type: ToastType, title: string, message = "") => {
    setToast({ visible: true, type, title, message, exiting: false });
    setTimeout(() => setToast((t) => ({ ...t, exiting: true })), 2700);
    setTimeout(() => setToast({ visible: false, type: null, title: "", message: "", exiting: false }), 3100);
  }, []);

  return { toast, showToast };
}
