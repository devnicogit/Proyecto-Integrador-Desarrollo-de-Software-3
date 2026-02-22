import api from './api';

export const OrderStatus = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  RETURNED: 'RETURNED',
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export interface Order {
  id: number;
  trackingNumber: string;
  externalReference: string;
  routeId: number;
  status: OrderStatus;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryDistrict: string;
  latitude: number;
  longitude: number;
  priority: number;
  createdAt: string;
}

export const getAllOrders = async (): Promise<Order[]> => {
  const response = await api.get<Order[]>('/orders');
  return response.data;
};

export const createOrder = async (order: Partial<Order>): Promise<Order> => {
  const response = await api.post<Order>('/orders', order);
  return response.data;
};

export const getOrderById = async (id: number): Promise<Order> => {
  const response = await api.get<Order>(`/orders/${id}`);
  return response.data;
};

export const deleteOrder = async (id: number): Promise<void> => {
  await api.delete(`/orders/${id}`);
};

export const updateOrderStatus = async (id: number, status: string, reason: string): Promise<Order> => {
  const response = await api.patch<Order>(`/orders/${id}/status`, { status, reason });
  return response.data;
};
