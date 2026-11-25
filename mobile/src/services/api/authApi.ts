import { apiClient } from './client';
import {
  MobileLoginRequest,
  MobileLoginResponse,
  MobileChangePasswordRequest,
} from './types';

export const authApi = {
  login: async (req: MobileLoginRequest): Promise<MobileLoginResponse> => {
    return apiClient.post<MobileLoginResponse>('/workspace/mobile/auth/login', req);
  },

  changePassword: async (req: MobileChangePasswordRequest): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/workspace/mobile/change-password', req);
  },
};
