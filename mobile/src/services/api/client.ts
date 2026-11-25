import { API_CONFIG } from './config';
import { ApiErrorResponse } from './types';

export class ApiError extends Error {
  status: number;
  code: string;
  details?: { field?: string; message: string }[];
  traceId?: string;

  constructor(status: number, code: string, message: string, details?: { field?: string; message: string }[], traceId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.traceId = traceId;
  }
}

class ApiClient {
  private token: string | null = null;
  private onUnauthorizedCallback?: () => void;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  setOnUnauthorized(cb: () => void) {
    this.onUnauthorizedCallback = cb;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_CONFIG.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (response.status === 204) {
        return {} as T;
      }

      if (!response.ok) {
        if (response.status === 401 && this.onUnauthorizedCallback) {
          this.onUnauthorizedCallback();
        }

        if (isJson) {
          const errPayload: ApiErrorResponse = await response.json();
          if (errPayload && errPayload.error) {
            throw new ApiError(
              response.status,
              errPayload.error.code || 'ERROR',
              errPayload.error.message || `Request failed with status ${response.status}`,
              errPayload.error.details,
              errPayload.error.traceId
            );
          }
        }

        const text = await response.text();
        throw new ApiError(
          response.status,
          'HTTP_ERROR',
          text || `Request failed with status ${response.status}`
        );
      }

      if (isJson) {
        return (await response.json()) as T;
      }

      return (await response.text()) as unknown as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err instanceof ApiError) {
        throw err;
      }
      if (err.name === 'AbortError') {
        throw new ApiError(0, 'TIMEOUT', 'Network request timed out. Please check your connection.');
      }
      throw new ApiError(0, 'NETWORK_ERROR', err.message || 'Unable to connect to server.');
    }
  }

  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  del<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();
