import { useContext } from "react";
import { UserContext } from "./UserContext";

interface Shipment {
  id: string;
  status?: string;
  content?: string;
  weight?: number;
  destination?: number;
  timeline?: { status: string }[];
}

function ShipmentCard({ shipment }: { shipment: Shipment }) {
  const { username } = useContext(UserContext);

  // Extract and display the latest shipment status from the last item in the timeline array
  const latestStatus =
    shipment.timeline && shipment.timeline.length > 0
      ? shipment.timeline[shipment.timeline.length - 1].status
      : shipment.status || 'Placed';

  return (
    <div className="card">
      <h2>Status: {latestStatus}</h2>
      <p>Id #{shipment.id}</p>
      {shipment.content && <p>Content: {shipment.content}</p>}
      {shipment.weight !== undefined && <p>Weight: {shipment.weight} kg</p>}
      {shipment.destination !== undefined && <p>Destination: {shipment.destination}</p>}
      <p>Created by: {username || "-"}</p>
    </div>
  );
}

export { ShipmentCard, ShipmentCard as Card, type Shipment };
