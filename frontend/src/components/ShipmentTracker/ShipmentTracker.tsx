import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getShipment } from '../../services/shipment';
import { ShipmentCard } from '../../Card';
import { AxiosError } from 'axios';
import './ShipmentTracker.css';

const DEFAULT_SHIPMENT_ID = 'f7b5a19a-9e12-4c5c-89b2-3c1d9b7f5e1a';

const ShipmentTracker: React.FC = () => {
  const [inputId, setInputId] = useState<string>(DEFAULT_SHIPMENT_ID);
  const [shipmentId, setShipmentId] = useState<string>(DEFAULT_SHIPMENT_ID);
  const [token, setToken] = useState<string>('');

  const { data: shipment, isLoading, error } = useQuery({
    queryKey: ['shipment', shipmentId, token],
    queryFn: () => getShipment(shipmentId, token.trim() || undefined),
    retry: false,
    enabled: !!shipmentId.trim(),
  });

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShipmentId(inputId);
  };

  // Convert error to AxiosError/API error to print status or details
  const axiosError = error as AxiosError<{ detail?: string }> | null;
  const errorMessage =
    axiosError?.response?.data?.detail ||
    axiosError?.message ||
    (error ? 'Failed to fetch shipment' : null);

  return (
    <div className="shipment-tracker">
      <h2>Live API Shipment Tracker (React Query)</h2>
      <form onSubmit={handleTrackSubmit} className="tracker-form">
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter Shipment UUID..."
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            required
            className="tracker-input"
          />
          <input
            type="text"
            placeholder="Auth Token (Optional)..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="tracker-input token-input"
          />
          <button type="submit" className="tracker-btn">Track</button>
        </div>
      </form>

      {isLoading && <div className="loading-message">⏳ Loading shipment details...</div>}
      
      {error && (
        <div className="error-message">
          ⚠️ Error {axiosError?.response?.status || ''}: {errorMessage}
        </div>
      )}

      {shipment && !isLoading && !error && (
        <div className="tracker-result">
          <h3>API Response Result:</h3>
          <ShipmentCard shipment={shipment} />
        </div>
      )}
    </div>
  );
};

export default ShipmentTracker;
