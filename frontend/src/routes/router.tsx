import { createBrowserRouter } from "react-router"

import { APP_CONFIG } from "@/app/config/app.config"
import { AppLayout } from "@/components/layouts/app-layout"
import { AuthLayout } from "@/components/layouts/auth-layout"
import { LoginPage } from "@/constants/lazyload"
import { organizationRoutes } from "@/portals/organization/routes"
import { platformRoutes } from "@/portals/platform/routes"

import { NotFoundPage } from "./not-found-page"
import { RootLayout } from "./root-layout"
import { RouteErrorBoundary } from "./route-error-boundary"

const portalRoutes =
  APP_CONFIG.portal === "platform" ? platformRoutes : organizationRoutes

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "login", element: <LoginPage /> },
        ],
      },
      {
        element: <AppLayout />,
        children: [...portalRoutes, { path: "*", element: <NotFoundPage /> }],
      },
    ],
  },
])
