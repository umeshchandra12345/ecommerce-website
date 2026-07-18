export interface ShipmentEvent {
  id: string;
  created_at: string;
  location: number;
  status: string;
  description: string | null;
}

export interface Shipment {
  id: string;
  content: string;
  weight: number;
  destination: number;
  timeline: ShipmentEvent[];
  estimated_delivery?: string;
}
