import api from './api';

export interface OrdersSummary {
  ordersByStatus: { status: string; count: number }[];
  onTimeDeliveries: number;
  delayedDeliveries: number;
}

export interface DriverPerformance {
  name: string;
  count: number;
}

export const getOrdersSummary = async (driverId?: number, startDate?: string, endDate?: string): Promise<OrdersSummary> => {
  const params = new URLSearchParams();
  if (driverId) params.append('driverId', driverId.toString());
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const response = await api.get<OrdersSummary>(`/reports/orders-summary?${params.toString()}`);
  return response.data;
};

export const getDriverPerformance = async (driverId?: number): Promise<DriverPerformance[]> => {
  const params = driverId ? `?driverId=${driverId}` : '';
  const response = await api.get<DriverPerformance[]>(`/reports/driver-performance${params}`);
  return response.data;
};

export const getRouteEfficiency = async (startDate?: string, endDate?: string): Promise<{ district: string; orderCount: number }[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const response = await api.get(`/reports/route-efficiency?${params.toString()}`);
  return response.data;
};
