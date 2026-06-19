import fs from 'fs';
fetch("https://tienda.winstonandharrystore.com/wp-json/wc/v3/payment_gateways?consumer_key=ck_d5f469acc9358b69a4032bf9e54c5ecb01f0dc2f&consumer_secret=cs_8799e998019ffc7c66ab19f508ee2cba769ee7dc")
.then(r => r.json())
.then(data => {
    console.log(data.filter(g => g.enabled).map(g => `${g.id}: ${g.title}`));
});
