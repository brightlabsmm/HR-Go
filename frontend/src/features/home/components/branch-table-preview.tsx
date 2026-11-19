import { useMemo, useState } from "react"

import {
  createDataTableColumns,
  DataTable,
  DataTableActions,
} from "@/components/common/data-table"
import { SearchBox } from "@/components/common/search-box"
import { StatusBadge } from "@/components/common/status-badge"

interface PreviewBranch {
  id: string
  code: string
  name: string
  city: string
  stateRegion: string
  phone: string
  headquarters: string
  status: "active" | "inactive"
}

const column = createDataTableColumns<PreviewBranch>()

const INITIAL_BRANCHES: PreviewBranch[] = [
  {
    id: "1",
    code: "BR-001",
    name: "Yangon Branch",
    city: "Yangon",
    stateRegion: "Yangon Region",
    phone: "+959 261 651 159",
    headquarters: "+959 261 651 159",
    status: "active",
  },
  {
    id: "2",
    code: "BR-001",
    name: "Yangon Branch",
    city: "Yangon",
    stateRegion: "Yangon Region",
    phone: "+959 261 651 159",
    headquarters: "+959 261 651 159",
    status: "inactive",
  },
  {
    id: "3",
    code: "BR-001",
    name: "Yangon Branch",
    city: "Yangon",
    stateRegion: "Yangon Region",
    phone: "+959 261 651 159",
    headquarters: "+959 261 651 159",
    status: "active",
  },
  {
    id: "4",
    code: "BR-001",
    name: "Yangon Branch",
    city: "Yangon",
    stateRegion: "Yangon Region",
    phone: "+959 261 651 159",
    headquarters: "+959 261 651 159",
    status: "inactive",
  },
  {
    id: "5",
    code: "BR-001",
    name: "Yangon Branch",
    city: "Yangon",
    stateRegion: "Yangon Region",
    phone: "+959 261 651 159",
    headquarters: "+959 261 651 159",
    status: "active",
  },
  {
    id: "6",
    code: "BR-002",
    name: "Mandalay Branch",
    city: "Mandalay",
    stateRegion: "Mandalay Region",
    phone: "+959 261 651 160",
    headquarters: "+959 261 651 160",
    status: "active",
  },
]

export function BranchTablePreview() {
  const [query, setQuery] = useState("")
  const [branches, setBranches] = useState(INITIAL_BRANCHES)
  const normalizedQuery = query.trim().toLowerCase()
  const visibleBranches = branches.filter((branch) => {
    if (normalizedQuery === "") {
      return true
    }

    return (
      branch.code.toLowerCase().includes(normalizedQuery) ||
      branch.name.toLowerCase().includes(normalizedQuery)
    )
  })

  const columns = useMemo(
    () =>
      column.columns([
        column.accessor("code", { header: "Code" }),
        column.accessor("name", { header: "Branch Name" }),
        column.accessor("city", { header: "City" }),
        column.accessor("stateRegion", { header: "State/Region" }),
        column.accessor("phone", { header: "Phone" }),
        column.accessor("headquarters", { header: "Headquarters" }),
        column.accessor("status", {
          header: "Status",
          cell: ({ getValue }) => <StatusBadge status={getValue()} />,
        }),
        column.display({
          id: "actions",
          header: "Actions",
          meta: { align: "end" },
          cell: ({ row }) => (
            <DataTableActions
              onEdit={() => undefined}
              onDelete={() =>
                setBranches((current) =>
                  current.filter((branch) => branch.id !== row.original.id)
                )
              }
            />
          ),
        }),
      ]),
    []
  )

  return (
    <div className="flex flex-col gap-4">
      <SearchBox
        value={query}
        onValueChange={setQuery}
        placeholder="Search by code or branch name"
        className="max-w-md"
      />
      <DataTable
        tableId="branches-preview"
        columns={columns}
        data={visibleBranches}
        getRowId={(branch) => branch.id}
        label="Branches"
        enableColumnVisibility={false}
      />
    </div>
  )
}
