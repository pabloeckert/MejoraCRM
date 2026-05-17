import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/');
  
  // Wait for load
  await page.waitForTimeout(5000);
  
  console.log('--- PAGE TITLE ---');
  console.log(await page.title());
  
  console.log('\n--- ACCESSIBILITY TREE (LINKS) ---');
  const links = await page.getByRole('link').all();
  for (const link of links) {
    console.log(await link.evaluate(node => ({
      text: node.innerText,
      ariaLabel: node.getAttribute('aria-label'),
      role: node.getAttribute('role'),
      visible: node.offsetParent !== null
    })));
  }

  console.log('\n--- BUTTONS ---');
  const buttons = await page.getByRole('button').all();
  for (const button of buttons) {
    console.log(await button.evaluate(node => ({
      text: node.innerText,
      ariaLabel: node.getAttribute('aria-label'),
      visible: node.offsetParent !== null
    })));
  }

  await page.screenshot({ path: 'debug-screenshot.png' });
  await browser.close();
})();
