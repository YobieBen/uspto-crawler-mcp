/**
 * Results Display Component
 * 
 * Author: Yobie Benjamin
 * Version: 0.2
 * Date: July 28, 2025
 */

import React from 'react';

interface ResultsDisplayProps {
  results: any[];
  resultType: 'patent' | 'trademark';
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, resultType }) => {
  return (
    <div className="results-display">
      <h3>{results.length} {resultType === 'patent' ? 'Patents' : 'Trademarks'} Found</h3>
      
      <div className="results-list">
        {results.map((result, index) => (
          <div key={index} className="result-item">
            {resultType === 'patent' ? (
              <>
                <h4>{result.title || 'Untitled Patent'}</h4>
                <p><strong>Patent Number:</strong> {result.patentNumber || 'N/A'}</p>
                <p><strong>Inventors:</strong> {result.inventors?.join(', ') || 'N/A'}</p>
                <p><strong>Filing Date:</strong> {result.filingDate || 'N/A'}</p>
                <p><strong>Abstract:</strong> {result.abstract || 'No abstract available'}</p>
              </>
            ) : (
              <>
                <h4>{result.mark || 'Untitled Mark'}</h4>
                <p><strong>Serial Number:</strong> {result.serialNumber || 'N/A'}</p>
                <p><strong>Owner:</strong> {result.owner || 'N/A'}</p>
                <p><strong>Status:</strong> {result.status || 'N/A'}</p>
                <p><strong>Filing Date:</strong> {result.filingDate || 'N/A'}</p>
              </>
            )}
            
            {result.url && (
              <a href={result.url} target="_blank" rel="noopener noreferrer">
                View on USPTO →
              </a>
            )}
          </div>
        ))}
      </div>
      
      <button className="btn btn-secondary" onClick={() => exportResults(results, resultType)}>
        Export Results
      </button>
    </div>
  );
};

function exportResults(results: any[], type: string) {
  const dataStr = JSON.stringify(results, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `${type}_results_${Date.now()}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

export default ResultsDisplay;