/**
 * Bulk Extractor Component
 * 
 * Author: Yobie Benjamin
 * Version: 0.2
 * Date: July 28, 2025
 */

import React, { useState } from 'react';

interface BulkExtractorProps {
  socket: any;
}

const BulkExtractor: React.FC<BulkExtractorProps> = ({ socket }) => {
  const [inputText, setInputText] = useState('');
  const [extractType, setExtractType] = useState('summary');
  const [progress, setProgress] = useState(0);

  const handleExtract = () => {
    const numbers = inputText.split('\n').filter(n => n.trim());
    
    if (socket && numbers.length > 0) {
      socket.emit('extract:bulk', {
        numbers,
        extractType
      });
    }
  };

  return (
    <div className="bulk-extractor">
      <h2>Bulk Data Extraction</h2>
      
      <div className="form-group">
        <label>Enter Patent/Trademark Numbers (one per line)</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={10}
          placeholder="16/123,456&#10;88123456&#10;US10123456"
        />
      </div>
      
      <div className="form-group">
        <label>Extraction Type</label>
        <select value={extractType} onChange={(e) => setExtractType(e.target.value)}>
          <option value="summary">Summary</option>
          <option value="full">Full Details</option>
          <option value="status">Status Only</option>
        </select>
      </div>
      
      {progress > 0 && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <span>{progress}%</span>
        </div>
      )}
      
      <button onClick={handleExtract} className="btn btn-primary">
        Start Extraction
      </button>
    </div>
  );
};

export default BulkExtractor;