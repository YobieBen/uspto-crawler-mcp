/**
 * Patent Search Tool
 * 
 * Author: Yobie Benjamin
 * Version: 0.2
 * Date: July 28, 2025
 * 
 * MCP tool for searching USPTO patent databases
 */

import { USPTOCrawler, PatentResult } from '../crawler/uspto-crawler.js';

export class PatentSearchTool {
  name = 'uspto_patent_search';
  description = 'Search USPTO patent databases for patents and applications';
  
  constructor(private crawler: USPTOCrawler) {}

  getSchema() {
    return {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (keywords, patent number, etc.)'
        },
        inventor: {
          type: 'string',
          description: 'Inventor name'
        },
        applicant: {
          type: 'string',
          description: 'Applicant or assignee name'
        },
        dateFrom: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)'
        },
        dateTo: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)'
        },
        status: {
          type: 'string',
          enum: ['pending', 'granted', 'abandoned', 'all'],
          description: 'Patent status filter'
        },
        classificationCode: {
          type: 'string',
          description: 'USPTO classification code'
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return',
          default: 20
        }
      },
      required: []
    };
  }

  async execute(args: any): Promise<{
    success: boolean;
    results: PatentResult[];
    count: number;
    query: any;
  }> {
    try {
      const results = await this.crawler.searchPatents({
        ...args,
        type: 'patent'
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