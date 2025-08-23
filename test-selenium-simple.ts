/**
 * Simple Selenium Test
 * Test basic Selenium functionality
 */

import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

async function testBasicSelenium() {
  console.log('Testing basic Selenium functionality...\n');

  const options = new chrome.Options();
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-blink-features=AutomationControlled');
  options.excludeSwitches('enable-automation');
  // Uncomment to run headless
  // options.addArguments('--headless=new');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    // Test 1: Navigate to a simple page
    console.log('1. Navigating to example.com...');
    await driver.get('https://www.example.com');
    const title = await driver.getTitle();
    console.log(`   ✓ Page title: ${title}`);

    // Test 2: Find an element
    const h1 = await driver.findElement(By.css('h1'));
    const h1Text = await h1.getText();
    console.log(`   ✓ H1 text: ${h1Text}`);

    // Test 3: Try USPTO homepage
    console.log('\n2. Navigating to USPTO.gov...');
    await driver.get('https://www.uspto.gov');
    await driver.wait(until.titleContains('USPTO'), 5000);
    const usptoTitle = await driver.getTitle();
    console.log(`   ✓ USPTO page title: ${usptoTitle}`);

    // Test 4: Try Patent Public Search
    console.log('\n3. Navigating to Patent Public Search...');
    await driver.get('https://ppubs.uspto.gov/pubwebapp/');
    
    // Wait a bit for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to find any input field
    try {
      const inputs = await driver.findElements(By.css('input'));
      console.log(`   ✓ Found ${inputs.length} input fields on page`);
      
      if (inputs.length > 0) {
        // Check if any are search fields
        for (let i = 0; i < Math.min(inputs.length, 5); i++) {
          const type = await inputs[i].getAttribute('type');
          const placeholder = await inputs[i].getAttribute('placeholder');
          const name = await inputs[i].getAttribute('name');
          console.log(`     Input ${i}: type="${type}", placeholder="${placeholder}", name="${name}"`);
        }
      }
    } catch (error) {
      console.log('   ✗ Could not find input fields');
    }

    // Take a screenshot
    console.log('\n4. Taking screenshot...');
    const screenshot = await driver.takeScreenshot();
    console.log(`   ✓ Screenshot taken (${screenshot.length} bytes)`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('\n5. Closing browser...');
    await driver.quit();
    console.log('   ✓ Browser closed');
  }

  console.log('\nTest complete!');
}

testBasicSelenium().catch(console.error);