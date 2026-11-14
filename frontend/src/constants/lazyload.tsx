import { RouteFallback } from "@/components/common/route-fallback"
import { pageLoader } from "@/components/core/page-loader"

export const LoginPage = pageLoader(
  () => import("@/features/auth/pages/login-page"),
  "LoginPage",
  <RouteFallback />
)

export const AccountPage = pageLoader(
  () => import("@/features/account/pages/account-page"),
  "AccountPage"
)

export const HomePage = pageLoader(
  () => import("@/features/home/pages/home-page"),
  "HomePage"
)
export const BranchCreatePage = pageLoader(
  () => import("@/features/branches/pages/branch-create-page"),
  "BranchCreatePage"
)
export const BranchEditPage = pageLoader(
  () => import("@/features/branches/pages/branch-edit-page"),
  "BranchEditPage"
)
export const DepartmentListPage = pageLoader(
  () => import("@/features/departments/pages/department-list-page"),
  "DepartmentListPage"
)
export const DepartmentFormPage = pageLoader(
  () => import("@/features/departments/pages/department-form-page"),
  "DepartmentFormPage"
)
export const PositionListPage = pageLoader(
  () => import("@/features/positions/pages/position-list-page"),
  "PositionListPage"
)
export const PositionFormPage = pageLoader(
  () => import("@/features/positions/pages/position-form-page"),
  "PositionFormPage"
)
export const RoleOverviewPage = pageLoader(
  () => import("@/features/roles/pages/role-overview-page"),
  "RoleOverviewPage"
)
export const FormPreviewPage = pageLoader(
  () => import("@/features/home/pages/form-preview-page"),
  "FormPreviewPage"
)

export const OrganizationListPage = pageLoader(
  () => import("@/features/organizations/pages/organization-list-page"),
  "OrganizationListPage"
)
export const OrganizationCreatePage = pageLoader(
  () => import("@/features/organizations/pages/organization-create-page"),
  "OrganizationCreatePage"
)
export const OrganizationDetailPage = pageLoader(
  () => import("@/features/organizations/pages/organization-detail-page"),
  "OrganizationDetailPage"
)
export const RoleListPage = pageLoader(
  () => import("@/features/roles/pages/role-list-page"),
  "RoleListPage"
)
export const UserListPage = pageLoader(
  () => import("@/features/users/pages/user-list-page"),
  "UserListPage"
)
export const UserCreatePage = pageLoader(
  () => import("@/features/users/pages/user-create-page"),
  "UserCreatePage"
)
export const UserDetailPage = pageLoader(
  () => import("@/features/users/pages/user-detail-page"),
  "UserDetailPage"
)
