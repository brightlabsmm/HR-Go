import type { RouteObject } from "react-router"

import {
  AccountPage,
  OrganizationCreateAdminPage,
  OrganizationCreatePage,
  OrganizationDetailPage,
  OrganizationEditPage,
  OrganizationListPage,
  RoleDetailPage,
  RoleListPage,
  UserCreatePage,
  UserDetailPage,
  UserEditPage,
  UserListPage,
} from "@/constants/lazyload"

export const platformRoutes: RouteObject[] = [
  { index: true, element: <OrganizationListPage /> },
  { path: "organizations/new", element: <OrganizationCreatePage /> },
  { path: "organizations/:id/create-admin", element: <OrganizationCreateAdminPage /> },
  { path: "organizations/:id/edit", element: <OrganizationEditPage /> },
  { path: "organizations/:id", element: <OrganizationDetailPage /> },
  { path: "users", element: <UserListPage /> },
  { path: "users/new", element: <UserCreatePage /> },
  { path: "users/:id/edit", element: <UserEditPage /> },
  { path: "users/:id", element: <UserDetailPage /> },
  { path: "roles/:id", element: <RoleDetailPage /> },
  { path: "roles", element: <RoleListPage /> },
  { path: "account", element: <AccountPage /> },
]
