import { useEffect } from "react"
import { cn } from "cn"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PAGE_SIZE_OPTIONS } from "@/constants/pagination"
import { usePaginationQuery } from "@/shared/hooks/use-pagination-query"
import {
  buildPaginationSearch,
  getPageRange,
  getVisiblePages,
} from "@/util/pagination"

import type { PageMeta } from "@/app/api/types"

interface PaginationProps {
  meta?: PageMeta | null
  isDisabled?: boolean
  className?: string
}

function pageControlClassName(isActive = false) {
  return cn(
    "inline-flex size-8 items-center justify-center rounded-lg text-small-1 font-medium transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-foreground hover:bg-accent"
  )
}

export function Pagination({
  meta,
  isDisabled = false,
  className,
}: PaginationProps) {
  const { t } = useTranslation("common")
  const location = useLocation()
  const { page, limit, setPage, setLimit } = usePaginationQuery()
  const total = meta?.totalItems ?? 0
  const totalPages =
    meta?.totalPages ?? (total > 0 ? Math.ceil(total / limit) : 0)
  const { from, to } = getPageRange(page, limit, total)
  const pages = getVisiblePages(page, totalPages)
  const canGoPrevious = page > 1 && totalPages > 0
  const canGoNext = totalPages > 0 && page < totalPages
  const sizeItems = PAGE_SIZE_OPTIONS.map((size) => ({
    value: String(size),
    label: String(size),
  }))

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages)
    }
  }, [page, setPage, totalPages])

  const hrefFor = (nextPage: number) => ({
    pathname: location.pathname,
    search: buildPaginationSearch(
      new URLSearchParams(location.search),
      { page: nextPage, limit }
    ),
  })

  const rangeLabel =
    total === 0
      ? t("pagination.empty")
      : t("pagination.range", { from, to, count: total })

  return (
    <nav
      className={cn(
        "flex flex-wrap items-center justify-between gap-4",
        className
      )}
      aria-label={t("pagination.label")}
    >
      <div className="flex items-center gap-3">
        <p className="text-small-1 text-muted-foreground">{rangeLabel}</p>
        <Select
          items={sizeItems}
          value={String(limit)}
          onValueChange={(value) => {
            if (value) {
              setLimit(Number(value))
            }
          }}
          disabled={isDisabled}
        >
          <SelectTrigger
            size="sm"
            aria-label={t("pagination.page_size")}
            className="h-8 w-[4.5rem] min-w-0 rounded-lg border-border bg-surface px-3 text-[13px] font-medium text-foreground shadow-none data-[size=sm]:h-8 data-popup-open:border-border [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:text-muted-foreground"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            {sizeItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {totalPages > 0 ? (
        <div className="flex items-center gap-1.5">
          {canGoPrevious ? (
            <Link
              to={hrefFor(page - 1)}
              className={pageControlClassName()}
              aria-label={t("pagination.previous")}
            >
              <ChevronLeftIcon className="size-4" />
            </Link>
          ) : (
            <span
              className={cn(pageControlClassName(), "pointer-events-none text-grey")}
              aria-hidden
            >
              <ChevronLeftIcon className="size-4" />
            </span>
          )}

          {pages.map((item, index) => {
            if (item === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="flex size-8 items-center justify-center text-small-1 font-medium text-grey"
                >
                  …
                </span>
              )
            }

            const isActive = item === page

            return (
              <Link
                key={item}
                to={hrefFor(item)}
                aria-label={t("pagination.page", { page: item })}
                aria-current={isActive ? "page" : undefined}
                className={pageControlClassName(isActive)}
              >
                {item}
              </Link>
            )
          })}

          {canGoNext ? (
            <Link
              to={hrefFor(page + 1)}
              className={pageControlClassName()}
              aria-label={t("pagination.next")}
            >
              <ChevronRightIcon className="size-4" />
            </Link>
          ) : (
            <span
              className={cn(pageControlClassName(), "pointer-events-none text-grey")}
              aria-hidden
            >
              <ChevronRightIcon className="size-4" />
            </span>
          )}
        </div>
      ) : null}
    </nav>
  )
}
