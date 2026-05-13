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

// ============================================================
// KPIs de Tesis: IID, CHR, TDE
// ============================================================

export type KpiCode = 'iid' | 'chr' | 'tde';

export interface KpiRow {
  index: number;
  date: string;        // ISO LocalDate
  total: number;
  valid: number;
  percentage: number;
}

export interface KpiResponse {
  indicator: 'IID' | 'CHR' | 'TDE';
  indicatorName: string;
  startDate: string;
  endDate: string;
  rows: KpiRow[];
  totals: { total: number; valid: number; percentage: number };
}

export const getKpi = async (code: KpiCode, startDate: string, endDate: string): Promise<KpiResponse> => {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await api.get<KpiResponse>(`/reports/kpi/${code}?${params.toString()}`);
  return response.data;
};

export const downloadKpiFicha = async (
  code: KpiCode,
  startDate: string,
  endDate: string,
  format: 'csv' | 'pdf',
  testType: 'Pre-Test' | 'Post-Test' = 'Post-Test'
): Promise<void> => {
  const params = new URLSearchParams({ startDate, endDate, testType });
  const response = await api.get(`/reports/kpi/${code}/${format}?${params.toString()}`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ficha_${code}_${testType.toLowerCase()}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
