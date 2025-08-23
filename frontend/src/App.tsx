/**
 * USPTO Crawler Frontend Application
 * 
 * Author: Yobie Benjamin
 * Version: 0.2
 * Date: July 28, 2025
 * 
 * React frontend for USPTO patent and trademark searching
 */

import React, { useState } from 'react';
import './App.css';
import SearchForm from './components/SearchForm';
import ResultsDisplay from './components/ResultsDisplay';
import StatusChecker from './components/StatusChecker';
import BulkExtractor from './components/BulkExtractor';
import SearchHistory from './components/SearchHistory';
import { searchPatents, searchTrademarks, checkStatus } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';

/**
 * Main application component
 * Provides tabbed interface for different USPTO operations
 */
function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'status' | 'bulk' | 'history'>('search');
  const [searchType, setSearchType] = useState<'patent' | 'trademark'>('patent');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchProgress, setSearchProgress] = useState<number>(0);

  // WebSocket connection for real-time updates
  const { socket, connected } = useWebSocket('http://localhost:3001', {
    onSearchProgress: (progress) => setSearchProgress(progress.progress),
    onSearchComplete: (results) => {
      setSearchResults(results);
      setIsLoading(false);
      setSearchProgress(0);
    },
    onSearchError: (error) => {
      setError(error.error);
      setIsLoading(false);
      setSearchProgress(0);
    }
  });

  /**
   * Handle search form submission
   * Performs patent or trademark search based on type
   */
  const handleSearch = async (searchParams: any) => {
    setIsLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      let results;
      if (searchType === 'patent') {
        results = await searchPatents(searchParams);
      } else {
        results = await searchTrademarks(searchParams);
      }

      if (results.success) {
        setSearchResults(results.results);
      } else {
        setError(results.error || 'Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle status check
   * Check application status by number
   */
  const handleStatusCheck = async (number: string, type: 'patent' | 'trademark') => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await checkStatus(type, number);
      
      if (result.success) {
        setSearchResults([result.status]);
      } else {
        setError(result.error || 'Status check failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="App-header">
        <h1>🔍 USPTO Patent & Trademark Crawler</h1>
        <p>Advanced search and extraction for USPTO databases</p>
        <div className="connection-status">
          {connected ? (
            <span className="connected">✓ Connected</span>
          ) : (
            <span className="disconnected">⚠ Disconnected</span>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={activeTab === 'search' ? 'active' : ''}
          onClick={() => setActiveTab('search')}
        >
          Search
        </button>
        <button
          className={activeTab === 'status' ? 'active' : ''}
          onClick={() => setActiveTab('status')}
        >
          Status Check
        </button>
        <button
          className={activeTab === 'bulk' ? 'active' : ''}
          onClick={() => setActiveTab('bulk')}
        >
          Bulk Extract
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="search-section">
            <div className="search-type-selector">
              <label>
                <input
                  type="radio"
                  value="patent"
                  checked={searchType === 'patent'}
                  onChange={(e) => setSearchType(e.target.value as 'patent' | 'trademark')}
                />
                Patents
              </label>
              <label>
                <input
                  type="radio"
                  value="trademark"
                  checked={searchType === 'trademark'}
                  onChange={(e) => setSearchType(e.target.value as 'patent' | 'trademark')}
                />
                Trademarks
              </label>
            </div>

            <SearchForm
              searchType={searchType}
              onSearch={handleSearch}
              isLoading={isLoading}
            />

            {/* Progress Bar */}
            {isLoading && searchProgress > 0 && (
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${searchProgress}%` }}
                />
                <span>{searchProgress}%</span>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {/* Results Display */}
            {searchResults.length > 0 && (
              <ResultsDisplay
                results={searchResults}
                resultType={searchType}
              />
            )}
          </div>
        )}

        {/* Status Check Tab */}
        {activeTab === 'status' && (
          <StatusChecker onCheck={handleStatusCheck} />
        )}

        {/* Bulk Extract Tab */}
        {activeTab === 'bulk' && (
          <BulkExtractor socket={socket} />
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <SearchHistory />
        )}
      </main>

      {/* Footer */}
      <footer className="App-footer">
        <p>
          Powered by Crawl4AI | Author: Yobie Benjamin | Version 0.2
        </p>
        <p>
          <a href="https://github.com/yobieben/uspto-crawler-mcp" target="_blank" rel="noopener noreferrer">
            GitHub Repository
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
