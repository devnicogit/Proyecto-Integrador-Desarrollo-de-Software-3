import api from './api';

export interface UserRole {
  id: number;
  userExternalId: string;
  roleId: number;
}

export const getAllUsers = async (): Promise<UserRole[]> => {
  const response = await api.get<UserRole[]>('/users');
  return response.data;
};

export const assignRole = async (userExternalId: string, roleId: number): Promise<UserRole> => {
  const response = await api.post<UserRole>('/users', { userExternalId, roleId });
  return response.data;
};

export const removeRole = async (id: number): Promise<void> => {
  await api.delete(`/users/${id}`);
};
