const https = require('https');

const url = 'https://tienda.winstonandharrystore.com/wp-json/wc/store/v1/checkout';

const req = https.request(url, {
    method: 'OPTIONS',
    headers: {
        'Accept': 'application/json'
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            const schema = parsed.schema;
            const billing = schema.properties.billing_address;
            const shipping = schema.properties.shipping_address;
            console.log("BILLING ADDRESS REQUIRED:", billing.required);
            console.log("BILLING ADDRESS PROPS:", Object.keys(billing.properties));
            console.log("SHIPPING ADDRESS REQUIRED:", shipping.required);
            console.log("SHIPPING ADDRESS PROPS:", Object.keys(shipping.properties));
        } catch (e) {
            console.log(data.substring(0, 500));
        }
    });
});
req.on('error', console.error);
req.end();
