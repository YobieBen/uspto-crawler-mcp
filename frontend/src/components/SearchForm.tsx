/**
 * Search Form Component
 * 
 * Author: Yobie Benjamin
 * Version: 0.2
 * Date: July 28, 2025
 */

import React, { useState } from 'react';

interface SearchFormProps {
  searchType: 'patent' | 'trademark';
  onSearch: (params: any) => void;
  isLoading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ searchType, onSearch, isLoading }) => {
  const [formData, setFormData] = useState({
    query: '',
    inventor: '',
    applicant: '',
    owner: '',
    dateFrom: '',
    dateTo: '',
    status: 'all',
    classificationCode: '',
    goodsServices: '',
    limit: 20
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="form-group">
        <label htmlFor="query">Search Query</label>
        <input
          type="text"
          id="query"
          name="query"
          value={formData.query}
          onChange={handleChange}
          placeholder={searchType === 'patent' ? 'Enter keywords, patent number...' : 'Enter mark text, serial number...'}
          className="form-control"
        />
      </div>

      {searchType === 'patent' ? (
        <>
          <div className="form-group">
            <label htmlFor="inventor">Inventor</label>
            <input
              type="text"
              id="inventor"
              name="inventor"
              value={formData.inventor}
              onChange={handleChange}
              placeholder="Inventor name"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="applicant">Applicant/Assignee</label>
            <input
              type="text"
              id="applicant"
              name="applicant"
              value={formData.applicant}
              onChange={handleChange}
              placeholder="Company or individual name"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="classificationCode">Classification Code</label>
            <input
              type="text"
              id="classificationCode"
              name="classificationCode"
              value={formData.classificationCode}
              onChange={handleChange}
              placeholder="USPTO classification"
              className="form-control"
            />
          </div>
        </>
      ) : (
        <>
          <div className="form-group">
            <label htmlFor="owner">Owner</label>
            <input
              type="text"
              id="owner"
              name="owner"
              value={formData.owner}
              onChange={handleChange}
              placeholder="Trademark owner name"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="goodsServices">Goods & Services</label>
            <textarea
              id="goodsServices"
              name="goodsServices"
              value={formData.goodsServices}
              onChange={handleChange}
              placeholder="Description of goods/services"
              className="form-control"
              rows={3}
            />
          </div>
        </>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dateFrom">Date From</label>
          <input
            type="date"
            id="dateFrom"
            name="dateFrom"
            value={formData.dateFrom}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="dateTo">Date To</label>
          <input
            type="date"
            id="dateTo"
            name="dateTo"
            value={formData.dateTo}
            onChange={handleChange}
            className="form-control"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="form-control"
          >
            <option value="all">All</option>
            {searchType === 'patent' ? (
              <>
                <option value="granted">Granted</option>
                <option value="pending">Pending</option>
                <option value="abandoned">Abandoned</option>
              </>
            ) : (
              <>
                <option value="live">Live</option>
                <option value="dead">Dead</option>
                <option value="pending">Pending</option>
                <option value="registered">Registered</option>
              </>
            )}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="limit">Max Results</label>
          <input
            type="number"
            id="limit"
            name="limit"
            value={formData.limit}
            onChange={handleChange}
            min="1"
            max="100"
            className="form-control"
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={isLoading}>
        {isLoading ? 'Searching...' : `Search ${searchType === 'patent' ? 'Patents' : 'Trademarks'}`}
      </button>
    </form>
  );
};

export default SearchForm;