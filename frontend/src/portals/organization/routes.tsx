import type { RouteObject } from "react-router"

import {
  AccountPage,
  BranchCreatePage,
  BranchDetailPage,
  BranchEditPage,
  DepartmentDetailPage,
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
  { path: "branches", element: <HomePage /> },
  { path: "branches/new", element: <BranchCreatePage /> },
  { path: "branches/:id/edit", element: <BranchEditPage /> },
  { path: "branches/:id", element: <BranchDetailPage /> },
  { path: "departments", element: <DepartmentListPage /> },
  { path: "departments/new", element: <DepartmentFormPage /> },
  { path: "departments/:id/edit", element: <DepartmentFormPage /> },
  { path: "departments/:id", element: <DepartmentDetailPage /> },
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
