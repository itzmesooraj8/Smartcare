import * as React from "react";
import { toast as sonnerToast } from "sonner";

export interface ToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
}

export function toast({ title, description, variant }: ToastOptions) {
  const msg = typeof title === "string" ? title : String(title || "");
  const desc = typeof description === "string" ? description : undefined;

  if (variant === "destructive") {
    sonnerToast.error(msg, { description: desc });
  } else {
    sonnerToast.success(msg, { description: desc });
  }
}

export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    toasts: [],
  };
}
