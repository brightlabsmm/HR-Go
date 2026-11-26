import {
  columnVisibilityFeature,
  createTableHook,
  metaHelper,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table"

import type { ColumnFilterOp } from "@/util/column-filter"

export type DataTableFilterValueType = "text" | "select"

export interface DataTableFilterOption {
  value: string
  label: string
}

export interface DataTableColumnFilterMeta {
  /** API field name for filter=field:op:value */
  field: string
  valueType?: DataTableFilterValueType
  ops?: ColumnFilterOp[]
  defaultOp?: ColumnFilterOp
  options?: DataTableFilterOption[]
  placeholder?: string
}

export interface DataTableColumnMeta {
  align?: "start" | "end"
  headerClassName?: string
  cellClassName?: string
  hideBelow?: "sm" | "md" | "lg"
  filter?: DataTableColumnFilterMeta
}

const features = tableFeatures({
  columnMeta: metaHelper<DataTableColumnMeta>(),
  rowSortingFeature,
  columnVisibilityFeature,
})

export const {
  createAppColumnHelper: createDataTableColumns,
  useAppTable: useDataTable,
  useTableContext: useDataTableContext,
} = createTableHook({
  features,
})

export { features as dataTableFeatures }
