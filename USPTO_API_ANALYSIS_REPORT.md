# USPTO API Analysis Report - August 2025

## Executive Summary

After comprehensive testing of USPTO data access methods in August 2025, I've identified **3 working solutions** for accessing patent and trademark data, with Google Patents API being the most reliable option.

## Working Data Sources

### 1. 🏆 Google Patents API - **RECOMMENDED**

**Status**: ✅ FULLY WORKING  
**API Endpoint**: `https://patents.google.com/xhr/query`  
**Authentication**: None required  
**Rate Limits**: Unknown (appears generous)

#### API Parameters:
```
GET https://patents.google.com/xhr/query?url=q%3D{query}%26num%3D{count}&exp=&content=1
```

#### Sample Response Structure:
```json
{
  "results": {
    "total_num_results": 125816,
    "total_num_pages": 100,
    "cluster": [{
      "result": [{
        "id": "patent/US11074495B2/en",
        "patent": {
          "title": "System and method for artificial intelligence...",
          "snippet": "Specification covers new algorithms...",
          "priority_date": "2013-02-28",
          "filing_date": "2018-03-12",
          "grant_date": "2021-07-27",
          "publication_date": "2021-07-27",
          "inventor": "Lotfi A. Zadeh",
          "assignee": "Z Advanced Computing, Inc.",
          "publication_number": "US11074495B2",
          "pdf": "path/to/pdf",
          "figures": [...]
        }
      }]
    }]
  }
}
```

#### Implementation Example:
```python
import requests

def search_google_patents(query, num_results=10):
    url = "https://patents.google.com/xhr/query"
    params = {
        'url': f'q={query}&num={num_results}',
        'exp': '',
        'content': '1'
    }
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json()
    return None
```

#### Advantages:
- ✅ No API key required
- ✅ High-quality structured data
- ✅ Includes PDF links and figures
- ✅ Fast response times
- ✅ Comprehensive patent coverage
- ✅ Rich metadata (inventors, assignees, dates)

### 2. USPTO Patent Public Search - Web Scraping

**Status**: ✅ ACCESSIBLE  
**URL**: `https://ppubs.uspto.gov/pubwebapp/`  
**Method**: Web scraping

#### Implementation Approach:
- Use Selenium or similar for JavaScript-heavy interface
- Parse search results from HTML
- Extract patent details from individual patent pages

#### Advantages:
- ✅ Official USPTO data
- ✅ Most comprehensive coverage
- ✅ Always up-to-date

#### Disadvantages:
- ⚠️ Requires complex scraping
- ⚠️ May be slower than APIs
- ⚠️ Potential rate limiting

### 3. USPTO Bulk Data Downloads

**Status**: ✅ AVAILABLE  
**Portal**: `https://data.uspto.gov/bulkdata`  
**Formats**: XML, JSON, ZIP files

#### Use Cases:
- Large-scale data analysis
- Historical patent data
- Offline processing

## Non-Working APIs (As of August 2025)

### ❌ PatentsView API v1 (Legacy)
- **Status**: `410 Gone` - Discontinued
- **Error**: `{"error":true, "reason":"discontinued"}`
- **Migration**: Users directed to new PatentsView Search API

### ❌ PatentsView Search API v2 
- **Status**: `403 Forbidden` 
- **Error**: `"You do not have permission to perform this action."`
- **Issue**: Requires API key/registration (process unclear)

### ❌ USPTO Assignment API
- **Status**: `404 Not Found`
- **URL**: `https://assignment-api.uspto.gov/patent/search`

### ❌ TSDR API
- **Status**: `401 Unauthorized`
- **Issue**: Requires API key since October 2020

## Alternative Patent Databases

### Working Alternatives:

1. **The Lens** - `https://www.lens.org/lens/`
   - Status: ✅ Accessible
   - Coverage: Global patent data
   - Method: Web scraping possible

2. **WIPO Global Brand Database** - `https://www3.wipo.int/branddb/en/`
   - Status: ✅ Accessible  
   - Coverage: International trademarks
   - Method: Web interface

3. **European Patent Office (Espacenet)** - `https://worldwide.espacenet.com/`
   - Status: ⚠️ Mixed (some restrictions)
   - Coverage: European and global patents

## Implementation Recommendations

### For Immediate Implementation:

1. **Primary**: Use Google Patents API
   - Implement the working endpoint shown above
   - Add error handling and rate limiting
   - Parse JSON response for patent data

2. **Backup**: Patent Public Search scraping
   - Implement Selenium-based scraper
   - Use for data not available in Google Patents

### For the USPTO Crawler Project:

```typescript
// Update simple-uspto-service.ts
async searchPatentsViaGoogleAPI(query: string, limit: number = 20): Promise<PatentSearchResult[]> {
    const url = 'https://patents.google.com/xhr/query';
    const params = {
        url: `q=${encodeURIComponent(query)}&num=${limit}`,
        exp: '',
        content: '1'
    };
    
    const response = await this.axiosInstance.get(url, { params });
    
    if (response.data?.results?.cluster) {
        return this.parseGooglePatentsResponse(response.data);
    }
    
    return [];
}

private parseGooglePatentsResponse(data: any): PatentSearchResult[] {
    const results: PatentSearchResult[] = [];
    
    data.results.cluster.forEach((cluster: any) => {
        cluster.result.forEach((result: any) => {
            if (result.patent) {
                const patent = result.patent;
                results.push({
                    patentNumber: patent.publication_number || 'N/A',
                    title: this.stripHtml(patent.title) || 'Untitled',
                    abstract: this.stripHtml(patent.snippet) || 'No abstract',
                    inventors: patent.inventor ? [patent.inventor] : ['Not listed'],
                    applicant: patent.assignee || 'Not listed',
                    filingDate: patent.filing_date || 'N/A',
                    grantDate: patent.grant_date || 'N/A',
                    url: `https://patents.google.com/${result.id}`
                });
            }
        });
    });
    
    return results;
}
```

## Key Findings

1. **Legacy APIs Discontinued**: Most traditional USPTO APIs are either discontinued or require API keys that are difficult to obtain.

2. **Google Patents is the Winner**: Google Patents provides the best balance of accessibility, data quality, and ease of implementation.

3. **USPTO Web Interfaces Work**: Direct scraping of USPTO websites remains viable but requires more complex implementation.

4. **API Key Requirements**: Many official USPTO APIs now require registration and API keys, with unclear approval processes.

## Next Steps

1. **Implement Google Patents API** in the current USPTO crawler project
2. **Remove deprecated PatentsView API calls** 
3. **Add USPTO Patent Public Search scraping** as a secondary source
4. **Test rate limits** for Google Patents API
5. **Consider caching** to minimize API calls

## Testing Results Summary

- ✅ Google Patents API: **WORKING**
- ✅ USPTO Patent Public Search: **ACCESSIBLE** 
- ✅ USPTO Bulk Data Portal: **AVAILABLE**
- ❌ PatentsView v1: **DISCONTINUED**
- ❌ PatentsView v2: **ACCESS DENIED**
- ❌ USPTO Assignment API: **NOT FOUND**
- ❌ TSDR API: **AUTH REQUIRED**

**Total Working Methods**: 3/7 tested
**Recommended Implementation**: Google Patents API + Patent Public Search scraping