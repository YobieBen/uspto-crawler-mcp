/**
 * USPTO Crawler Implementation
 * 
 * Author: Yobie Benjamin
 * Version: 0.2
 * Date: July 28, 2025
 * 
 * Specialized crawler for USPTO website navigation and data extraction
 * Handles the complexities of USPTO's various search systems and databases
 */

import winston from 'winston';
import { Crawl4AIService } from '../services/crawl4ai-service.js';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.simple()
});

/**
 * USPTO search parameters
 * Common parameters across different USPTO search types
 */
export interface USPTOSearchParams {
  query?: string;
  type?: 'patent' | 'trademark' | 'both';
  status?: 'pending' | 'granted' | 'abandoned' | 'all';
  dateFrom?: string;
  dateTo?: string;
  applicant?: string;
  inventor?: string;
  assignee?: string;
  classificationCode?: string;
  limit?: number;
  offset?: number;
}

/**
 * Patent search result structure
 * Contains essential patent information
 */
export interface PatentResult {
  patentNumber?: string;
  applicationNumber?: string;
  title?: string;
  abstract?: string;
  inventors?: string[];
  applicant?: string;
  assignee?: string;
  filingDate?: string;
  grantDate?: string;
  status?: string;
  classification?: string[];
  claims?: string[];
  url?: string;
  pdfUrl?: string;
}

/**
 * Trademark search result structure
 * Contains essential trademark information
 */
export interface TrademarkResult {
  serialNumber?: string;
  registrationNumber?: string;
  mark?: string;
  owner?: string;
  filingDate?: string;
  registrationDate?: string;
  status?: string;
  goodsAndServices?: string;
  classification?: string[];
  url?: string;
  imageUrl?: string;
}

/**
 * Main USPTO Crawler class
 * Orchestrates all USPTO data extraction operations
 */
export class USPTOCrawler {
  private crawl4ai: Crawl4AIService;
  private baseUrls = {
    patentSearch: 'https://ppubs.uspto.gov/pubwebapp/',
    patentFullText: 'https://patft.uspto.gov/',
    trademarkSearch: 'https://tmsearch.uspto.gov/',
    trademarkStatus: 'https://tsdr.uspto.gov/',
    assignment: 'https://assignment.uspto.gov/',
    ptab: 'https://www.uspto.gov/patents/ptab',
    fees: 'https://www.uspto.gov/learning-and-resources/fees-and-payment'
  };

  constructor(crawl4ai: Crawl4AIService) {
    this.crawl4ai = crawl4ai;
  }

  /**
   * Search for patents using various USPTO databases
   * Handles PatFT, AppFT, and Patent Public Search
   */
  async searchPatents(params: USPTOSearchParams): Promise<PatentResult[]> {
    logger.info('Searching USPTO patents', params);

    try {
      /**
       * Build search URL based on parameters
       * USPTO has different search interfaces for different data
       */
      const searchUrl = this.buildPatentSearchUrl(params);

      /**
       * Crawl search results page
       * Extract patent listings
       */
      const searchResults = await this.crawl4ai.crawl(searchUrl, {
        waitForSelector: 'div.search-results',
        extractionStrategy: 'css'
      });

      if (!searchResults.success) {
        throw new Error(`Patent search failed: ${searchResults.error}`);
      }

      /**
       * Parse search results
       * Extract patent numbers and basic info
       */
      const patentList = this.parsePatentSearchResults(searchResults);

      /**
       * Fetch detailed information for each patent
       * Parallel crawling with rate limiting
       */
      const detailedResults = await this.fetchPatentDetails(patentList);

      return detailedResults;

    } catch (error) {
      logger.error('Patent search error:', error);
      throw error;
    }
  }

  /**
   * Search for trademarks using USPTO TESS system
   * Handles basic and advanced trademark searches
   */
  async searchTrademarks(params: USPTOSearchParams): Promise<TrademarkResult[]> {
    logger.info('Searching USPTO trademarks', params);

    try {
      /**
       * Build trademark search URL
       * TESS has its own query syntax
       */
      const searchUrl = this.buildTrademarkSearchUrl(params);

      /**
       * Crawl trademark search results
       * TESS returns results in a table format
       */
      const searchResults = await this.crawl4ai.crawl(searchUrl, {
        waitForSelector: 'table.results',
        extractionStrategy: 'css'
      });

      if (!searchResults.success) {
        throw new Error(`Trademark search failed: ${searchResults.error}`);
      }

      /**
       * Parse trademark results
       * Extract serial numbers and basic info
       */
      const trademarkList = this.parseTrademarkSearchResults(searchResults);

      /**
       * Fetch detailed trademark information
       * Use TSDR for comprehensive data
       */
      const detailedResults = await this.fetchTrademarkDetails(trademarkList);

      return detailedResults;

    } catch (error) {
      logger.error('Trademark search error:', error);
      throw error;
    }
  }

  /**
   * Advanced search combining multiple USPTO databases
   * Provides unified search across patents and trademarks
   */
  async advancedSearch(params: any): Promise<{
    patents: PatentResult[];
    trademarks: TrademarkResult[];
    metadata: any;
  }> {
    logger.info('Performing advanced USPTO search', params);

    const results = {
      patents: [] as PatentResult[],
      trademarks: [] as TrademarkResult[],
      metadata: {
        searchParams: params,
        timestamp: new Date().toISOString(),
        sources: [] as string[]
      }
    };

    /**
     * Search patents if requested
     * Include multiple patent databases
     */
    if (params.type === 'patent' || params.type === 'both') {
      // Search granted patents
      if (params.includeGranted !== false) {
        const grantedPatents = await this.searchGrantedPatents(params);
        results.patents.push(...grantedPatents);
        results.metadata.sources.push('PatFT');
      }

      // Search patent applications
      if (params.includeApplications !== false) {
        const applications = await this.searchPatentApplications(params);
        results.patents.push(...applications);
        results.metadata.sources.push('AppFT');
      }
    }

    /**
     * Search trademarks if requested
     * Include various trademark databases
     */
    if (params.type === 'trademark' || params.type === 'both') {
      const trademarks = await this.searchTrademarks(params);
      results.trademarks.push(...trademarks);
      results.metadata.sources.push('TESS');
    }

    /**
     * Remove duplicates
     * USPTO data may appear in multiple databases
     */
    results.patents = this.deduplicatePatents(results.patents);
    results.trademarks = this.deduplicateTrademarks(results.trademarks);

    return results;
  }

  /**
   * Check application status
   * Works for both patent and trademark applications
   */
  async checkApplicationStatus(params: {
    applicationNumber: string;
    type: 'patent' | 'trademark';
  }): Promise<any> {
    logger.info('Checking application status', params);

    if (params.type === 'patent') {
      return this.checkPatentStatus(params.applicationNumber);
    } else {
      return this.checkTrademarkStatus(params.applicationNumber);
    }
  }

  /**
   * Check patent application status using PAIR
   * Patent Application Information Retrieval system
   */
  private async checkPatentStatus(applicationNumber: string): Promise<any> {
    const url = `https://portal.uspto.gov/pair/PublicPair?application=${applicationNumber}`;

    const result = await this.crawl4ai.crawl(url, {
      waitForSelector: 'div.application-data',
      extractionStrategy: 'llm'
    });

    if (!result.success) {
      throw new Error(`Failed to check patent status: ${result.error}`);
    }

    return this.parsePatentStatus(result);
  }

  /**
   * Check trademark status using TSDR
   * Trademark Status and Document Retrieval system
   */
  private async checkTrademarkStatus(serialNumber: string): Promise<any> {
    const url = `${this.baseUrls.trademarkStatus}?serialNumber=${serialNumber}`;

    const result = await this.crawl4ai.crawl(url, {
      waitForSelector: 'div.status-container',
      extractionStrategy: 'css'
    });

    if (!result.success) {
      throw new Error(`Failed to check trademark status: ${result.error}`);
    }

    return this.parseTrademarkStatus(result);
  }

  /**
   * Build patent search URL based on parameters
   * Constructs appropriate URL for USPTO patent search
   */
  private buildPatentSearchUrl(params: USPTOSearchParams): string {
    const baseUrl = this.baseUrls.patentSearch;
    const queryParams = new URLSearchParams();

    if (params.query) {
      queryParams.append('searchText', params.query);
    }
    if (params.applicant) {
      queryParams.append('applicant', params.applicant);
    }
    if (params.inventor) {
      queryParams.append('inventor', params.inventor);
    }
    if (params.dateFrom) {
      queryParams.append('dateFrom', params.dateFrom);
    }
    if (params.dateTo) {
      queryParams.append('dateTo', params.dateTo);
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    return `${baseUrl}?${queryParams.toString()}`;
  }

  /**
   * Build trademark search URL
   * Constructs TESS search URL with proper formatting
   */
  private buildTrademarkSearchUrl(params: USPTOSearchParams): string {
    const baseUrl = this.baseUrls.trademarkSearch;
    const queryParams = new URLSearchParams();

    if (params.query) {
      // TESS uses special query syntax
      const tessQuery = this.formatTESSQuery(params.query);
      queryParams.append('q', tessQuery);
    }
    if (params.applicant) {
      queryParams.append('owner', params.applicant);
    }
    if (params.status) {
      queryParams.append('status', params.status);
    }

    return `${baseUrl}?${queryParams.toString()}`;
  }

  /**
   * Format query for TESS search system
   * TESS has specific query syntax requirements
   */
  private formatTESSQuery(query: string): string {
    // Basic sanitization and formatting for TESS
    return query
      .replace(/[^\w\s\-*"]/g, '') // Remove special characters
      .trim();
  }

  /**
   * Parse patent search results
   * Extract patent information from search page
   */
  private parsePatentSearchResults(crawlResult: any): PatentResult[] {
    const patents: PatentResult[] = [];

    try {
      // Parse based on extraction strategy results
      if (crawlResult.extractedData) {
        // Structured data from LLM or CSS extraction
        const data = Array.isArray(crawlResult.extractedData) 
          ? crawlResult.extractedData 
          : [crawlResult.extractedData];

        for (const item of data) {
          patents.push({
            patentNumber: item.patentNumber || item.number,
            title: item.title,
            abstract: item.abstract,
            url: item.url || item.link,
            filingDate: item.filingDate,
            status: item.status
          });
        }
      }
    } catch (error) {
      logger.error('Error parsing patent results:', error);
    }

    return patents;
  }

  /**
   * Parse trademark search results
   * Extract trademark information from TESS results
   */
  private parseTrademarkSearchResults(crawlResult: any): TrademarkResult[] {
    const trademarks: TrademarkResult[] = [];

    try {
      if (crawlResult.extractedData) {
        const data = Array.isArray(crawlResult.extractedData)
          ? crawlResult.extractedData
          : [crawlResult.extractedData];

        for (const item of data) {
          trademarks.push({
            serialNumber: item.serialNumber || item.serial,
            registrationNumber: item.registrationNumber,
            mark: item.mark || item.wordMark,
            owner: item.owner,
            status: item.status,
            url: item.url
          });
        }
      }
    } catch (error) {
      logger.error('Error parsing trademark results:', error);
    }

    return trademarks;
  }

  /**
   * Fetch detailed patent information
   * Retrieves comprehensive data for each patent
   */
  private async fetchPatentDetails(patents: PatentResult[]): Promise<PatentResult[]> {
    const detailed: PatentResult[] = [];

    for (const patent of patents) {
      if (!patent.url) continue;

      try {
        const result = await this.crawl4ai.smartCrawl(patent.url);
        
        if (result.success && result.extractedData) {
          detailed.push({
            ...patent,
            ...result.extractedData
          });
        } else {
          detailed.push(patent);
        }
      } catch (error) {
        logger.error(`Failed to fetch details for patent ${patent.patentNumber}:`, error);
        detailed.push(patent);
      }

      // Rate limiting
      await this.delay(500);
    }

    return detailed;
  }

  /**
   * Fetch detailed trademark information
   * Retrieves comprehensive data from TSDR
   */
  private async fetchTrademarkDetails(trademarks: TrademarkResult[]): Promise<TrademarkResult[]> {
    const detailed: TrademarkResult[] = [];

    for (const trademark of trademarks) {
      if (!trademark.serialNumber) continue;

      try {
        const statusResult = await this.checkTrademarkStatus(trademark.serialNumber);
        
        detailed.push({
          ...trademark,
          ...statusResult
        });
      } catch (error) {
        logger.error(`Failed to fetch details for trademark ${trademark.serialNumber}:`, error);
        detailed.push(trademark);
      }

      // Rate limiting
      await this.delay(500);
    }

    return detailed;
  }

  /**
   * Search granted patents in PatFT database
   * Full-text database of granted patents
   */
  private async searchGrantedPatents(params: USPTOSearchParams): Promise<PatentResult[]> {
    const url = `${this.baseUrls.patentFullText}netahtml/PTO/search-bool.html`;
    
    // PatFT specific search implementation
    const result = await this.crawl4ai.crawl(url, {
      extractionStrategy: 'llm'
    });

    return this.parsePatentSearchResults(result);
  }

  /**
   * Search patent applications in AppFT database
   * Published patent applications database
   */
  private async searchPatentApplications(params: USPTOSearchParams): Promise<PatentResult[]> {
    const url = `${this.baseUrls.patentFullText}netahtml/PTO/srchnum.html`;
    
    // AppFT specific search implementation
    const result = await this.crawl4ai.crawl(url, {
      extractionStrategy: 'llm'
    });

    return this.parsePatentSearchResults(result);
  }

  /**
   * Parse patent status information
   * Extract status details from PAIR
   */
  private parsePatentStatus(crawlResult: any): any {
    return {
      applicationNumber: crawlResult.extractedData?.applicationNumber,
      status: crawlResult.extractedData?.status,
      examiner: crawlResult.extractedData?.examiner,
      artUnit: crawlResult.extractedData?.artUnit,
      lastAction: crawlResult.extractedData?.lastAction,
      transactions: crawlResult.extractedData?.transactions || []
    };
  }

  /**
   * Parse trademark status information
   * Extract status details from TSDR
   */
  private parseTrademarkStatus(crawlResult: any): any {
    return {
      serialNumber: crawlResult.extractedData?.serialNumber,
      registrationNumber: crawlResult.extractedData?.registrationNumber,
      status: crawlResult.extractedData?.status,
      statusDate: crawlResult.extractedData?.statusDate,
      attorney: crawlResult.extractedData?.attorney,
      correspondent: crawlResult.extractedData?.correspondent,
      prosecution: crawlResult.extractedData?.prosecutionHistory || []
    };
  }

  /**
   * Remove duplicate patents
   * Based on patent/application number
   */
  private deduplicatePatents(patents: PatentResult[]): PatentResult[] {
    const seen = new Set<string>();
    return patents.filter(patent => {
      const key = patent.patentNumber || patent.applicationNumber || '';
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Remove duplicate trademarks
   * Based on serial/registration number
   */
  private deduplicateTrademarks(trademarks: TrademarkResult[]): TrademarkResult[] {
    const seen = new Set<string>();
    return trademarks.filter(trademark => {
      const key = trademark.serialNumber || trademark.registrationNumber || '';
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Helper: Delay for rate limiting
   * Be respectful to USPTO servers
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}