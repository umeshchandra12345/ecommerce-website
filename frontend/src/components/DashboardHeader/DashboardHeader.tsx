import React from 'react';
import './DashboardHeader.css';

interface DashboardHeaderProps {
  totalCount: number;
  placedCount: number;
  inTransitCount: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  totalCount,
  placedCount,
  inTransitCount,
}) => {
  return (
    <header className="dashboard-header">
      <div className="brand">
        <span className="logo-icon">🚀</span>
        <h1>FastShip Dashboard</h1>
      </div>
      <div className="stats-container">
        <div className="stat-card">
          <span className="stat-label">Total Shipments</span>
          <span className="stat-value">{totalCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Placed</span>
          <span className="stat-value text-blue">{placedCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">In Transit</span>
          <span className="stat-value text-purple">{inTransitCount}</span>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
