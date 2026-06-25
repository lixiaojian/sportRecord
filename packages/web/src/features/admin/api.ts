import { api } from '../../lib/api';
import type { PaginatedData, UpdateUserByAdminInput, UserProfile } from '@sport-record/shared';

/** admin 视角用户（含 role / disabled，仍不含密码） */
export interface AdminUser extends UserProfile {
  role: 'user' | 'admin';
  disabled: boolean;
  updatedAt: string;
}

export interface AdminUserListParams {
  page?: number;
  pageSize?: number;
}

export const adminUsersApi = {
  list: (params: AdminUserListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.pageSize) qs.set('pageSize', String(params.pageSize));
    const s = qs.toString();
    return api.get<PaginatedData<AdminUser>>(`/users${s ? `?${s}` : ''}`);
  },
  update: (id: string, body: UpdateUserByAdminInput) => api.patch<AdminUser>(`/users/${id}`, body),
};
