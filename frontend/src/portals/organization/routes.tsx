import type { RouteObject } from "react-router"

import {
  AccountPage,
  BranchCreatePage,
  BranchEditPage,
  DepartmentFormPage,
  DepartmentListPage,
  FormPreviewPage,
  HomePage,
  PositionFormPage,
  PositionListPage,
  RoleDetailPage,
  RoleOverviewPage,
} from "@/constants/lazyload"

export const organizationRoutes: RouteObject[] = [
  { index: true, element: <HomePage /> },
  { path: "branches/new", element: <BranchCreatePage /> },
  { path: "branches/:id/edit", element: <BranchEditPage /> },
  { path: "departments", element: <DepartmentListPage /> },
  { path: "departments/new", element: <DepartmentFormPage /> },
  { path: "departments/:id/edit", element: <DepartmentFormPage /> },
  { path: "positions", element: <PositionListPage /> },
  { path: "positions/new", element: <PositionFormPage /> },
  { path: "positions/:id/edit", element: <PositionFormPage /> },
  { path: "roles/:id", element: <RoleDetailPage /> },
  { path: "roles", element: <RoleOverviewPage /> },
  { path: "account", element: <AccountPage /> },
  ...(import.meta.env.DEV
    ? [{ path: "form-preview", element: <FormPreviewPage /> }]
    : []),
]
