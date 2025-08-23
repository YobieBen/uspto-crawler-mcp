#!/usr/bin/env python3
"""
Find Working USPTO APIs Script - 2025
Tests various endpoints and methods to find actually working USPTO data sources
"""

import requests
import json
from urllib3.exceptions import InsecureRequestWarning
import time
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

# Suppress SSL warnings for testing
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

class USPTOAPIFinder:
    def __init__(self):
        self.session = requests.Session()
        self.session.verify = False
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, application/xml, text/html, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive'
        })
        self.working_apis = {}

    def test_google_patents_scraping(self):
        """Test if we can scrape Google Patents"""
        print("\n=== Testing Google Patents Scraping ===")
        
        try:
            # Test basic search page
            url = "https://patents.google.com/"
            response = self.session.get(url, timeout=15)
            print(f"Google Patents homepage: {response.status_code}")
            
            if response.status_code == 200:
                # Try a search
                search_url = "https://patents.google.com/xhr/query"
                params = {
                    'url': 'q=artificial+intelligence&num=2',
                    'exp': '',
                    'content': '1'
                }
                
                search_response = self.session.get(search_url, params=params, timeout=10)
                print(f"Google Patents search: {search_response.status_code}")
                
                if search_response.status_code == 200:
                    print("✓ Google Patents is scrapable!")
                    self.working_apis['google_patents_scraping'] = {
                        'status': 'working',
                        'type': 'scraping',
                        'base_url': 'https://patents.google.com/',
                        'search_url': search_url,
                        'note': 'Can scrape search results and individual patents'
                    }
        
        except Exception as e:
            print(f"Google Patents error: {e}")

    def test_uspto_bulk_data(self):
        """Test USPTO bulk data downloads"""
        print("\n=== Testing USPTO Bulk Data Access ===")
        
        # Test various bulk data endpoints
        bulk_endpoints = [
            ("Open Data Portal", "https://data.uspto.gov/"),
            ("Bulk Data Products", "https://www.uspto.gov/learning-and-resources/bulk-data-products"),
            ("Patent Grant Full Text", "https://www.uspto.gov/patents/application-process/search-for-and-retrieve-patent-and-application-information"),
        ]
        
        for name, url in bulk_endpoints:
            try:
                response = self.session.get(url, timeout=10)
                print(f"{name}: {response.status_code}")
                
                if response.status_code == 200:
                    if 'bulk' in response.text.lower() or 'download' in response.text.lower():
                        print(f"✓ {name} - Bulk data available")
                        
                        # Check for specific file formats
                        if 'xml' in response.text.lower():
                            print(f"  - XML files available")
                        if 'json' in response.text.lower():
                            print(f"  - JSON files available")
                        if 'zip' in response.text.lower():
                            print(f"  - ZIP files available")
                        
                        self.working_apis[f'bulk_{name.lower().replace(" ", "_")}'] = {
                            'status': 'working',
                            'type': 'bulk_download',
                            'url': url,
                            'note': 'Bulk data files available for download'
                        }
            
            except Exception as e:
                print(f"{name} error: {e}")

    def test_alternative_patent_sources(self):
        """Test alternative patent data sources"""
        print("\n=== Testing Alternative Patent Data Sources ===")
        
        # Test various alternative sources
        alternatives = [
            ("Free Patents Online", "http://www.freepatentsonline.com/search.html"),
            ("Patent Lens", "https://www.lens.org/lens/"),
            ("WIPO Global Brand Database", "https://www3.wipo.int/branddb/en/"),
        ]
        
        for name, url in alternatives:
            try:
                response = self.session.get(url, timeout=10)
                print(f"{name}: {response.status_code}")
                
                if response.status_code == 200:
                    print(f"✓ {name} is accessible")
                    self.working_apis[f'alt_{name.lower().replace(" ", "_")}'] = {
                        'status': 'accessible',
                        'type': 'alternative_source',
                        'url': url,
                        'note': 'Alternative patent/trademark data source'
                    }
                    
            except Exception as e:
                print(f"{name} error: {e}")

    def test_uspto_xml_feeds(self):
        """Test USPTO XML data feeds"""
        print("\n=== Testing USPTO XML/RSS Feeds ===")
        
        # Test known XML endpoints
        xml_endpoints = [
            ("Patent Grant Data", "https://www.uspto.gov/patents/apply/status/application-status-search"),
            ("TSDR Status", "https://tsdrapi.uspto.gov/ts/cd/casestatus/sn88888888/info.xml"),
            ("Assignment Data", "https://assignment-api.uspto.gov/patent/search?query=test&format=xml"),
        ]
        
        for name, url in xml_endpoints:
            try:
                response = self.session.get(url, timeout=10)
                print(f"{name}: {response.status_code}")
                
                # Check if it's valid XML
                if response.status_code == 200:
                    try:
                        # Try to parse as XML
                        ET.fromstring(response.text)
                        print(f"✓ {name} - Valid XML response")
                        self.working_apis[f'xml_{name.lower().replace(" ", "_")}'] = {
                            'status': 'working',
                            'type': 'xml_api',
                            'url': url,
                            'note': 'Returns valid XML data'
                        }
                    except ET.ParseError:
                        if 'xml' in response.headers.get('content-type', '').lower():
                            print(f"~ {name} - Claims to be XML but malformed")
                        else:
                            print(f"~ {name} - Not XML format")
                
            except Exception as e:
                print(f"{name} error: {e}")

    def test_patent_public_search_deep(self):
        """Deep test of Patent Public Search for hidden APIs"""
        print("\n=== Deep Testing Patent Public Search ===")
        
        try:
            # Get the main page first
            main_url = "https://ppubs.uspto.gov/pubwebapp/"
            response = self.session.get(main_url, timeout=15)
            print(f"Patent Public Search main page: {response.status_code}")
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Look for API endpoints in JavaScript
                scripts = soup.find_all('script')
                api_clues = []
                
                for script in scripts:
                    if script.string:
                        text = script.string
                        # Look for API-like URLs
                        if '/api/' in text or 'search' in text or 'query' in text:
                            lines = text.split('\n')
                            for line in lines:
                                if any(word in line.lower() for word in ['/api/', 'search', 'query', 'patent']):
                                    if 'http' in line or '/' in line:
                                        api_clues.append(line.strip())
                
                if api_clues:
                    print("Found potential API endpoints:")
                    for clue in api_clues[:10]:  # Show first 10
                        print(f"  {clue}")
                
                # Try to find the actual search functionality
                try:
                    # Look for forms that might indicate search endpoints
                    forms = soup.find_all('form')
                    for form in forms:
                        action = form.get('action', '')
                        if action:
                            print(f"Form action found: {action}")
                            
                            # Try to construct full URL
                            if action.startswith('/'):
                                full_url = f"https://ppubs.uspto.gov{action}"
                                print(f"Testing form endpoint: {full_url}")
                                
                                # Try a simple GET to see if it responds
                                try:
                                    test_response = self.session.get(full_url, timeout=5)
                                    if test_response.status_code in [200, 400, 405]:  # 400/405 might mean it expects POST
                                        print(f"✓ Form endpoint responsive: {test_response.status_code}")
                                        self.working_apis[f'search_form_{len(self.working_apis)}'] = {
                                            'status': 'responsive',
                                            'type': 'search_endpoint',
                                            'url': full_url,
                                            'note': f'Form endpoint, HTTP {test_response.status_code}'
                                        }
                                except:
                                    pass
                
                except Exception as e:
                    print(f"Error analyzing page: {e}")
                    
        except Exception as e:
            print(f"Patent Public Search deep test error: {e}")

    def test_known_working_endpoints(self):
        """Test endpoints that should theoretically work"""
        print("\n=== Testing Known/Documented Endpoints ===")
        
        endpoints_to_test = [
            # Current PatentsView
            ("PatentsView Legacy", "https://api.patentsview.org/"),
            ("PatentsView New", "https://search.patentsview.org/api/v1/"),
            
            # USPTO Official APIs
            ("USPTO Developer Portal", "https://developer.uspto.gov/api-catalog"),
            ("USPTO Open Data", "https://data.uspto.gov/api/"),
            
            # Assignment API
            ("Patent Assignment Search", "https://assignment-api.uspto.gov/patent/search"),
            
            # TSDR API
            ("TSDR Info", "https://tsdrapi.uspto.gov/ts/cd/casestatus/info"),
            
            # PAIR API (if exists)
            ("PAIR", "https://portal.uspto.gov/pair/")
        ]
        
        for name, url in endpoints_to_test:
            try:
                response = self.session.get(url, timeout=10)
                print(f"{name}: {response.status_code}")
                
                if response.status_code == 200:
                    content_type = response.headers.get('content-type', '')
                    print(f"  Content-Type: {content_type}")
                    
                    # Check if it looks like an API
                    if 'json' in content_type:
                        try:
                            data = response.json()
                            print(f"✓ {name} - Valid JSON API")
                            self.working_apis[f'api_{name.lower().replace(" ", "_")}'] = {
                                'status': 'working',
                                'type': 'json_api',
                                'url': url,
                                'note': 'Returns valid JSON'
                            }
                        except:
                            print(f"~ {name} - Claims JSON but invalid")
                    
                    elif 'xml' in content_type:
                        print(f"✓ {name} - XML API")
                        self.working_apis[f'xml_api_{name.lower().replace(" ", "_")}'] = {
                            'status': 'working',
                            'type': 'xml_api',
                            'url': url,
                            'note': 'Returns XML data'
                        }
                    
                    else:
                        print(f"~ {name} - Web interface ({content_type})")
                        self.working_apis[f'web_{name.lower().replace(" ", "_")}'] = {
                            'status': 'web_interface',
                            'type': 'html',
                            'url': url,
                            'note': 'Web interface, may be scrapable'
                        }
                        
                elif response.status_code in [401, 403]:
                    print(f"~ {name} - Requires authentication ({response.status_code})")
                    self.working_apis[f'auth_{name.lower().replace(" ", "_")}'] = {
                        'status': 'requires_auth',
                        'type': 'api',
                        'url': url,
                        'note': f'Requires authentication (HTTP {response.status_code})'
                    }
                    
            except Exception as e:
                print(f"{name} error: {str(e)[:50]}...")

    def run_comprehensive_test(self):
        """Run all tests"""
        print("=" * 80)
        print("COMPREHENSIVE USPTO API DISCOVERY - 2025")
        print("=" * 80)
        
        self.test_google_patents_scraping()
        self.test_uspto_bulk_data()
        self.test_alternative_patent_sources()
        self.test_uspto_xml_feeds()
        self.test_patent_public_search_deep()
        self.test_known_working_endpoints()
        
        print("\n" + "=" * 80)
        print("SUMMARY OF DISCOVERIES")
        print("=" * 80)
        
        if self.working_apis:
            # Group by type
            by_type = {}
            for name, info in self.working_apis.items():
                api_type = info['type']
                if api_type not in by_type:
                    by_type[api_type] = []
                by_type[api_type].append((name, info))
            
            for api_type, apis in by_type.items():
                print(f"\n{api_type.upper().replace('_', ' ')}:")
                for name, info in apis:
                    print(f"  ✓ {name}")
                    print(f"    URL: {info['url']}")
                    print(f"    Status: {info['status']}")
                    print(f"    Note: {info['note']}")
        else:
            print("❌ No working APIs discovered")
        
        print(f"\nTotal discoveries: {len(self.working_apis)}")
        
        # Save results
        with open('working_apis_discovery.json', 'w') as f:
            json.dump(self.working_apis, f, indent=2)
        
        print("Results saved to working_apis_discovery.json")
        
        return self.working_apis

def main():
    finder = USPTOAPIFinder()
    results = finder.run_comprehensive_test()
    
    # Additional suggestions
    print("\n" + "=" * 80)
    print("RECOMMENDATIONS FOR WORKING DATA ACCESS")
    print("=" * 80)
    
    recommendations = []
    
    if 'google_patents_scraping' in results:
        recommendations.append("1. Google Patents Scraping - Most reliable for patent data")
    
    bulk_apis = [k for k in results.keys() if 'bulk' in k]
    if bulk_apis:
        recommendations.append("2. USPTO Bulk Data Downloads - Good for large datasets")
    
    working_apis = [k for k in results.keys() if results[k]['status'] == 'working']
    if working_apis:
        recommendations.append("3. Direct API Access - Some APIs are still functional")
    
    auth_apis = [k for k in results.keys() if results[k]['status'] == 'requires_auth']
    if auth_apis:
        recommendations.append("4. Authenticated APIs - May work with proper credentials")
    
    if recommendations:
        for rec in recommendations:
            print(rec)
    else:
        print("Consider using alternative patent databases or APIs")
    
    print("=" * 80)

if __name__ == "__main__":
    main()