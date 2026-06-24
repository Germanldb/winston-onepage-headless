import dns from 'node:dns';

// DNS hack
const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);
const originalLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
    let actualOptions = options;
    let actualCallback = callback;
    if (typeof options === 'function') {
        actualCallback = options;
        actualOptions = {};
    }
    if (hostname === 'tienda.winstonandharrystore.com') {
        resolver.resolve4(hostname, (err, addresses) => {
            if (err || !addresses || addresses.length === 0) {
                return originalLookup(hostname, actualOptions, actualCallback);
            }
            actualCallback(null, addresses[0], 4);
        });
    } else {
        originalLookup(hostname, actualOptions, actualCallback);
    }
};

async function check() {
    const res = await fetch('https://tienda.winstonandharrystore.com/wp-json/wp/v2/product_cat?slug=gorras');
    const cat = await res.json();
    console.log('Category ID:', cat[0].id);

    const ck = 'ck_e23fcefbab651d6ed85cd7ed90bb598df9d43501';
    const cs = 'cs_9ccb4408dc31969ed4a02d8d85f8fbce1d45ab02';
    const auth = Buffer.from(ck + ':' + cs).toString('base64');

    const wpRes = await fetch('https://tienda.winstonandharrystore.com/wp-json/wc/store/products?category=' + cat[0].id);
    const data = await wpRes.json();
    console.log('Total in WC Store API:', data.length);
    if(data.length > 0) {
        console.log('Price:', data[0].prices);
        console.log('In Stock:', data[0].is_in_stock);
        console.log('Status:', data[0].status);
    }
}
check().catch(console.error);
