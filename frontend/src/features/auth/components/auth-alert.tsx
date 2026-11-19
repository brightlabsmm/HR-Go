import { cn } from "cn"
import { CircleAlertIcon, ShieldAlert } from "lucide-react"

interface AuthAlertProps {
  title: string
  description?: string
  variant?: "error" | "help"
}

export function AuthAlert({
  title,
  description,
  variant = "error",
}: AuthAlertProps) {
  const isHelp = variant === "help"
  const Icon = isHelp ? ShieldAlert : CircleAlertIcon

  return (
    <div
      role={isHelp ? "note" : "alert"}
      className={cn(
        "flex gap-3.5 rounded-[10px] px-[18px] py-4",
        isHelp ? "items-start bg-light-blue" : "items-center border border-destructive bg-destructive-muted"
      )}
    >
      <Icon
        aria-hidden
        className={
          isHelp
            ? "mt-0.5 size-[18px] shrink-0 text-primary"
            : "size-5 shrink-0 text-destructive"
        }
      />
      <div className="flex min-w-0 flex-col">
        <p
          className={cn(
            "text-body-2",
            isHelp
              ? description
                ? "font-medium text-secondary"
                : "font-normal text-secondary"
              : "font-medium text-destructive"
          )}
        >
          {title}
        </p>
        {description ? (
          <p
            className={cn(
              "text-small-1",
              isHelp ? "text-secondary" : "text-destructive"
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}
