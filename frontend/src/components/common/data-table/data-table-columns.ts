import {
  columnVisibilityFeature,
  createTableHook,
  metaHelper,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table"

export interface DataTableColumnMeta {
  align?: "start" | "end"
  headerClassName?: string
  cellClassName?: string
  hideBelow?: "sm" | "md" | "lg"
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
