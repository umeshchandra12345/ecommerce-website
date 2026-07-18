import React from 'react';
import type { Shipment } from '../../types/shipment';
import './ShipmentCard.css';

interface ShipmentCardProps {
  shipment: Shipment;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const ShipmentCard: React.FC<ShipmentCardProps> = ({
  shipment,
  isSelected,
  onSelect,
}) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Placed':
        return 'status-placed';
      case 'In Transit':
        return 'status-transit';
      case 'Delivered':
        return 'status-delivered';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  return (
    <div
      className={`shipment-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(shipment.id)}
    >
      <div className="card-header">
        <span className="shipment-id">ID: {shipment.id.substring(0, 8)}...</span>
        <span className={`status-badge ${getStatusClass(shipment.status)}`}>
          {shipment.status}
        </span>
      </div>
      <div className="card-body">
        <h3 className="shipment-title">{shipment.content}</h3>
        <div className="shipment-meta">
          <span>⚖️ {shipment.weight} kg</span>
          <span>📍 {shipment.destination}</span>
        </div>
      </div>
    </div>
  );
};

export default ShipmentCard;
