import type { ReactNode } from "react"

interface FormPageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  aside?: ReactNode
}

export function FormPageHeader({ title, subtitle, aside }: FormPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-title-2 font-semibold tracking-[-0.01em] break-words text-secondary">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-xl text-small-1 text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {aside ? <div className="w-full shrink-0 sm:w-auto">{aside}</div> : null}
    </header>
  )
}
