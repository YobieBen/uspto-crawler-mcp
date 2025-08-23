/**
 * Simplified USPTO Crawler Backend Server
 * 
 * Author: Yobie Benjamin
 * Version: 0.2
 * Date: July 28, 2025
 * 
 * Simplified version for testing without Crawl4AI initialization
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Mock data for testing
const mockPatents = [
  {
    patentNumber: 'US10,123,456',
    title: 'Artificial Intelligence System for Data Processing',
    inventors: ['John Doe', 'Jane Smith'],
    applicant: 'Tech Corp Inc.',
    filingDate: '2023-01-15',
    abstract: 'An AI system that processes data using advanced machine learning algorithms.',
    status: 'Granted'
  },
  {
    patentNumber: 'US10,234,567',
    title: 'Quantum Computing Architecture',
    inventors: ['Alice Johnson', 'Bob Wilson'],
    applicant: 'Quantum Systems LLC',
    filingDate: '2023-03-20',
    abstract: 'A novel quantum computing architecture for solving complex problems.',
    status: 'Pending'
  }
];

const mockTrademarks = [
  {
    serialNumber: '88123456',
    mark: 'TECHBRAND',
    owner: 'Tech Company Inc.',
    filingDate: '2023-02-10',
    status: 'Live',
    goodsServices: 'Computer software and services'
  },
  {
    serialNumber: '88234567',
    mark: 'INNOVATE',
    owner: 'Innovation Corp',
    filingDate: '2023-04-15',
    status: 'Pending',
    goodsServices: 'Technology consulting services'
  }
];

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Simplified server running (Crawl4AI disabled for testing)'
  });
});

app.post('/api/patents/search', (req, res) => {
  console.log('Patent search request:', req.body);
  
  // Simulate search with mock data
  setTimeout(() => {
    res.json({
      success: true,
      results: mockPatents,
      count: mockPatents.length
    });
  }, 500);
});

app.post('/api/trademarks/search', (req, res) => {
  console.log('Trademark search request:', req.body);
  
  // Simulate search with mock data
  setTimeout(() => {
    res.json({
      success: true,
      results: mockTrademarks,
      count: mockTrademarks.length
    });
  }, 500);
});

app.get('/api/status/:type/:number', (req, res) => {
  const { type, number } = req.params;
  
  res.json({
    success: true,
    status: {
      applicationNumber: number,
      type: type,
      status: 'Pending Examination',
      examiner: 'John Examiner',
      lastAction: 'Non-Final Rejection',
      lastActionDate: '2023-06-15'
    }
  });
});

app.get('/api/history', (req, res) => {
  res.json({
    success: true,
    history: [
      {
        type: 'patent',
        query: { query: 'artificial intelligence' },
        results: 2,
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        type: 'trademark',
        query: { query: 'TECH' },
        results: 1,
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ]
  });
});

// WebSocket handlers
io.on('connection', (socket) => {
  console.log('Client connected via WebSocket');

  socket.on('search:stream', async (data) => {
    socket.emit('search:progress', { status: 'starting', progress: 0 });
    
    setTimeout(() => {
      socket.emit('search:progress', { status: 'searching', progress: 50 });
    }, 500);
    
    setTimeout(() => {
      socket.emit('search:progress', { status: 'processing', progress: 75 });
    }, 1000);
    
    setTimeout(() => {
      socket.emit('search:complete', {
        results: data.type === 'patent' ? mockPatents : mockTrademarks
      });
    }, 1500);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Serve static files (if frontend is built)
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// Catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 USPTO Crawler Backend (Simplified) running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log('\n⚠️  Note: Using mock data - Crawl4AI disabled for testing');
});