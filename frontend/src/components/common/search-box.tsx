import { useEffect, useId, useRef, useState } from "react"
import { SearchIcon, XIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "cn"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

interface SearchBoxProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  debounceMs?: number
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  "aria-label"?: string
}

export function SearchBox({
  value,
  defaultValue = "",
  onValueChange,
  debounceMs = 300,
  placeholder,
  disabled = false,
  className,
  id,
  "aria-label": ariaLabel,
}: SearchBoxProps) {
  const { t } = useTranslation("common")
  const generatedId = useId()
  const inputId = id ?? generatedId
  const resolvedPlaceholder = placeholder ?? t("form.search_placeholder")
  const [draft, setDraft] = useState(value ?? defaultValue)
  const onValueChangeRef = useRef(onValueChange)
  const emittedRef = useRef(draft)
  const timeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    onValueChangeRef.current = onValueChange
  }, [onValueChange])

  useEffect(() => {
    return () => window.clearTimeout(timeoutRef.current)
  }, [])

  useEffect(() => {
    if (value === undefined || value === emittedRef.current) {
      return
    }

    window.clearTimeout(timeoutRef.current)
    emittedRef.current = value
    setDraft(value)
  }, [value])

  function emit(next: string) {
    window.clearTimeout(timeoutRef.current)
    if (next === emittedRef.current) {
      return
    }

    emittedRef.current = next
    onValueChangeRef.current?.(next)
  }

  function schedule(next: string) {
    window.clearTimeout(timeoutRef.current)
    if (next === emittedRef.current) {
      return
    }

    if (next === "" || debounceMs <= 0) {
      emit(next)
      return
    }

    timeoutRef.current = window.setTimeout(() => emit(next), debounceMs)
  }

  return (
    <InputGroup
      className={cn(
        "h-11 border-input bg-surface shadow-none",
        className
      )}
    >
      <InputGroupAddon>
        <SearchIcon className="text-primary" />
      </InputGroupAddon>
      <InputGroupInput
        id={inputId}
        type="search"
        value={draft}
        placeholder={resolvedPlaceholder}
        disabled={disabled}
        aria-label={ariaLabel ?? resolvedPlaceholder}
        className="outline-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
        onChange={(event) => {
          const next = event.target.value
          setDraft(next)
          schedule(next)
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            emit(draft)
          }
        }}
      />
      {draft.length > 0 ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={t("form.clear_search")}
            disabled={disabled}
            onClick={() => {
              setDraft("")
              emit("")
            }}
          >
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}

export type { SearchBoxProps }
