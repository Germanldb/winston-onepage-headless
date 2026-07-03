
const { JSDOM } = require('jsdom');
const html = \
  <html>
    <head></head>
    <body>
      <script id='ga4-view-item' data-product-id='123' data-product-price='100' data-product-name='Test'>
        window.dataLayer = [];
        function fireViewItem() {
          var el = document.getElementById('ga4-view-item');
          if (!el) { console.log('el not found'); return; }
          if (el.getAttribute('data-fired') === 'true') { console.log('already fired'); return; }
          el.setAttribute('data-fired', 'true');
          console.log('Pushing to datalayer');
          window.dataLayer.push({ event: 'view_item' });
        }
        if (document.readyState !== 'loading') fireViewItem();
        else document.addEventListener('DOMContentLoaded', fireViewItem);
      </script>
    </body>
  </html>
\;
const dom = new JSDOM(html, { runScripts: 'dangerously' });
setTimeout(() => {
  console.log('Events:', dom.window.dataLayer);
}, 1000);

