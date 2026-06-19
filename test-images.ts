import { getProductBySlug } from './src/lib/woocommerce.ts';

async function test() {
    const p = await getProductBySlug('sueter-amares');
    if (p) {
        console.log('--- Product Images ---');
        console.log(p.images?.length);
        console.log('--- Variation Images Map ---');
        Object.keys(p.variation_images_map || {}).forEach(k => {
            console.log(k, '=>', p.variation_images_map[k].length, 'images');
            console.log(p.variation_images_map[k].map(i => i.src));
        });
    } else {
        console.log('Not found');
    }
}
test();
