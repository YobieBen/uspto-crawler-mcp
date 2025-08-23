/**
 * USPTO Crawler MCP Server
 * 
 * Author: Yobie Benjamin
 * Version: 0.2
 * Date: July 28, 2025
 * 
 * MCP server that provides USPTO crawling capabilities via Crawl4AI
 * This server exposes tools for searching patents, trademarks, and extracting USPTO data
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import winston from 'winston';
import { USPTOCrawler } from '../crawler/uspto-crawler.js';
import { Crawl4AIService } from '../services/crawl4ai-service.js';
import { PatentSearchTool } from '../tools/patent-search.js';
import { TrademarkSearchTool } from '../tools/trademark-search.js';
import { BulkExtractorTool } from '../tools/bulk-extractor.js';

/**
 * Configure logger for debugging
 * Essential for tracking complex USPTO crawling operations
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
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
 * USPTO MCP Server
 * Provides AI-powered tools for navigating and extracting USPTO data
 */
class USPTOMCPServer {
  private server: Server;
  private crawler: USPTOCrawler;
  private crawl4ai: Crawl4AIService;
  private tools: Map<string, any>;

  constructor() {
    /**
     * Initialize MCP server with USPTO-specific capabilities
     * Server provides specialized tools for patent and trademark searches
     */
    this.server = new Server(
      {
        name: 'uspto-crawler-mcp',
        version: '0.2.0',
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    /**
     * Initialize core services
     * Crawl4AI handles the heavy lifting of web scraping
     */
    this.crawl4ai = new Crawl4AIService();
    this.crawler = new USPTOCrawler(this.crawl4ai);
    this.tools = new Map();

    this.initializeTools();
    this.setupHandlers();
  }

  /**
   * Initialize USPTO-specific tools
   * Each tool handles different aspects of USPTO data extraction
   */
  private initializeTools(): void {
    // Patent search tool
    const patentSearch = new PatentSearchTool(this.crawler);
    this.tools.set('uspto_patent_search', patentSearch);

    // Trademark search tool
    const trademarkSearch = new TrademarkSearchTool(this.crawler);
    this.tools.set('uspto_trademark_search', trademarkSearch);

    // Bulk data extractor
    const bulkExtractor = new BulkExtractorTool(this.crawler);
    this.tools.set('uspto_bulk_extract', bulkExtractor);

    // Advanced search tool
    this.tools.set('uspto_advanced_search', {
      name: 'uspto_advanced_search',
      description: 'Advanced USPTO search with multiple criteria',
      execute: async (args: any) => this.crawler.advancedSearch(args)
    });

    // Status checker tool
    this.tools.set('uspto_status_check', {
      name: 'uspto_status_check',
      description: 'Check status of patent or trademark application',
      execute: async (args: any) => this.crawler.checkApplicationStatus(args)
    });

    logger.info(`Initialized ${this.tools.size} USPTO tools`);
  }

  /**
   * Setup MCP protocol handlers
   * Handles tool listing and execution requests
   */
  private setupHandlers(): void {
    /**
     * Handle tool listing requests
     * Returns all available USPTO crawling tools
     */
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description || `USPTO tool: ${tool.name}`,
        inputSchema: tool.getSchema ? tool.getSchema() : {
          type: 'object',
          properties: {},
          required: []
        }
      }));

      return { tools };
    });

    /**
     * Handle tool execution requests
     * Routes to appropriate USPTO tool
     */
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      logger.info(`Executing USPTO tool: ${name}`, { args });
      
      const tool = this.tools.get(name);
      if (!tool) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Tool not found: ${name}`
        );
      }

      try {
        const result = await tool.execute(args || {});
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error(`Tool execution failed: ${name}`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  /**
   * Initialize and start the server
   * Sets up Crawl4AI and begins listening for connections
   */
  async start(): Promise<void> {
    logger.info('Starting USPTO MCP Server...');

    // Initialize Crawl4AI service
    await this.crawl4ai.initialize();

    // Start MCP server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    logger.info('USPTO MCP Server is running');
  }
}

/**
 * Main entry point
 * Starts the USPTO MCP server
 */
async function main() {
  const server = new USPTOMCPServer();
  
  try {
    await server.start();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down USPTO MCP Server...');
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});