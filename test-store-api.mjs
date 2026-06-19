import fetch from 'node-fetch';

async function testStoreAPI() {
    const WC_URL = 'https://tienda.winstonandharrystore.com';

    try {
        console.log('1. Fetching Cart...');
        const cartRes = await fetch(`${WC_URL}/wp-json/wc/store/v1/cart`);
        const cartToken = cartRes.headers.get('Cart-Token') || '';
        const nonce = cartRes.headers.get('Nonce') || '';
        console.log('Cart-Token:', cartToken);
        console.log('Nonce:', nonce);

        console.log('2. Adding Item...');
        const addRes = await fetch(`${WC_URL}/wp-json/wc/store/v1/cart/add-item`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cart-Token': cartToken,
                'Nonce': nonce
            },
            body: JSON.stringify({
                id: 33, // Just a guess, let's see if 33 exists, if not it returns 400
                quantity: 1
            })
        });
        const addData = await addRes.json();
        console.log('Add Item Result:', addRes.status, addData);

    } catch (e) {
        console.error('Error:', e.message);
    }
}

testStoreAPI();
