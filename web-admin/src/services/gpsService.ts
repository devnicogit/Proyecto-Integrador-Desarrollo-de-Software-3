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

export interface GpsWebSocketMessage {
  vehicleId: number;
  latitude: number;
  longitude: number;
  speedKmh: number;
  timestamp: number;
}

export const connectGpsWebSocket = (
  vehicleId: number,
  onMessage: (data: GpsWebSocketMessage) => void
): WebSocket => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = import.meta.env.VITE_WS_HOST || 'localhost:8081';
  const ws = new WebSocket(`${protocol}//${host}/ws/gps`);

  ws.onopen = () => {
    ws.send(vehicleId.toString());
  };

  ws.onmessage = (event) => {
    try {
      const data: GpsWebSocketMessage = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('GPS WebSocket parse error:', e);
    }
  };

  ws.onerror = (error) => {
    console.error('GPS WebSocket error:', error);
  };

  return ws;
};
