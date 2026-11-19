import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios"

import { APP_CONFIG } from "@/app/config/app.config"
import { API_ERROR_CODES } from "@/app/api/codes"
import { portalAuthPath } from "@/app/api/paths"
import { ApiError, isApiFailure } from "@/app/api/types"
import { useAuthStore } from "@/shared/stores/auth.store"

const LOGIN_PATH = portalAuthPath("/login")

export const apiClient = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  paramsSerializer: {
    indexes: null,
  },
})

function isLoginRequest(url: string | undefined) {
  return Boolean(url?.includes(LOGIN_PATH))
}

function toApiError(error: AxiosError) {
  const status = error.response?.status ?? 0
  const payload = error.response?.data

  if (isApiFailure(payload)) {
    const details = (payload.error.details ?? []).map((detail) => ({
      field: detail.field,
      message: detail.message,
    }))

    return new ApiError({
      status,
      code: payload.error.code,
      message: payload.error.message,
      details,
      traceId: payload.error.traceId,
    })
  }

  if (!error.response) {
    return new ApiError({
      status: 0,
      code: API_ERROR_CODES.NETWORK_ERROR,
      message: error.message || "Network Error",
    })
  }

  return new ApiError({
    status: status || 500,
    code: API_ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: error.message || "Something went wrong.",
  })
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = useAuthStore.getState().accessToken
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError = toApiError(error)

    if (apiError.status === 401 && !isLoginRequest(error.config?.url)) {
      useAuthStore.getState().clearAuth()
    }

    return Promise.reject(apiError)
  }
)
