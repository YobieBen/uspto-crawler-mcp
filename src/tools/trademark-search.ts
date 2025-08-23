/**
 * Trademark Search Tool
 * 
 * Author: Yobie Benjamin
 * Version: 0.2
 * Date: July 28, 2025
 * 
 * MCP tool for searching USPTO trademark databases
 */

import { USPTOCrawler, TrademarkResult } from '../crawler/uspto-crawler.js';

export class TrademarkSearchTool {
  name = 'uspto_trademark_search';
  description = 'Search USPTO trademark databases (TESS)';
  
  constructor(private crawler: USPTOCrawler) {}

  getSchema() {
    return {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (mark text, serial number, etc.)'
        },
        owner: {
          type: 'string',
          description: 'Trademark owner name'
        },
        status: {
          type: 'string',
          enum: ['live', 'dead', 'pending', 'registered', 'all'],
          description: 'Trademark status filter'
        },
        goodsServices: {
          type: 'string',
          description: 'Goods and services description'
        },
        dateFrom: {
          type: 'string',
          description: 'Filing date from (YYYY-MM-DD)'
        },
        dateTo: {
          type: 'string',
          description: 'Filing date to (YYYY-MM-DD)'
        },
        limit: {
          type: 'number',
          description: 'Maximum results',
          default: 20
        }
      },
      required: []
    };
  }

  async execute(args: any): Promise<{
    success: boolean;
    results: TrademarkResult[];
    count: number;
    query: any;
  }> {
    try {
      const results = await this.crawler.searchTrademarks({
        ...args,
        type: 'trademark',
        applicant: args.owner
      });

      return {
        success: true,
        results,
        count: results.length,
        query: args
      };
    } catch (error) {
      return {
        success: false,
        results: [],
        count: 0,
        query: args
      };
    }
  }
}