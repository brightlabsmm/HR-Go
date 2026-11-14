import type { ComponentProps } from "react"
import { cn } from "cn"

function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className={cn("bg-transparent", className)}>
      <div className="w-full overflow-x-auto">
        <table
          data-slot="table"
          className="w-full border-collapse text-small-1 text-foreground"
          {...props}
        />
      </div>
    </div>
  )
}

function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={className} {...props} />
}

function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child_td]:border-b-0", className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("transition-colors hover:bg-accent/40", className)}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-11 border-b border-border bg-transparent px-4 text-left align-middle text-small-2 font-medium whitespace-nowrap text-muted-foreground first:pl-1 last:pr-1",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "h-16 border-b border-hair px-4 align-middle whitespace-nowrap first:pl-1 last:pr-1",
        className
      )}
      {...props}
    />
  )
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow }
