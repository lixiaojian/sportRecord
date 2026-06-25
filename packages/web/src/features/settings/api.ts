import { api } from '../../lib/api';
import type { ChangePasswordInput, UpdateProfileInput, UserProfile } from '@sport-record/shared';

export const usersApi = {
  updateMe: (body: UpdateProfileInput) => api.patch<UserProfile>('/users/me', body),
  changePassword: (body: ChangePasswordInput) => api.patch<null>('/users/me/password', body),
};
