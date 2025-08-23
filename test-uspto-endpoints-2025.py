#!/usr/bin/env python3
"""
Comprehensive USPTO API Testing Script - 2025 Edition
Tests all available USPTO APIs and alternative patent data sources
Author: Yobie Benjamin
Date: August 23, 2025
"""

import asyncio
import aiohttp
import json
import ssl
import requests
from urllib3.exceptions import InsecureRequestWarning
from urllib.parse import urlencode
import time
from typing import Dict, List, Any

# Suppress SSL warnings for testing
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

class USPTOAPITester:
    def __init__(self):
        # Create SSL context that bypasses verification
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE
        
        # Standard headers
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/html, application/xml, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        }
        
        # Results storage
        self.results = {}

    async def test_patentsview_new_api(self):
        """Test the new PatentsView Search API v2 (2024-2025)"""
        print("\n1. Testing PatentsView Search API v2 (New 2024-2025)...")
        
        try:
            # Try the new PatentsView Search API
            connector = aiohttp.TCPConnector(ssl=self.ssl_context)
            async with aiohttp.ClientSession(connector=connector, headers=self.headers) as session:
                
                # Test basic search endpoint
                search_url = "https://search.patentsview.org/api/v1/patent/"
                params = {
                    "q": json.dumps({
                        "patent_title": "artificial intelligence"
                    }),
                    "f": json.dumps([
                        "patent_id", "patent_title", "patent_date", 
                        "inventor_name", "assignee_organization"
                    ]),
                    "s": json.dumps([{"patent_date": "desc"}]),
                    "o": json.dumps({"per_page": 3})
                }
                
                async with session.get(search_url, params=params, timeout=aiohttp.ClientTimeout(total=15)) as response:
                    print(f"   Status: {response.status}")
                    if response.status == 200:
                        data = await response.json()
                        if data.get('patents'):
                            print(f"   ✓ SUCCESS! Found {len(data['patents'])} patents")
                            for patent in data['patents'][:2]:
                                print(f"     - {patent.get('patent_id', 'N/A')}: {patent.get('patent_title', 'No title')[:50]}...")
                            self.results['patentsview_v2'] = {
                                'status': 'working',
                                'endpoint': search_url,
                                'sample_data': data['patents'][:2]
                            }
                        else:
                            print("   ⚠ No patents found")
                    else:
                        text = await response.text()
                        print(f"   ✗ Failed with response: {text[:200]}...")
                        
        except Exception as e:
            print(f"   ✗ Error: {str(e)[:100]}...")
            
            # Try alternative endpoint
            try:
                alt_url = "https://api.patentsview.org/patents/query"
                params = {
                    "q": '{"_text_any":{"patent_title":"machine learning"}}',
                    "f": '["patent_number","patent_title","patent_date"]',
                    "o": '{"per_page":3}'
                }
                
                async with aiohttp.ClientSession(connector=connector, headers=self.headers) as session:
                    async with session.get(alt_url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                        print(f"   Fallback API Status: {response.status}")
                        if response.status == 200:
                            data = await response.json()
                            if data.get('patents'):
                                print(f"   ✓ Fallback SUCCESS! Found {len(data['patents'])} patents")
                                self.results['patentsview_legacy'] = {
                                    'status': 'working',
                                    'endpoint': alt_url,
                                    'sample_data': data['patents'][:2]
                                }
            except Exception as fallback_error:
                print(f"   ✗ Fallback also failed: {str(fallback_error)[:50]}...")

    async def test_uspto_open_data_portal(self):
        """Test USPTO Open Data Portal APIs"""
        print("\n2. Testing USPTO Open Data Portal (ODP) APIs...")
        
        connector = aiohttp.TCPConnector(ssl=self.ssl_context)
        
        # Test various ODP endpoints
        endpoints_to_test = [
            {
                'name': 'PTAB API v2',
                'url': 'https://developer.uspto.gov/ptab-api/swagger-ui/index.html',
                'api_url': 'https://api.uspto.gov/ptab/v2/search'
            },
            {
                'name': 'Patent Assignment API',
                'url': 'https://assignment-api.uspto.gov/patent/swaggerui/index.html',
                'api_url': 'https://assignment-api.uspto.gov/patent/search'
            },
            {
                'name': 'TSDR Data API',
                'url': 'https://developer.uspto.gov/api-catalog/tsdr-data-api',
                'api_url': 'https://tsdrapi.uspto.gov/ts/cd/casestatus/sn79218695/info.json'
            }
        ]
        
        async with aiohttp.ClientSession(connector=connector, headers=self.headers) as session:
            for endpoint in endpoints_to_test:
                try:
                    print(f"   Testing {endpoint['name']}...")
                    
                    # Test the API endpoint
                    async with session.get(endpoint['api_url'], timeout=aiohttp.ClientTimeout(total=10)) as response:
                        print(f"     Status: {response.status}")
                        if response.status == 200:
                            content_type = response.headers.get('content-type', '')
                            if 'json' in content_type:
                                data = await response.json()
                                print(f"     ✓ SUCCESS! JSON response received")
                                self.results[endpoint['name'].lower().replace(' ', '_')] = {
                                    'status': 'working',
                                    'endpoint': endpoint['api_url'],
                                    'content_type': content_type
                                }
                            else:
                                text = await response.text()
                                print(f"     ✓ SUCCESS! Response length: {len(text)} characters")
                                
                except Exception as e:
                    print(f"     ✗ Error: {str(e)[:50]}...")

    async def test_patent_public_search(self):
        """Test USPTO Patent Public Search interface"""
        print("\n3. Testing USPTO Patent Public Search...")
        
        try:
            connector = aiohttp.TCPConnector(ssl=self.ssl_context)
            async with aiohttp.ClientSession(connector=connector, headers=self.headers) as session:
                
                # Test main Patent Public Search page
                url = "https://ppubs.uspto.gov/pubwebapp/"
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
                    print(f"   Status: {response.status}")
                    if response.status == 200:
                        text = await response.text()
                        if "Patent Public Search" in text:
                            print("   ✓ SUCCESS! Patent Public Search is accessible")
                            
                            # Try to find API endpoints in the page
                            if "api/" in text or "search/v1" in text:
                                print("   ✓ Potential API endpoints found in page")
                            
                            self.results['patent_public_search'] = {
                                'status': 'accessible',
                                'endpoint': url,
                                'note': 'Web interface accessible, may have hidden APIs'
                            }
                        
                # Try potential API endpoints
                api_endpoints = [
                    "https://ppubs.uspto.gov/pubwebapp/api/search",
                    "https://ppubs.uspto.gov/dirsearch-public/patents/searchpost",
                    "https://ppubs.uspto.gov/dirsearch-public/searches"
                ]
                
                for api_url in api_endpoints:
                    try:
                        async with session.get(api_url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                            print(f"   API endpoint {api_url}: Status {response.status}")
                            if response.status in [200, 400, 405]:  # 400/405 might indicate endpoint exists but needs proper params
                                print(f"   ✓ Potential API endpoint found!")
                                self.results[f'patent_search_api_{len(self.results)}'] = {
                                    'status': 'potential',
                                    'endpoint': api_url,
                                    'http_status': response.status
                                }
                    except:
                        pass
                        
        except Exception as e:
            print(f"   ✗ Error: {str(e)[:100]}...")

    async def test_bulk_data_access(self):
        """Test USPTO Bulk Data downloads"""
        print("\n4. Testing USPTO Bulk Data Access...")
        
        try:
            connector = aiohttp.TCPConnector(ssl=self.ssl_context)
            async with aiohttp.ClientSession(connector=connector, headers=self.headers) as session:
                
                # Test bulk data portal
                bulk_urls = [
                    "https://data.uspto.gov/",
                    "https://data.uspto.gov/bulkdata",
                    "https://bulkdata.uspto.gov/"
                ]
                
                for url in bulk_urls:
                    try:
                        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                            print(f"   {url}: Status {response.status}")
                            if response.status == 200:
                                text = await response.text()
                                if any(term in text.lower() for term in ['bulk', 'xml', 'json', 'download']):
                                    print(f"   ✓ SUCCESS! Bulk data portal accessible")
                                    self.results['bulk_data_portal'] = {
                                        'status': 'working',
                                        'endpoint': url,
                                        'note': 'Bulk data downloads available'
                                    }
                                    break
                    except Exception as e:
                        print(f"   ✗ {url} failed: {str(e)[:30]}...")
                        
        except Exception as e:
            print(f"   ✗ Error: {str(e)[:50]}...")

    async def test_alternative_apis(self):
        """Test alternative patent APIs"""
        print("\n5. Testing Alternative Patent APIs...")
        
        connector = aiohttp.TCPConnector(ssl=self.ssl_context)
        
        # Google Patents Public Datasets
        try:
            print("   Testing Google Patents...")
            # Google doesn't have a direct API, but has public datasets
            # We can test if we can access Google Patents pages
            async with aiohttp.ClientSession(connector=connector, headers=self.headers) as session:
                google_url = "https://patents.google.com/"
                async with session.get(google_url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        print("   ✓ Google Patents accessible (no direct API, but web scraping possible)")
                        self.results['google_patents'] = {
                            'status': 'web_accessible',
                            'endpoint': google_url,
                            'note': 'Web scraping possible, no direct API'
                        }
        except Exception as e:
            print(f"   ✗ Google Patents error: {str(e)[:50]}...")
        
        # European Patent Office OPS
        try:
            print("   Testing EPO OPS API...")
            async with aiohttp.ClientSession(connector=connector, headers=self.headers) as session:
                epo_url = "https://ops.epo.org/3.2/rest-services/published-data/search/biblio"
                params = {"q": "artificial intelligence"}
                async with session.get(epo_url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    print(f"   EPO OPS Status: {response.status}")
                    if response.status in [200, 400, 401]:  # 401 might mean auth required
                        print("   ✓ EPO OPS API endpoint responsive")
                        self.results['epo_ops'] = {
                            'status': 'responsive',
                            'endpoint': epo_url,
                            'note': 'May require authentication'
                        }
        except Exception as e:
            print(f"   ✗ EPO OPS error: {str(e)[:50]}...")

    def test_sync_requests(self):
        """Test synchronous requests with requests library"""
        print("\n6. Testing with synchronous requests (bypassing SSL)...")
        
        # Configure requests to ignore SSL
        session = requests.Session()
        session.verify = False
        session.headers.update(self.headers)
        
        # Test PatentsView with sync requests
        try:
            print("   Testing PatentsView (sync)...")
            url = "https://api.patentsview.org/patents/query"
            params = {
                "q": '{"_text_any":{"patent_title":"blockchain"}}',
                "f": '["patent_number","patent_title","patent_date"]',
                "o": '{"per_page":2}'
            }
            
            response = session.get(url, params=params, timeout=15)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('patents'):
                    print(f"   ✓ SUCCESS! Found {len(data['patents'])} patents")
                    for patent in data['patents']:
                        print(f"     - {patent['patent_number']}: {patent['patent_title'][:40]}...")
                    self.results['patentsview_sync'] = {
                        'status': 'working',
                        'endpoint': url,
                        'method': 'synchronous',
                        'sample_data': data['patents']
                    }
            
        except Exception as e:
            print(f"   ✗ Sync PatentsView error: {str(e)[:50]}...")
        
        # Test other endpoints synchronously
        test_urls = [
            ("USPTO Developer Portal", "https://developer.uspto.gov/"),
            ("TSDR API", "https://tsdrapi.uspto.gov/ts/cd/casestatus/sn88123456/info.xml"),
            ("Patent Assignment", "https://assignment-api.uspto.gov/patent/search?query=artificial")
        ]
        
        for name, url in test_urls:
            try:
                print(f"   Testing {name} (sync)...")
                response = session.get(url, timeout=10)
                print(f"   {name} Status: {response.status_code}")
                if response.status_code == 200:
                    print(f"   ✓ {name} accessible!")
                    self.results[f'{name.lower().replace(" ", "_")}_sync'] = {
                        'status': 'accessible',
                        'endpoint': url,
                        'method': 'synchronous'
                    }
            except Exception as e:
                print(f"   ✗ {name} error: {str(e)[:30]}...")

    async def run_all_tests(self):
        """Run all tests"""
        print("=" * 80)
        print("USPTO API Comprehensive Testing - 2025 Edition")
        print("=" * 80)
        
        await self.test_patentsview_new_api()
        await self.test_uspto_open_data_portal()
        await self.test_patent_public_search()
        await self.test_bulk_data_access()
        await self.test_alternative_apis()
        self.test_sync_requests()
        
        print("\n" + "=" * 80)
        print("SUMMARY OF WORKING ENDPOINTS")
        print("=" * 80)
        
        if self.results:
            for name, info in self.results.items():
                status = info['status']
                endpoint = info['endpoint']
                print(f"✓ {name.upper()}")
                print(f"  Status: {status}")
                print(f"  Endpoint: {endpoint}")
                if 'note' in info:
                    print(f"  Note: {info['note']}")
                if 'sample_data' in info:
                    print(f"  Sample data available: {len(info['sample_data'])} items")
                print()
        else:
            print("❌ No working endpoints found")
        
        print("=" * 80)
        print(f"Testing completed. Found {len(self.results)} working/accessible endpoints.")
        return self.results

async def main():
    tester = USPTOAPITester()
    results = await tester.run_all_tests()
    
    # Save results to file
    with open('uspto_api_test_results.json', 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\nResults saved to uspto_api_test_results.json")
    return results

if __name__ == "__main__":
    asyncio.run(main())