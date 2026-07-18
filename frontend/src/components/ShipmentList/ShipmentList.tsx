import React from 'react';
import type { Shipment } from '../../types/shipment';
import ShipmentCard from '../ShipmentCard/ShipmentCard';
import ShipmentForm from '../ShipmentForm/ShipmentForm';
import './ShipmentList.css';

interface ShipmentListProps {
  shipments: Shipment[];
  selectedId: string | null;
  onSelectShipment: (id: string) => void;
  onAddShipment: (id: string) => void;
}

const ShipmentList: React.FC<ShipmentListProps> = ({
  shipments,
  selectedId,
  onSelectShipment,
  onAddShipment,
}) => {
  return (
    <div className="shipment-list-container">
      <ShipmentForm onAddShipment={onAddShipment} />
      <div className="list-header">
        <h2>Active Shipments</h2>
        <span className="badge">{shipments.length} items</span>
      </div>
      <div className="shipment-list">
        {shipments.map((shipment) => (
          <ShipmentCard
            key={shipment.id}
            shipment={shipment}
            isSelected={shipment.id === selectedId}
            onSelect={onSelectShipment}
          />
        ))}
      </div>
    </div>
  );
};

export default ShipmentList;
