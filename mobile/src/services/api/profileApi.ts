import { apiClient } from './client';
import { MobileUserProfile, MobileShiftResponse } from './types';

export const profileApi = {
  getProfile: async (): Promise<MobileUserProfile> => {
    return apiClient.get<MobileUserProfile>('/workspace/mobile/profile');
  },

  getShift: async (): Promise<MobileShiftResponse> => {
    return apiClient.get<MobileShiftResponse>('/workspace/mobile/shift');
  },
};
