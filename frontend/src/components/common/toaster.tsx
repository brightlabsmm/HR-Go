import { createPortal } from "react-dom"
import { cva } from "class-variance-authority"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "cn"
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  XIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { useMotionVariants } from "@/shared/hooks/use-motion-variants"
import {
  useToastStore,
  type ToastItem,
  type ToastVariant,
} from "@/shared/stores/toast.store"

const toastVariants = cva(
  "pointer-events-auto flex w-full min-w-80 max-w-md items-center gap-3 rounded-lg border-l-4 px-4 py-3 shadow-button",
  {
    variants: {
      variant: {
        success: "border-success bg-success-muted text-success",
        error: "border-destructive bg-destructive-muted text-destructive",
        warning: "border-warning bg-warning-muted text-warning-foreground",
        info: "border-info bg-info-muted text-info",
      },
    },
    defaultVariants: {
      variant: "success",
    },
  }
)

const iconClassNames: Record<ToastVariant, string> = {
  success: "fill-success stroke-success-foreground",
  error: "fill-destructive stroke-destructive-foreground",
  warning: "fill-warning stroke-warning-foreground",
  info: "fill-info stroke-info-foreground",
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const className = cn("size-6 shrink-0", iconClassNames[variant])

  if (variant === "success") {
    return <CircleCheckIcon aria-hidden className={className} />
  }

  if (variant === "info") {
    return <InfoIcon aria-hidden className={className} />
  }

  return <CircleAlertIcon aria-hidden className={className} />
}

interface ToastCardProps {
  item: ToastItem
  onDismiss: (id: string) => void
}

function ToastCard({ item, onDismiss }: ToastCardProps) {
  const { t } = useTranslation("common")
  const { slideDown } = useMotionVariants()

  return (
    <motion.div
      role={item.variant === "error" ? "alert" : "status"}
      variants={slideDown}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={toastVariants({ variant: item.variant })}
    >
      <ToastIcon variant={item.variant} />
      <p className="min-w-0 flex-1 text-body-2 font-medium">{item.title}</p>
      <button
        type="button"
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-current outline-none hover:bg-foreground/5 focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={t("actions.close")}
        onClick={() => onDismiss(item.id)}
      >
        <XIcon className="size-4" />
      </button>
    </motion.div>
  )
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4"
      aria-live="polite"
    >
      <div className="flex w-max max-w-full flex-col items-center gap-2">
        <AnimatePresence>
          {toasts.map((item) => (
            <ToastCard key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </div>,
    document.body
  )
}
