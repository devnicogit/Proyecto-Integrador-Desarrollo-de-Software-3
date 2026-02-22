import api from './api';

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface FleetSummary {
  availableDrivers: number;
  totalActiveDrivers: number;
  availableVehicles: number;
  totalActiveVehicles: number;
  maintenanceVehicles: number;
}

export const getDashboardStats = async (): Promise<OrderStatusCount[]> => {
  const response = await api.get<OrderStatusCount[]>('/dashboard/orders-by-status');
  return response.data;
};

export const getFleetSummary = async (): Promise<FleetSummary> => {
  const [drivers, vehicles, routes] = await Promise.all([
    api.get('/drivers'),
    api.get('/vehicles'),
    api.get('/routes')
  ]);
  
  const today = new Date().toISOString().split('T')[0];
  const activeDrivers = (drivers.data as any[]).filter(d => d.isActive);
  const activeVehicles = (vehicles.data as any[]).filter(v => v.isActive);
  
  // Busy = Route today and not finished/cancelled
  const busyRoutes = (routes.data as any[]).filter(r => 
    r.routeDate === today && r.status !== 'COMPLETED' && r.status !== 'CANCELLED'
  );

  const busyDriverIds = busyRoutes.map(r => r.driverId);
  const busyVehicleIds = busyRoutes.map(r => r.vehicleId);

  return {
    availableDrivers: activeDrivers.filter(d => !busyDriverIds.includes(d.id)).length,
    totalActiveDrivers: activeDrivers.length,
    availableVehicles: activeVehicles.filter(v => !busyVehicleIds.includes(v.id)).length,
    totalActiveVehicles: activeVehicles.length,
    maintenanceVehicles: (vehicles.data as any[]).filter(v => !v.isActive).length
  };
};
