import React, { useState } from 'react';
import './ShipmentForm.css';

interface ShipmentFormProps {
  onAddShipment: (id: string) => void;
}

const ShipmentForm: React.FC<ShipmentFormProps> = ({ onAddShipment }) => {
  const [shipmentId, setShipmentId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shipmentId.trim()) return;
    onAddShipment(shipmentId.trim());
    setShipmentId('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShipmentId(e.target.value);
  };

  return (
    <form className="shipment-form" onSubmit={handleSubmit}>
      <h3>Create Shipment</h3>
      <div className="form-group">
        <input
          type="text"
          placeholder="Enter Shipment ID..."
          value={shipmentId}
          onChange={handleInputChange}
          className="form-input"
          required
        />
        <button type="submit" className="form-submit-btn">
          Create
        </button>
      </div>
    </form>
  );
};

export default ShipmentForm;
