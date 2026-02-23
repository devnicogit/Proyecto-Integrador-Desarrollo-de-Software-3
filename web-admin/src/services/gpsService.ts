import api from './api';

export interface VehicleGpsHistory {
  id: number;
  vehicleId: number;
  driverId: number;
  latitude: number;
  longitude: number;
  speedKmh: number;
  headingDegrees: number;
  pingTime: string;
}

export const getVehicleHistory = async (vehicleId: number): Promise<VehicleGpsHistory[]> => {
  const response = await api.get(`/gps/history/${vehicleId}`);
  return response.data;
};

export const pingGps = async (data: Omit<VehicleGpsHistory, 'id' | 'pingTime'>): Promise<VehicleGpsHistory> => {
  const response = await api.post('/gps/ping', data);
  return response.data;
};
