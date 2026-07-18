export type ShipmentStatus = 'Placed' | 'In Transit' | 'Delivered' | 'Cancelled';

export interface Shipment {
  id: string;
  content: string;
  weight: number;
  destination: number;
  client_contact_email: string;
  client_contact_phone?: string;
  status: ShipmentStatus;
  created_at: string;
}
