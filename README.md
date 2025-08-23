# USPTO Crawler MCP - Patent & Trademark Web Scraper

**Author: Yobie Benjamin**  
**Version: 0.2**  
**Date: July 28, 2025**

## Overview

A specialized web crawler and scraper for the US Patent and Trademark Office (USPTO) website, built with Crawl4AI and MCP (Model Context Protocol) integration. This tool makes it easy to search, extract, and analyze patent and trademark data from the notoriously difficult-to-navigate USPTO databases.  This is work-in-progress and is far from perfect.  It will require some tuning especially on the frontend interface. I would be thrilled if the opensource community will contribute some tweaks to improve the overall app.  Thank you. 

## Features

### 🔍 Smart USPTO Navigation
- **Patent Search**: Search PatFT (granted patents) and AppFT (applications)
- **Trademark Search**: Query TESS database with advanced filters
- **Status Checking**: Real-time application status via PAIR and TSDR
- **Bulk Extraction**: Process multiple patents/trademarks efficiently

### 🤖 Crawl4AI Integration
- **AI-Powered Extraction**: Uses LLM to understand complex USPTO pages
- **Smart Content Detection**: Automatically identifies patent vs trademark content
- **Adaptive Crawling**: Adjusts strategy based on page structure
- **Rate Limiting**: Respectful crawling to avoid overwhelming USPTO servers

### 💻 User-Friendly Interface
- **React Frontend**: Modern, responsive web interface
- **Real-time Updates**: WebSocket connection for progress tracking
- **Export Options**: Download results as JSON, CSV, or Excel
- **Search History**: Track and replay previous searches

### 🔌 MCP Integration
- **Claude Desktop Compatible**: Use directly from Claude via MCP
- **Standalone API**: REST API for programmatic access
- **WebSocket Support**: Real-time streaming of results

## Installation

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ with pip
- Chrome/Chromium (for Crawl4AI)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yobieben/uspto-crawler-mcp.git
cd uspto-crawler-mcp

# Install Node dependencies
npm install

# Install Python dependencies (Crawl4AI)
pip install crawl4ai playwright
playwright install chromium

# Install frontend dependencies
cd frontend
npm install
cd ..

# Start the application
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- MCP Server: Via stdio

### MCP Configuration

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "uspto-crawler": {
      "command": "node",
      "args": ["/path/to/uspto-crawler-mcp/dist/mcp/index.js"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## Usage

### Web Interface

1. **Search Patents/Trademarks**:
   - Select search type (Patent or Trademark)
   - Enter search criteria
   - Click Search
   - View and export results

2. **Check Application Status**:
   - Go to Status Check tab
   - Enter application/serial number
   - Select type (Patent/Trademark)
   - View current status

3. **Bulk Extraction**:
   - Go to Bulk Extract tab
   - Upload list of numbers or URLs
   - Select extraction type
   - Download results when complete

### MCP Tools

Available tools when using via Claude:

- `uspto_patent_search`: Search patent databases
- `uspto_trademark_search`: Search trademark databases
- `uspto_advanced_search`: Combined search with multiple criteria
- `uspto_status_check`: Check application status
- `uspto_bulk_extract`: Extract data from multiple sources

### API Endpoints

```bash
# Search patents
POST /api/patents/search
{
  "query": "artificial intelligence",
  "inventor": "John Doe",
  "dateFrom": "2020-01-01",
  "dateTo": "2025-01-01",
  "limit": 20
}

# Search trademarks
POST /api/trademarks/search
{
  "query": "NIKE",
  "owner": "Nike Inc",
  "status": "live",
  "limit": 20
}

# Check status
GET /api/status/patent/16123456
GET /api/status/trademark/88123456

# Bulk extraction
POST /api/extract/bulk
{
  "numbers": ["16123456", "16234567"],
  "extractType": "full",
  "format": "json"
}
```

## USPTO Databases Supported

### Patent Databases
- **PatFT**: Full-Text Database (granted patents from 1976)
- **AppFT**: Published Applications (from 2001)
- **Patent Public Search**: New unified search system
- **PAIR**: Patent Application Information Retrieval

### Trademark Databases
- **TESS**: Trademark Electronic Search System
- **TSDR**: Trademark Status & Document Retrieval
- **ID Manual**: Acceptable Identification of Goods/Services

## Advanced Features

### Smart Crawling Strategies

The crawler automatically adapts to different USPTO page types:

1. **Patent Pages**:
   - Extracts patent number, title, abstract
   - Captures inventors, assignees, claims
   - Downloads PDFs when available

2. **Trademark Pages**:
   - Extracts mark text, owner information
   - Captures goods/services descriptions
   - Downloads mark images

3. **Search Results**:
   - Paginates through results automatically
   - Maintains session for complex searches
   - Handles CAPTCHA detection

### Data Extraction Options

- **Summary**: Basic information only
- **Full**: Complete document with all sections
- **Status**: Current status and prosecution history
- **Custom**: Specify exact fields to extract

### Export Formats

- **JSON**: Structured data with all fields
- **CSV**: Tabular format for spreadsheets
- **Excel**: Formatted workbook with multiple sheets
- **PDF**: Formatted reports (coming soon)

## Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3001
LOG_LEVEL=info

# Crawl4AI Configuration
CRAWL4AI_HEADLESS=true
CRAWL4AI_TIMEOUT=30000
CRAWL4AI_USER_AGENT="USPTO-Crawler/0.2"

# AI Configuration (for LLM extraction)
OPENAI_API_KEY=your_api_key  # Optional
LLM_PROVIDER=openai
LLM_MODEL=gpt-4

# Rate Limiting
MAX_CONCURRENT_CRAWLS=5
DELAY_BETWEEN_REQUESTS=1000
```

### Custom Extraction Rules

Create custom extraction rules in `config/extraction-rules.json`:

```json
{
  "patent": {
    "selectors": {
      "title": "h1.patent-title",
      "abstract": "div.abstract",
      "claims": "div.claims"
    }
  },
  "trademark": {
    "selectors": {
      "mark": "div.mark-text",
      "owner": "span.owner-name",
      "status": "div.status-container"
    }
  }
}
```

## Troubleshooting

### Common Issues

#### Crawl4AI Installation Failed
```bash
# Install with specific version
pip install crawl4ai==0.3.0

# Install Playwright browsers
playwright install chromium
```

#### USPTO Rate Limiting
- The crawler includes automatic rate limiting
- If blocked, wait 15 minutes before retrying
- Consider using proxy rotation for large-scale extraction

#### No Results Found
- USPTO search syntax is specific
- Try simpler queries first
- Check date ranges are valid
- Verify classification codes

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

View Crawl4AI logs:

```bash
tail -f logs/crawl4ai.log
```

## Performance

### Optimization Tips

1. **Batch Processing**: Use bulk extraction for multiple items
2. **Caching**: Results are cached for 24 hours
3. **Parallel Crawling**: Up to 5 concurrent crawls by default
4. **Smart Routing**: AI determines optimal extraction strategy

### Benchmarks

- Single patent search: ~2-3 seconds
- Bulk extraction (100 items): ~5 minutes
- Full patent download: ~5 seconds
- Status check: ~1 second

## Legal Notice

This tool is for educational and research purposes. Please:
- Respect USPTO's terms of service
- Use reasonable rate limiting
- Don't overwhelm USPTO servers
- Cite USPTO as the data source

## Contributing

Contributions are welcome! Areas for improvement:

- Additional extraction strategies
- Support for more USPTO databases
- Enhanced AI extraction rules
- Performance optimizations
- UI/UX improvements

## License

MIT License - See LICENSE file

## Support

- **Issues**: [GitHub Issues](https://github.com/yobieben/uspto-crawler-mcp/issues)
- **Documentation**: [Wiki](https://github.com/yobieben/uspto-crawler-mcp/wiki)
- **Email**: yobie.benjamin@example.com

## Acknowledgments

- [Crawl4AI](https://github.com/unclecode/crawl4ai) for the amazing crawling framework
- USPTO for providing public access to patent and trademark data
- Anthropic for the MCP protocol
- The open-source community

---

**Built with ❤️ by Yobie Benjamin**  
*Making USPTO data accessible to everyone*
