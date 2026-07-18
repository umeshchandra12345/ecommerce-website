import React from 'react';
import type { Shipment, ShipmentStatus } from '../../types/shipment';
import './ShipmentDetail.css';

interface ShipmentDetailProps {
  shipment: Shipment | null;
  onUpdateStatus: (id: string, newStatus: ShipmentStatus) => void;
}

const ShipmentDetail: React.FC<ShipmentDetailProps> = ({
  shipment,
  onUpdateStatus,
}) => {
  if (!shipment) {
    return (
      <div className="shipment-detail-placeholder">
        <span className="box-icon">📦</span>
        <p>Select a shipment from the list to view its details and update status.</p>
      </div>
    );
  }

  const handleUpdateClick = () => {
    onUpdateStatus(shipment.id, 'In Transit');
  };

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
    <div className="shipment-detail">
      <div className="detail-header">
        <h2>Shipment Details</h2>
        <span className={`status-badge ${getStatusClass(shipment.status)}`}>
          {shipment.status}
        </span>
      </div>
      <div className="detail-content">
        <div className="detail-row">
          <span className="label">Shipment ID</span>
          <span className="value mono">{shipment.id}</span>
        </div>
        <div className="detail-row">
          <span className="label">Content</span>
          <span className="value">{shipment.content}</span>
        </div>
        <div className="detail-row">
          <span className="label">Weight</span>
          <span className="value">{shipment.weight} kg</span>
        </div>
        <div className="detail-row">
          <span className="label">Destination ZIP</span>
          <span className="value">{shipment.destination}</span>
        </div>
        <div className="detail-row">
          <span className="label">Client Email</span>
          <span className="value">{shipment.client_contact_email}</span>
        </div>
        {shipment.client_contact_phone && (
          <div className="detail-row">
            <span className="label">Client Phone</span>
            <span className="value">{shipment.client_contact_phone}</span>
          </div>
        )}
        <div className="detail-row">
          <span className="label">Created At</span>
          <span className="value">
            {new Date(shipment.created_at).toLocaleString()}
          </span>
        </div>
      </div>
      <div className="detail-actions">
        {shipment.status === 'Placed' ? (
          <button className="btn-update-status" onClick={handleUpdateClick}>
            Update Status to "In Transit"
          </button>
        ) : (
          <span className="status-note">
            🚀 Shipment is already {shipment.status.toLowerCase()}.
          </span>
        )}
      </div>
    </div>
  );
};

export default ShipmentDetail;
