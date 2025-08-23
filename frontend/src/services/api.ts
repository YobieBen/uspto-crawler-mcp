/**
 * API Service
 * 
 * Author: Yobie Benjamin
 * Version: 0.2
 * Date: July 28, 2025
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export async function searchPatents(params: any) {
  const response = await fetch(`${API_BASE_URL}/patents/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return response.json();
}

export async function searchTrademarks(params: any) {
  const response = await fetch(`${API_BASE_URL}/trademarks/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return response.json();
}

export async function checkStatus(type: string, number: string) {
  const response = await fetch(`${API_BASE_URL}/status/${type}/${number}`);
  return response.json();
}

export async function getSearchHistory() {
  const response = await fetch(`${API_BASE_URL}/history`);
  return response.json();
}