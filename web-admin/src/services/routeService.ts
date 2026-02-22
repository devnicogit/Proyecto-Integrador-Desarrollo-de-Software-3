import api from './api';

export const RouteStatus = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type RouteStatus = typeof RouteStatus[keyof typeof RouteStatus];

export interface Route {
  id: number;
  driverId: number;
  vehicleId: number;
  routeDate: string;
  status: RouteStatus;
  estimatedStartTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  totalDistanceKm: number;
  createdAt: string;
}

export const getAllRoutes = async (): Promise<Route[]> => {
  const response = await api.get<Route[]>('/routes');
  return response.data;
};

export const createRoute = async (route: Partial<Route>): Promise<Route> => {
  const response = await api.post<Route>('/routes', route);
  return response.data;
};

export const updateRouteStatus = async (id: number, status: RouteStatus): Promise<Route> => {
  const response = await api.patch<Route>(`/routes/${id}/status?status=${status}`);
  return response.data;
};
