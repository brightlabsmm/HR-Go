import {
  createTableHook,
  metaHelper,
  tableFeatures,
} from "@tanstack/react-table"

export interface DataTableColumnMeta {
  align?: "start" | "end"
  headerClassName?: string
  cellClassName?: string
}

const features = tableFeatures({
  columnMeta: metaHelper<DataTableColumnMeta>(),
})

export const {
  createAppColumnHelper: createDataTableColumns,
  useAppTable: useDataTable,
} = createTableHook({
  features,
})

export { features as dataTableFeatures }
