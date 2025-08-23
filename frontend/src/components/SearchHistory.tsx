/**
 * Search History Component
 * 
 * Author: Yobie Benjamin
 * Version: 0.2
 * Date: July 28, 2025
 */

import React, { useEffect, useState } from 'react';
import { getSearchHistory } from '../services/api';

const SearchHistory: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const result = await getSearchHistory();
      if (result.success) {
        setHistory(result.history);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading history...</div>;
  }

  return (
    <div className="search-history">
      <h2>Search History</h2>
      
      {history.length === 0 ? (
        <p>No search history yet.</p>
      ) : (
        <div className="history-list">
          {history.map((item, index) => (
            <div key={index} className="history-item">
              <span className="history-type">{item.type}</span>
              <span className="history-query">{JSON.stringify(item.query)}</span>
              <span className="history-results">{item.results} results</span>
              <span className="history-date">{new Date(item.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchHistory;