/**
 * Crawl4AI Service Integration
 * 
 * Author: Yobie Benjamin
 * Version: 0.2
 * Date: July 28, 2025
 * 
 * Integrates with Crawl4AI for advanced web crawling and scraping
 * Handles the complexities of the USPTO website structure
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import * as cheerio from 'cheerio';
import winston from 'winston';

const execAsync = promisify(exec);

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.simple()
});

/**
 * Crawl4AI configuration options
 * Optimized for USPTO website crawling
 */
interface Crawl4AIConfig {
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  userAgent?: string;
  headless?: boolean;
  waitForSelector?: string;
  extractionStrategy?: 'llm' | 'css' | 'xpath' | 'auto';
  llmProvider?: string;
  llmModel?: string;
}

/**
 * Crawl result from Crawl4AI
 * Contains extracted data and metadata
 */
interface CrawlResult {
  url: string;
  title?: string;
  content?: string;
  markdown?: string;
  links?: string[];
  images?: string[];
  metadata?: Record<string, any>;
  extractedData?: any;
  success: boolean;
  error?: string;
}

/**
 * Service wrapper for Crawl4AI
 * Provides high-level interface for USPTO crawling
 */
export class Crawl4AIService {
  private config: Crawl4AIConfig;
  private isInitialized: boolean = false;

  constructor(config?: Crawl4AIConfig) {
    /**
     * Initialize with USPTO-optimized configuration
     * Settings are tuned for USPTO's complex website structure
     */
    this.config = {
      baseUrl: 'https://www.uspto.gov',
      timeout: 30000,
      maxRetries: 3,
      userAgent: 'Mozilla/5.0 (compatible; USPTO-Crawler/0.2; +https://github.com/yobieben/uspto-crawler)',
      headless: true,
      extractionStrategy: 'auto',
      llmProvider: 'openai',
      llmModel: 'gpt-4',
      ...config
    };
  }

  /**
   * Initialize Crawl4AI service
   * Ensures Crawl4AI is installed and configured
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Crawl4AI service...');

    try {
      /**
       * Check if Crawl4AI is installed
       * Install if not present
       */
      await this.checkAndInstallCrawl4AI();

      /**
       * Verify Crawl4AI is working
       * Run a simple test crawl
       */
      await this.verifyCrawl4AI();

      this.isInitialized = true;
      logger.info('Crawl4AI service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Crawl4AI:', error);
      throw error;
    }
  }

  /**
   * Check and install Crawl4AI if needed
   * Handles Python package management
   */
  private async checkAndInstallCrawl4AI(): Promise<void> {
    try {
      // Check if crawl4ai is installed
      const { stdout } = await execAsync('pip show crawl4ai');
      logger.debug('Crawl4AI is already installed');
    } catch {
      logger.info('Installing Crawl4AI...');
      try {
        await execAsync('pip install crawl4ai');
        logger.info('Crawl4AI installed successfully');
      } catch (error) {
        logger.error('Failed to install Crawl4AI:', error);
        throw new Error('Please install Crawl4AI manually: pip install crawl4ai');
      }
    }
  }

  /**
   * Verify Crawl4AI is working correctly
   * Runs a test crawl to ensure functionality
   */
  private async verifyCrawl4AI(): Promise<void> {
    try {
      const testScript = `
import asyncio
from crawl4ai import AsyncWebCrawler

async def test():
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url="https://www.example.com")
        return result.success

print(asyncio.run(test()))
`;
      
      const { stdout } = await execAsync(`python3 -c "${testScript}"`);
      if (stdout.trim() !== 'True') {
        throw new Error('Crawl4AI test failed');
      }
      logger.debug('Crawl4AI verification successful');
    } catch (error) {
      logger.error('Crawl4AI verification failed:', error);
      throw error;
    }
  }

  /**
   * Crawl a single URL using Crawl4AI
   * Handles USPTO-specific page structures
   */
  async crawl(url: string, options?: Partial<Crawl4AIConfig>): Promise<CrawlResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const config = { ...this.config, ...options };
    logger.info(`Crawling URL: ${url}`, { config });

    try {
      /**
       * Build Crawl4AI Python script
       * Dynamically generates script based on configuration
       */
      const script = this.buildCrawlScript(url, config);
      
      /**
       * Execute crawl via Python subprocess
       * Captures and parses the results
       */
      const { stdout, stderr } = await execAsync(`python3 -c "${script}"`, {
        timeout: config.timeout
      });

      if (stderr) {
        logger.warn('Crawl4AI stderr:', stderr);
      }

      /**
       * Parse crawl results
       * Extract structured data from Crawl4AI output
       */
      const result = JSON.parse(stdout);
      
      return {
        url,
        title: result.title,
        content: result.content,
        markdown: result.markdown,
        links: result.links,
        images: result.images,
        metadata: result.metadata,
        extractedData: result.extracted_data,
        success: result.success,
        error: result.error
      };

    } catch (error) {
      logger.error(`Failed to crawl ${url}:`, error);
      return {
        url,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Build Python script for Crawl4AI execution
   * Generates dynamic script based on crawl configuration
   */
  private buildCrawlScript(url: string, config: Crawl4AIConfig): string {
    return `
import asyncio
import json
from crawl4ai import AsyncWebCrawler
from crawl4ai.extraction_strategy import *

async def crawl():
    # Configure extraction strategy
    extraction_strategy = None
    ${this.getExtractionStrategyCode(config)}
    
    # Configure crawler
    async with AsyncWebCrawler(
        headless=${config.headless},
        user_agent="${config.userAgent}",
        verbose=False
    ) as crawler:
        # Perform crawl
        result = await crawler.arun(
            url="${url}",
            extraction_strategy=extraction_strategy,
            wait_for_selector="${config.waitForSelector || ''}",
            timeout=${config.timeout! / 1000}
        )
        
        # Format output
        output = {
            "success": result.success,
            "title": result.title if hasattr(result, 'title') else None,
            "content": result.text if hasattr(result, 'text') else None,
            "markdown": result.markdown if hasattr(result, 'markdown') else None,
            "links": result.links if hasattr(result, 'links') else [],
            "images": result.images if hasattr(result, 'images') else [],
            "metadata": result.metadata if hasattr(result, 'metadata') else {},
            "extracted_data": result.extracted_content if hasattr(result, 'extracted_content') else None,
            "error": result.error if hasattr(result, 'error') else None
        }
        
        return output

# Run and output JSON
result = asyncio.run(crawl())
print(json.dumps(result))
`;
  }

  /**
   * Get extraction strategy code based on configuration
   * Supports different extraction methods for USPTO data
   */
  private getExtractionStrategyCode(config: Crawl4AIConfig): string {
    switch (config.extractionStrategy) {
      case 'llm':
        return `
    extraction_strategy = LLMExtractionStrategy(
        provider="${config.llmProvider}",
        model="${config.llmModel}",
        instruction="Extract patent/trademark information including number, title, status, dates, and applicant details"
    )`;
      
      case 'css':
        return `
    extraction_strategy = CSSExtractionStrategy(
        selectors={
            "patent_number": "div.patent-number",
            "title": "h1.patent-title",
            "abstract": "div.abstract",
            "claims": "div.claims",
            "applicant": "span.applicant-name"
        }
    )`;
      
      case 'xpath':
        return `
    extraction_strategy = XPathExtractionStrategy(
        paths={
            "patent_number": "//div[@class='patent-number']/text()",
            "title": "//h1[@class='patent-title']/text()",
            "abstract": "//div[@class='abstract']/text()"
        }
    )`;
      
      default:
        return '# Auto extraction - let Crawl4AI decide';
    }
  }

  /**
   * Crawl multiple URLs in parallel
   * Efficiently handles bulk USPTO data extraction
   */
  async crawlMultiple(
    urls: string[],
    options?: Partial<Crawl4AIConfig>
  ): Promise<CrawlResult[]> {
    logger.info(`Crawling ${urls.length} URLs in parallel`);

    /**
     * Batch URLs for efficient processing
     * Prevents overwhelming the USPTO servers
     */
    const batchSize = 5;
    const results: CrawlResult[] = [];

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(url => this.crawl(url, options))
      );
      results.push(...batchResults);

      // Rate limiting to be respectful to USPTO servers
      if (i + batchSize < urls.length) {
        await this.delay(1000);
      }
    }

    return results;
  }

  /**
   * Smart crawl with content detection
   * Automatically identifies and extracts USPTO-specific content
   */
  async smartCrawl(url: string): Promise<CrawlResult> {
    logger.info(`Smart crawling: ${url}`);

    /**
     * First pass: Identify content type
     * Determines if page contains patent, trademark, or other data
     */
    const initialCrawl = await this.crawl(url, {
      extractionStrategy: 'auto'
    });

    if (!initialCrawl.success) {
      return initialCrawl;
    }

    /**
     * Analyze content to determine type
     * USPTO pages have distinct patterns
     */
    const contentType = this.identifyUSPTOContent(initialCrawl);

    /**
     * Second pass: Targeted extraction
     * Use specific strategy based on content type
     */
    const targetedOptions = this.getTargetedExtractionOptions(contentType);
    const finalCrawl = await this.crawl(url, targetedOptions);

    return {
      ...finalCrawl,
      metadata: {
        ...finalCrawl.metadata,
        contentType,
        twoPassExtraction: true
      }
    };
  }

  /**
   * Identify USPTO content type from initial crawl
   * Detects patents, trademarks, applications, etc.
   */
  private identifyUSPTOContent(crawlResult: CrawlResult): string {
    const content = (crawlResult.content || '').toLowerCase();
    const title = (crawlResult.title || '').toLowerCase();

    if (content.includes('patent') || title.includes('patent')) {
      if (content.includes('application')) return 'patent-application';
      if (content.includes('grant')) return 'patent-grant';
      return 'patent-general';
    }

    if (content.includes('trademark') || title.includes('trademark')) {
      if (content.includes('registration')) return 'trademark-registration';
      if (content.includes('application')) return 'trademark-application';
      return 'trademark-general';
    }

    if (content.includes('ptab') || content.includes('trial and appeal')) {
      return 'ptab-decision';
    }

    return 'general';
  }

  /**
   * Get targeted extraction options based on content type
   * Optimizes extraction for specific USPTO document types
   */
  private getTargetedExtractionOptions(contentType: string): Partial<Crawl4AIConfig> {
    switch (contentType) {
      case 'patent-application':
      case 'patent-grant':
        return {
          extractionStrategy: 'llm',
          llmModel: 'gpt-4',
          waitForSelector: 'div.patent-content'
        };

      case 'trademark-registration':
      case 'trademark-application':
        return {
          extractionStrategy: 'css',
          waitForSelector: 'div.trademark-details'
        };

      case 'ptab-decision':
        return {
          extractionStrategy: 'llm',
          llmModel: 'gpt-4',
          waitForSelector: 'div.decision-content'
        };

      default:
        return {
          extractionStrategy: 'auto'
        };
    }
  }

  /**
   * Extract structured data using AI
   * Uses LLM to parse complex USPTO documents
   */
  async extractWithAI(
    content: string,
    schema: any
  ): Promise<any> {
    logger.info('Extracting structured data with AI');

    const script = `
import asyncio
import json
from crawl4ai import AsyncWebCrawler
from crawl4ai.extraction_strategy import LLMExtractionStrategy

async def extract():
    extraction_strategy = LLMExtractionStrategy(
        provider="${this.config.llmProvider}",
        model="${this.config.llmModel}",
        instruction="Extract data according to the provided schema",
        schema=${JSON.stringify(schema)}
    )
    
    # Create mock result for extraction
    result = await extraction_strategy.extract(
        content="${content.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"
    )
    
    return result

result = asyncio.run(extract())
print(json.dumps(result))
`;

    try {
      const { stdout } = await execAsync(`python3 -c "${script}"`);
      return JSON.parse(stdout);
    } catch (error) {
      logger.error('AI extraction failed:', error);
      throw error;
    }
  }

  /**
   * Helper: Delay function for rate limiting
   * Prevents overwhelming USPTO servers
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   * Ensures proper shutdown of Crawl4AI
   */
  async cleanup(): Promise<void> {
    logger.info('Cleaning up Crawl4AI service');
    // Cleanup operations if needed
    this.isInitialized = false;
  }
}