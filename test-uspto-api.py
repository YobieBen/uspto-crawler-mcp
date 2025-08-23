#!/usr/bin/env python3
"""
Test USPTO Public APIs and Alternative Access Methods
Author: Yobie Benjamin
Version: 0.2
Date: July 28, 2025
"""

import asyncio
import aiohttp
import json

async def test_uspto_apis():
    """Test various USPTO APIs and endpoints"""
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/html, */*'
    }
    
    async with aiohttp.ClientSession() as session:
        # Test 1: USPTO Developer API (PatentsView)
        print("1. Testing PatentsView API...")
        try:
            async with session.get(
                "https://api.patentsview.org/patents/query",
                params={
                    "q": json.dumps({"_text_any": {"patent_title": "artificial intelligence"}}),
                    "f": json.dumps(["patent_number", "patent_title", "patent_date"]),
                    "o": json.dumps({"per_page": 5})
                },
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                print(f"   Status: {response.status}")
                if response.status == 200:
                    data = await response.json()
                    print(f"   Found {data.get('total_patent_count', 0)} patents")
                    if data.get('patents'):
                        for patent in data['patents'][:2]:
                            print(f"   - {patent.get('patent_number')}: {patent.get('patent_title')}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Test 2: USPTO Assignment API
        print("\n2. Testing USPTO Assignment API...")
        try:
            async with session.get(
                "https://assignment-api.uspto.gov/patent/search",
                params={
                    "query": "artificial intelligence",
                    "rows": 5
                },
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                print(f"   Status: {response.status}")
                if response.status == 200:
                    text = await response.text()
                    print(f"   Response length: {len(text)}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Test 3: USPTO PEDS (Patent Examination Data System)
        print("\n3. Testing USPTO PEDS API...")
        try:
            async with session.get(
                "https://ped.uspto.gov/api/queries",
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                print(f"   Status: {response.status}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Test 4: USPTO Open Data Portal
        print("\n4. Testing USPTO Open Data Portal...")
        try:
            async with session.get(
                "https://developer.uspto.gov/api-catalog",
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                print(f"   Status: {response.status}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Test 5: Google Patents (alternative source)
        print("\n5. Testing Google Patents as alternative...")
        try:
            async with session.get(
                "https://patents.google.com/xhr/query",
                params={
                    "url": "q=artificial+intelligence&oq=artificial+intelligence",
                    "exp": "",
                    "content": "1"
                },
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                print(f"   Status: {response.status}")
                if response.status == 200:
                    text = await response.text()
                    print(f"   Response length: {len(text)}")
        except Exception as e:
            print(f"   Error: {e}")

async def test_simple_scraping():
    """Test simple web scraping with requests"""
    print("\n6. Testing simple scraping approach...")
    
    import requests
    from bs4 import BeautifulSoup
    
    # Test USPTO search page availability
    try:
        response = requests.get(
            "https://ppubs.uspto.gov/pubwebapp/",
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout=10
        )
        print(f"   Patent Public Search status: {response.status_code}")
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            title = soup.find('title')
            print(f"   Page title: {title.text if title else 'N/A'}")
    except Exception as e:
        print(f"   Error: {e}")

def test_sync_approach():
    """Test synchronous approach with requests"""
    print("\n7. Testing synchronous requests...")
    
    import requests
    
    # PatentsView API - synchronous
    try:
        response = requests.get(
            "https://api.patentsview.org/patents/query",
            params={
                "q": '{"_text_any":{"patent_title":"machine learning"}}',
                "f": '["patent_number","patent_title","patent_date"]',
                "o": '{"per_page":3}'
            },
            headers={
                'User-Agent': 'USPTO-Crawler/0.2'
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"   SUCCESS! Found {data.get('total_patent_count', 0)} patents")
            for patent in data.get('patents', [])[:3]:
                print(f"   - {patent['patent_number']}: {patent['patent_title'][:50]}...")
            return True
    except Exception as e:
        print(f"   Error: {e}")
    
    return False

async def main():
    """Run all tests"""
    print("=" * 60)
    print("USPTO API and Access Testing")
    print("=" * 60)
    
    # Test APIs
    await test_uspto_apis()
    
    # Test simple scraping
    await test_simple_scraping()
    
    # Test synchronous approach
    test_sync_approach()
    
    print("\n" + "=" * 60)
    print("Testing complete!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())