/**
 * Status Checker Component
 * 
 * Author: Yobie Benjamin
 * Version: 0.2
 * Date: July 28, 2025
 */

import React, { useState } from 'react';

interface StatusCheckerProps {
  onCheck: (number: string, type: 'patent' | 'trademark') => void;
}

const StatusChecker: React.FC<StatusCheckerProps> = ({ onCheck }) => {
  const [number, setNumber] = useState('');
  const [type, setType] = useState<'patent' | 'trademark'>('patent');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (number.trim()) {
      onCheck(number.trim(), type);
    }
  };

  return (
    <div className="status-checker">
      <h2>Check Application Status</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Application Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as 'patent' | 'trademark')}>
            <option value="patent">Patent</option>
            <option value="trademark">Trademark</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Application/Serial Number</label>
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder={type === 'patent' ? 'e.g., 16/123,456' : 'e.g., 88123456'}
          />
        </div>
        
        <button type="submit" className="btn btn-primary">Check Status</button>
      </form>
    </div>
  );
};

export default StatusChecker;