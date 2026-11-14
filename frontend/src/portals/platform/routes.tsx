import type { RouteObject } from "react-router"

import {
  AccountPage,
  OrganizationCreatePage,
  OrganizationDetailPage,
  OrganizationListPage,
  RoleListPage,
  UserCreatePage,
  UserDetailPage,
  UserListPage,
} from "@/constants/lazyload"

export const platformRoutes: RouteObject[] = [
  { index: true, element: <OrganizationListPage /> },
  { path: "organizations/new", element: <OrganizationCreatePage /> },
  { path: "organizations/:id", element: <OrganizationDetailPage /> },
  { path: "users", element: <UserListPage /> },
  { path: "users/new", element: <UserCreatePage /> },
  { path: "users/:id", element: <UserDetailPage /> },
  { path: "roles", element: <RoleListPage /> },
  { path: "account", element: <AccountPage /> },
]
