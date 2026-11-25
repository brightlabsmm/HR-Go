import { RouteFallback } from "@/components/common/route-fallback"
import { pageLoader } from "@/components/core/page-loader"

export const LoginPage = pageLoader(
  () => import("@/features/auth/pages/login-page"),
  "LoginPage",
  <RouteFallback />
)

export const ChangePasswordPage = pageLoader(
  () => import("@/features/auth/pages/change-password-page"),
  "ChangePasswordPage",
  <RouteFallback />
)

export const AccountPage = pageLoader(
  () => import("@/features/account/pages/account-page"),
  "AccountPage"
)

export const OrganizationSettingsPage = pageLoader(
  () => import("@/features/organization-settings/pages/organization-settings-page"),
  "OrganizationSettingsPage"
)

export const HomePage = pageLoader(
  () => import("@/features/home/pages/home-page"),
  "HomePage"
)
export const BranchCreatePage = pageLoader(
  () => import("@/features/branches/pages/branch-create-page"),
  "BranchCreatePage"
)
export const BranchDetailPage = pageLoader(
  () => import("@/features/branches/pages/branch-detail-page"),
  "BranchDetailPage"
)
export const BranchEditPage = pageLoader(
  () => import("@/features/branches/pages/branch-edit-page"),
  "BranchEditPage"
)
export const DepartmentListPage = pageLoader(
  () => import("@/features/departments/pages/department-list-page"),
  "DepartmentListPage"
)
export const DepartmentDetailPage = pageLoader(
  () => import("@/features/departments/pages/department-detail-page"),
  "DepartmentDetailPage"
)
export const DepartmentFormPage = pageLoader(
  () => import("@/features/departments/pages/department-form-page"),
  "DepartmentFormPage"
)
export const PositionListPage = pageLoader(
  () => import("@/features/positions/pages/position-list-page"),
  "PositionListPage"
)
export const PositionDetailPage = pageLoader(
  () => import("@/features/positions/pages/position-detail-page"),
  "PositionDetailPage"
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
export const OrganizationCreateAdminPage = pageLoader(
  () => import("@/features/organizations/pages/organization-create-admin-page"),
  "OrganizationCreateAdminPage"
)
export const OrganizationEditPage = pageLoader(
  () => import("@/features/organizations/pages/organization-edit-page"),
  "OrganizationEditPage"
)
export const RoleListPage = pageLoader(
  () => import("@/features/roles/pages/role-list-page"),
  "RoleListPage"
)
export const RoleDetailPage = pageLoader(
  () => import("@/features/roles/pages/role-detail-page"),
  "RoleDetailPage"
)
export const PermissionListPage = pageLoader(
  () => import("@/features/roles/pages/permission-list-page"),
  "PermissionListPage"
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
export const UserEditPage = pageLoader(
  () => import("@/features/users/pages/user-edit-page"),
  "UserEditPage"
)

export const EmployeeListPage = pageLoader(
  () => import("@/features/employees/pages/employee-list-page"),
  "EmployeeListPage"
)
export const EmployeeCreatePage = pageLoader(
  () => import("@/features/employees/pages/employee-form-page"),
  "EmployeeFormPage"
)
export const EmployeeDetailPage = pageLoader(
  () => import("@/features/employees/pages/employee-detail-page"),
  "EmployeeDetailPage"
)
export const EmployeeEditPage = pageLoader(
  () => import("@/features/employees/pages/employee-form-page"),
  "EmployeeFormPage"
)

export const ShiftListPage = pageLoader(
  () => import("@/features/shifts/pages/shift-list-page"),
  "ShiftListPage"
)
export const ShiftCreatePage = pageLoader(
  () => import("@/features/shifts/pages/shift-form-page"),
  "ShiftFormPage"
)
export const ShiftEditPage = pageLoader(
  () => import("@/features/shifts/pages/shift-form-page"),
  "ShiftFormPage"
)

export const HolidayListPage = pageLoader(
  () => import("@/features/holidays/pages/holiday-list-page"),
  "HolidayListPage"
)
export const HolidayCreatePage = pageLoader(
  () => import("@/features/holidays/pages/holiday-form-page"),
  "HolidayFormPage"
)
export const HolidayEditPage = pageLoader(
  () => import("@/features/holidays/pages/holiday-form-page"),
  "HolidayFormPage"
)

export const AttendanceListPage = pageLoader(
  () => import("@/features/attendance/pages/attendance-list-page"),
  "AttendanceListPage"
)
