#!/usr/bin/env python3
"""
Test Crawl4AI Basic Functionality
Author: Yobie Benjamin
Version: 0.2
Date: July 28, 2025
"""

import asyncio
import json
from crawl4ai import AsyncWebCrawler

async def test_simple_crawl():
    """Test crawling a simple webpage"""
    print("Testing Crawl4AI with a simple webpage...")
    
    async with AsyncWebCrawler(
        headless=True,
        verbose=True
    ) as crawler:
        # Test with a simple page first
        result = await crawler.arun(url="https://www.example.com")
        
        print(f"Success: {result.success}")
        print(f"Title: {result.title if hasattr(result, 'title') else 'N/A'}")
        print(f"Content length: {len(result.text) if hasattr(result, 'text') else 0}")
        
        return result.success

async def test_uspto_patent_search():
    """Test crawling USPTO patent search"""
    print("\nTesting USPTO Patent Search...")
    
    async with AsyncWebCrawler(
        headless=True,
        verbose=True,
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    ) as crawler:
        # Try USPTO patent search
        url = "https://patft.uspto.gov/netahtml/PTO/search-bool.html"
        
        result = await crawler.arun(
            url=url,
            wait_for_selector="form",
            timeout=30
        )
        
        print(f"Success: {result.success}")
        if result.success:
            print(f"Page title: {result.title if hasattr(result, 'title') else 'N/A'}")
            print(f"Content preview: {result.text[:200] if hasattr(result, 'text') else 'N/A'}...")
        else:
            print(f"Error: {result.error if hasattr(result, 'error') else 'Unknown error'}")
        
        return result

async def test_uspto_direct():
    """Test direct USPTO access"""
    print("\nTesting direct USPTO access with requests...")
    
    import aiohttp
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    async with aiohttp.ClientSession() as session:
        # Test PatFT search page
        async with session.get(
            "https://patft.uspto.gov/netahtml/PTO/search-bool.html",
            headers=headers
        ) as response:
            print(f"PatFT Status: {response.status}")
            if response.status == 200:
                content = await response.text()
                print(f"PatFT Content length: {len(content)}")
                print("PatFT works with direct request!")
        
        # Test TESS trademark search
        async with session.get(
            "https://tmsearch.uspto.gov/search/search-information",
            headers=headers
        ) as response:
            print(f"TESS Status: {response.status}")
            if response.status == 200:
                print("TESS works with direct request!")

async def main():
    """Run all tests"""
    try:
        # Test basic functionality
        success = await test_simple_crawl()
        
        if success:
            # Test USPTO
            result = await test_uspto_patent_search()
            
            # Test direct access as comparison
            await test_uspto_direct()
        else:
            print("Basic Crawl4AI test failed. Check installation.")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())