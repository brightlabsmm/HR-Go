import { cn } from "cn"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface FilterSelectItem {
  value: string
  label: string
}

interface FilterSelectProps {
  items: FilterSelectItem[]
  value: string
  label: string
  onValueChange: (value: string) => void
  className?: string
}

export function FilterSelect({
  items,
  value,
  label,
  onValueChange,
  className,
}: FilterSelectProps) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next) {
          onValueChange(next)
        }
      }}
    >
      <SelectTrigger
        aria-label={label}
        className={cn(
          "h-11 w-full shrink-0 bg-surface data-[size=default]:h-11 sm:w-44",
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
