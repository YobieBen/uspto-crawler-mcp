/**
 * USPTO Crawler Backend Server
 * 
 * Author: Yobie Benjamin
 * Version: 0.2
 * Date: July 28, 2025
 * 
 * Express server providing REST API and WebSocket for USPTO crawling
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { SimpleUSPTOService } from '../services/simple-uspto-service.js';
import { DatabaseService } from '../services/database-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * Main backend server class
 * Provides API endpoints for USPTO data access
 */
export class USPTOBackendServer {
  private app: express.Application;
  private server: any;
  private io: SocketServer;
  private usptoService: SimpleUSPTOService;
  private database: DatabaseService;
  private port: number;

  constructor(port: number = 3001) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketServer(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    /**
     * Initialize services
     * Core services for USPTO data access
     */
    this.usptoService = new SimpleUSPTOService();
    this.database = new DatabaseService();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  /**
   * Setup Express middleware
   * Configure CORS, JSON parsing, and static files
   */
  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Serve frontend build files
    this.app.use(express.static(path.join(__dirname, '../../frontend/build')));
  }

  /**
   * Setup REST API routes
   * Define all HTTP endpoints for USPTO operations
   */
  private setupRoutes(): void {
    /**
     * Health check endpoint
     */
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          crawler: 'ready',
          database: 'ready'
        }
      });
    });

    /**
     * Patent search endpoint
     * Search USPTO patent databases
     */
    this.app.post('/api/patents/search', async (req, res) => {
      try {
        logger.info('Patent search request', req.body);
        
        const { query, limit = 20 } = req.body;
        const results = await this.usptoService.searchPatents(query || '', limit);
        
        // Store search in database for history
        await this.database.saveSearch({
          type: 'patent',
          query: req.body,
          results: results.length,
          timestamp: new Date()
        });

        res.json({
          success: true,
          results,
          count: results.length
        });
      } catch (error) {
        logger.error('Patent search error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Search failed'
        });
      }
    });

    /**
     * Trademark search endpoint
     * Search USPTO trademark databases
     */
    this.app.post('/api/trademarks/search', async (req, res) => {
      try {
        logger.info('Trademark search request', req.body);
        
        const { query, limit = 20 } = req.body;
        const results = await this.usptoService.searchTrademarks(query || '', limit);
        
        // Store search in database
        await this.database.saveSearch({
          type: 'trademark',
          query: req.body,
          results: results.length,
          timestamp: new Date()
        });

        res.json({
          success: true,
          results,
          count: results.length
        });
      } catch (error) {
        logger.error('Trademark search error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Search failed'
        });
      }
    });

    /**
     * Advanced search endpoint
     * Combined patent and trademark search
     */
    this.app.post('/api/search/advanced', async (req, res) => {
      try {
        logger.info('Advanced search request', req.body);
        
        const { query, limit = 20 } = req.body;
        const [patents, trademarks] = await Promise.all([
          this.usptoService.searchPatents(query || '', limit),
          this.usptoService.searchTrademarks(query || '', limit)
        ]);
        const results = { patents, trademarks };
        
        res.json({
          success: true,
          ...results
        });
      } catch (error) {
        logger.error('Advanced search error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Search failed'
        });
      }
    });

    /**
     * Status check endpoint
     * Check application status by number
     */
    this.app.get('/api/status/:type/:number', async (req, res) => {
      try {
        const { type, number } = req.params;
        
        const status = type === 'patent' 
          ? await this.usptoService.checkPatentStatus(number)
          : await this.usptoService.checkTrademarkStatus(number);

        res.json({
          success: true,
          status
        });
      } catch (error) {
        logger.error('Status check error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Status check failed'
        });
      }
    });

    /**
     * Bulk extraction endpoint
     * Extract data from multiple USPTO sources
     */
    this.app.post('/api/extract/bulk', async (req, res) => {
      try {
        logger.info('Bulk extraction request', req.body);
        
        // Start extraction in background
        this.performBulkExtraction(req.body);

        res.json({
          success: true,
          message: 'Bulk extraction started',
          jobId: Date.now().toString()
        });
      } catch (error) {
        logger.error('Bulk extraction error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Extraction failed'
        });
      }
    });

    /**
     * Search history endpoint
     * Get previous searches from database
     */
    this.app.get('/api/history', async (req, res) => {
      try {
        const history = await this.database.getSearchHistory({
          limit: parseInt(req.query.limit as string) || 50,
          offset: parseInt(req.query.offset as string) || 0
        });

        res.json({
          success: true,
          history
        });
      } catch (error) {
        logger.error('History retrieval error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve history'
        });
      }
    });

    /**
     * Export endpoint
     * Export search results in various formats
     */
    this.app.post('/api/export', async (req, res) => {
      try {
        const { data, format } = req.body;
        
        let exportedData: any;
        switch (format) {
          case 'csv':
            exportedData = this.exportToCSV(data);
            res.setHeader('Content-Type', 'text/csv');
            break;
          case 'json':
          default:
            exportedData = JSON.stringify(data, null, 2);
            res.setHeader('Content-Type', 'application/json');
        }

        res.setHeader('Content-Disposition', `attachment; filename=uspto-export.${format}`);
        res.send(exportedData);
      } catch (error) {
        logger.error('Export error:', error);
        res.status(500).json({
          success: false,
          error: 'Export failed'
        });
      }
    });

    /**
     * Serve frontend for all other routes
     * Single-page application support
     */
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
    });
  }

  /**
   * Setup WebSocket connections
   * Real-time updates for long-running operations
   */
  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      logger.info('Client connected via WebSocket');

      /**
       * Handle real-time search requests
       * Stream results as they're found
       */
      socket.on('search:stream', async (data) => {
        try {
          // Emit progress updates
          socket.emit('search:progress', { status: 'starting', progress: 0 });

          // Perform search with progress callbacks
          const results = await this.crawlerWithProgress(
            data,
            (progress) => {
              socket.emit('search:progress', progress);
            }
          );

          socket.emit('search:complete', results);
        } catch (error) {
          socket.emit('search:error', {
            error: error instanceof Error ? error.message : 'Search failed'
          });
        }
      });

      /**
       * Handle bulk extraction with progress
       * Stream extraction progress to client
       */
      socket.on('extract:bulk', async (data) => {
        try {
          await this.performBulkExtractionWithProgress(data, (progress) => {
            socket.emit('extract:progress', progress);
          });
          
          socket.emit('extract:complete', { success: true });
        } catch (error) {
          socket.emit('extract:error', {
            error: error instanceof Error ? error.message : 'Extraction failed'
          });
        }
      });

      socket.on('disconnect', () => {
        logger.info('Client disconnected');
      });
    });
  }

  /**
   * Perform bulk extraction in background
   * Handles large-scale data extraction
   */
  private async performBulkExtraction(params: any): Promise<void> {
    // Implementation for bulk extraction
    logger.info('Starting bulk extraction', params);
    // This would be implemented with actual extraction logic
  }

  /**
   * Perform bulk extraction with progress updates
   * Provides real-time feedback via WebSocket
   */
  private async performBulkExtractionWithProgress(
    params: any,
    onProgress: (progress: any) => void
  ): Promise<void> {
    // Implementation with progress callbacks
    onProgress({ status: 'processing', progress: 50 });
    // Actual extraction logic here
    onProgress({ status: 'complete', progress: 100 });
  }

  /**
   * Crawler with progress updates
   * Provides real-time search progress
   */
  private async crawlerWithProgress(
    params: any,
    onProgress: (progress: any) => void
  ): Promise<any> {
    onProgress({ status: 'searching', progress: 25 });
    
    const { query, limit = 20, type } = params;
    const results = type === 'patent' 
      ? await this.usptoService.searchPatents(query || '', limit)
      : await this.usptoService.searchTrademarks(query || '', limit);
    
    onProgress({ status: 'processing', progress: 75 });
    
    return results;
  }

  /**
   * Export data to CSV format
   * Convert JSON results to CSV
   */
  private exportToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value;
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  }

  /**
   * Start the server
   * Initialize services and begin listening
   */
  async start(): Promise<void> {
    try {
      // Initialize services
      await this.database.initialize();

      // Start server
      this.server.listen(this.port, () => {
        logger.info(`USPTO Crawler Backend running on port ${this.port}`);
        logger.info(`Frontend: http://localhost:${this.port}`);
        logger.info(`API: http://localhost:${this.port}/api`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      throw error;
    }
  }

  /**
   * Stop the server
   * Graceful shutdown
   */
  async stop(): Promise<void> {
    logger.info('Shutting down server...');
    
    this.io.close();
    this.server.close();
    await this.database.close();
    
    logger.info('Server stopped');
  }
}

/**
 * Database service for storing search history
 * Simple SQLite database for persistence
 */
class DatabaseService {
  async initialize(): Promise<void> {
    // Database initialization
  }

  async saveSearch(search: any): Promise<void> {
    // Save search to database
  }

  async getSearchHistory(params: any): Promise<any[]> {
    // Retrieve search history
    return [];
  }

  async close(): Promise<void> {
    // Close database connection
  }
}

/**
 * Main entry point
 * Start the backend server
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new USPTOBackendServer(
    parseInt(process.env.PORT || '3001')
  );

  server.start().catch((error) => {
    console.error('Server startup failed:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });
}