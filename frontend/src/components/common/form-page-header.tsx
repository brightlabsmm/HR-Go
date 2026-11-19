import type { ReactNode } from "react"

interface FormPageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  aside?: ReactNode
}

export function FormPageHeader({ title, subtitle, aside }: FormPageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-title-2 font-semibold tracking-[-0.01em] text-secondary">{title}</h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-xl text-small-1 text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </header>
  )
}
