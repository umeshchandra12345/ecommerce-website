import { Api } from '../client';
import type { ShipmentRead } from '../client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : '/api');
const api = new Api({ baseURL: API_BASE_URL });

export const getShipment = async (id: string, token?: string): Promise<ShipmentRead> => {
  const response = await api.shipment.getShipment(
    { id },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );
  return response.data;
};
