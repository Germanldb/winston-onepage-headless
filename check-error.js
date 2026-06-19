const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  await page.goto('http://localhost:4321/productos/barranquilla', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
