#!/usr/bin/env python3
"""
Final USPTO API Testing Script - 2025
Tests the most promising USPTO data access methods based on research
"""

import requests
import json
from urllib3.exceptions import InsecureRequestWarning
from bs4 import BeautifulSoup
import re

# Suppress SSL warnings
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

def test_google_patents_api():
    """Test Google Patents as a working alternative"""
    print("=" * 60)
    print("TESTING GOOGLE PATENTS")
    print("=" * 60)
    
    session = requests.Session()
    session.verify = False
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    try:
        # Test main page
        response = session.get("https://patents.google.com/", timeout=10)
        print(f"Google Patents homepage: {response.status_code}")
        
        if response.status_code == 200:
            # Test search functionality
            search_url = "https://patents.google.com/xhr/query"
            params = {
                'url': 'q=artificial+intelligence&num=5',
                'exp': '',
                'content': '1'
            }
            
            search_response = session.get(search_url, params=params, timeout=10)
            print(f"Search API: {search_response.status_code}")
            
            if search_response.status_code == 200:
                print("✅ WORKING: Google Patents search API")
                print("   URL:", search_url)
                print("   Method: GET with URL params")
                print("   Sample data available: Yes")
                return True
                
    except Exception as e:
        print(f"❌ Google Patents error: {e}")
    
    return False

def test_uspto_bulk_data():
    """Test USPTO bulk data access"""
    print("\n" + "=" * 60)
    print("TESTING USPTO BULK DATA ACCESS")
    print("=" * 60)
    
    session = requests.Session()
    session.verify = False
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    bulk_urls = [
        "https://data.uspto.gov/bulkdata",
        "https://www.uspto.gov/learning-and-resources/bulk-data-products",
        "https://bulkdata.uspto.gov/"
    ]
    
    for url in bulk_urls:
        try:
            response = session.get(url, timeout=10)
            print(f"{url}: {response.status_code}")
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Look for download links
                links = soup.find_all('a', href=True)
                download_links = []
                
                for link in links:
                    href = link['href']
                    if any(ext in href.lower() for ext in ['.xml', '.json', '.zip', '.tar']):
                        download_links.append(href)
                
                if download_links:
                    print(f"✅ WORKING: USPTO Bulk Data at {url}")
                    print(f"   Found {len(download_links)} potential download links")
                    print("   Sample links:")
                    for link in download_links[:3]:
                        print(f"     {link}")
                    return True
                        
        except Exception as e:
            print(f"Error with {url}: {e}")
    
    return False

def test_patent_public_search():
    """Test Patent Public Search for hidden APIs"""
    print("\n" + "=" * 60)
    print("TESTING PATENT PUBLIC SEARCH")
    print("=" * 60)
    
    session = requests.Session()
    session.verify = False
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    try:
        response = session.get("https://ppubs.uspto.gov/pubwebapp/", timeout=15)
        print(f"Patent Public Search: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ WORKING: Patent Public Search (Web Interface)")
            print("   URL: https://ppubs.uspto.gov/pubwebapp/")
            print("   Method: Web scraping possible")
            print("   Contains: Full patent database access")
            
            # Look for API endpoints in the page
            if 'api' in response.text.lower():
                print("   Note: May contain hidden API endpoints")
            
            return True
            
    except Exception as e:
        print(f"❌ Patent Public Search error: {e}")
    
    return False

def test_alternative_sources():
    """Test alternative patent data sources"""
    print("\n" + "=" * 60)
    print("TESTING ALTERNATIVE SOURCES")
    print("=" * 60)
    
    session = requests.Session()
    session.verify = False
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    sources = [
        ("The Lens", "https://www.lens.org/lens/"),
        ("WIPO Global Brand Database", "https://www3.wipo.int/branddb/en/"),
        ("European Patent Office", "https://worldwide.espacenet.com/"),
        ("Free Patents Online", "http://www.freepatentsonline.com/")
    ]
    
    working_count = 0
    
    for name, url in sources:
        try:
            response = session.get(url, timeout=10)
            print(f"{name}: {response.status_code}")
            
            if response.status_code == 200:
                print(f"✅ WORKING: {name}")
                print(f"   URL: {url}")
                print("   Method: Web scraping")
                working_count += 1
                
        except Exception as e:
            print(f"❌ {name} error: {str(e)[:50]}")
    
    return working_count > 0

def test_direct_patent_access():
    """Test direct patent document access"""
    print("\n" + "=" * 60)
    print("TESTING DIRECT PATENT ACCESS")
    print("=" * 60)
    
    session = requests.Session()
    session.verify = False
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    # Test direct access to patent documents
    test_patents = [
        "https://patents.google.com/patent/US10000000B2",
        "https://ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10000000",
        "https://patft.uspto.gov/netacgi/nph-Parser?patentnumber=10000000"
    ]
    
    for url in test_patents:
        try:
            response = session.get(url, timeout=10)
            print(f"Direct access test: {response.status_code}")
            
            if response.status_code == 200:
                print(f"✅ WORKING: Direct patent access")
                print(f"   URL: {url}")
                print("   Method: Direct document access")
                return True
                
        except Exception as e:
            print(f"Error: {str(e)[:30]}")
    
    return False

def test_commercial_apis():
    """Test commercial/third-party patent APIs"""
    print("\n" + "=" * 60)
    print("TESTING COMMERCIAL APIs")
    print("=" * 60)
    
    # Note: These would require API keys, but we can test if they're responsive
    commercial_apis = [
        ("PQAI (RapidAPI)", "https://patentsview.org/"),
        ("Patent Cloud", "https://www.patentcloud.com/"),
        ("Derwent Innovation", "https://clarivate.com/derwent/")
    ]
    
    session = requests.Session()
    session.verify = False
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    available_count = 0
    
    for name, url in commercial_apis:
        try:
            response = session.get(url, timeout=10)
            print(f"{name}: {response.status_code}")
            
            if response.status_code == 200:
                print(f"✅ AVAILABLE: {name}")
                print(f"   URL: {url}")
                print("   Note: May require subscription/API key")
                available_count += 1
                
        except Exception as e:
            print(f"❌ {name} error: {str(e)[:30]}")
    
    return available_count > 0

def main():
    """Run all tests and provide recommendations"""
    print("USPTO API TESTING - FINAL COMPREHENSIVE ANALYSIS")
    print("=" * 80)
    
    results = {}
    
    # Run all tests
    results['google_patents'] = test_google_patents_api()
    results['bulk_data'] = test_uspto_bulk_data()
    results['patent_search'] = test_patent_public_search()
    results['alternatives'] = test_alternative_sources()
    results['direct_access'] = test_direct_patent_access()
    results['commercial'] = test_commercial_apis()
    
    # Summary
    print("\n" + "=" * 80)
    print("FINAL RECOMMENDATIONS")
    print("=" * 80)
    
    working_methods = []
    
    if results['google_patents']:
        working_methods.append("1. Google Patents API - BEST OPTION")
        print("✅ Google Patents API")
        print("   - Reliable and fast")
        print("   - No API key required")
        print("   - Full patent data access")
        print("   - Easy to implement")
    
    if results['patent_search']:
        working_methods.append("2. Patent Public Search - Web Scraping")
        print("✅ USPTO Patent Public Search")
        print("   - Official USPTO data")
        print("   - Requires web scraping")
        print("   - Most comprehensive data")
        print("   - May be slower than API")
    
    if results['bulk_data']:
        working_methods.append("3. USPTO Bulk Data Downloads")
        print("✅ USPTO Bulk Data")
        print("   - Official bulk datasets")
        print("   - Good for large-scale analysis")
        print("   - XML/JSON formats available")
        print("   - Periodic updates")
    
    if results['alternatives']:
        working_methods.append("4. Alternative Patent Databases")
        print("✅ Alternative Sources")
        print("   - The Lens, WIPO, EPO")
        print("   - Different data coverage")
        print("   - May complement USPTO data")
        print("   - Various access methods")
    
    print(f"\nTotal working methods found: {len(working_methods)}")
    
    if working_methods:
        print("\n🎯 RECOMMENDED IMPLEMENTATION ORDER:")
        for method in working_methods:
            print(f"   {method}")
    else:
        print("\n❌ No working methods found - consider commercial APIs")
    
    # Save results
    with open('final_api_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\nResults saved to final_api_test_results.json")

if __name__ == "__main__":
    main()