/**
 * Test Selenium USPTO Service
 * 
 * Author: Yobie Benjamin
 * Version: 0.3
 * Date: August 23, 2025
 */

import { SeleniumUSPTOService } from './src/services/selenium-uspto-service.js';

async function testSelenium() {
  console.log('='.repeat(60));
  console.log('Testing Selenium USPTO Service');
  console.log('='.repeat(60));

  const selenium = new SeleniumUSPTOService({
    browser: 'chrome',
    headless: false, // Set to false to see browser in action
    antiDetection: true
  });

  try {
    // Initialize driver
    console.log('\n1. Initializing Selenium WebDriver...');
    await selenium.initialize();
    console.log('   ✓ WebDriver initialized');

    // Test Patent Public Search
    console.log('\n2. Testing Patent Public Search...');
    const patents = await selenium.searchPatents('artificial intelligence', 5);
    
    console.log(`   ✓ Found ${patents.length} patents`);
    
    if (patents.length > 0) {
      console.log('\n   First patent:');
      const first = patents[0];
      console.log(`   - Number: ${first.patentNumber || 'N/A'}`);
      console.log(`   - Title: ${first.title || 'N/A'}`);
      console.log(`   - Abstract: ${(first.abstract || 'N/A').substring(0, 100)}...`);
      console.log(`   - URL: ${first.url || 'N/A'}`);
    }

    // Test Google Patents as fallback
    console.log('\n3. Testing Google Patents (fallback)...');
    const googlePatents = await selenium.searchGooglePatents('blockchain', 3);
    
    console.log(`   ✓ Found ${googlePatents.length} patents from Google`);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up
    console.log('\n4. Cleaning up...');
    await selenium.cleanup();
    console.log('   ✓ WebDriver closed');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test complete!');
  console.log('='.repeat(60));
}

// Run test
testSelenium().catch(console.error);