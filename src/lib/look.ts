import { PUBLIC_WP_URL, wcFetch, getProductById } from './woocommerce';

export async function getLookOfTheWeekData() {
    try {
        const data = await wcFetch('wp/v2/look-semana?per_page=1&_embed');
        if (!data || !Array.isArray(data) || data.length === 0) return null;
        
        const look = data[0];
        if (!look) return null;

        const product1Id = look.custom_fields?.look_producto_1;
        const product2Id = look.custom_fields?.look_producto_2;
        const productIds = [product1Id, product2Id].filter(id => !!id);

        const products = await Promise.all(productIds.map(async (id) => {
            let product = await getProductById(id);
            if (product) {
                return optimizeImages(product);
            }
            return null;
        }));

        return {
            id: look.id,
            look_titulo: look.custom_fields?.look_titulo || look.title.rendered,
            look_descripcion: look.custom_fields?.look_descripcion || look.content.rendered,
            look_imagen: look.custom_fields?.look_imagen || look._embedded?.['wp:featuredmedia']?.[0]?.source_url,
            products: products.filter(p => p !== null)
        };
    } catch (e) {
        console.error("[getLookOfTheWeekData] Error fetching look of the week:", e);
        return null;
    }
}

function optimizeImages(data: any): any {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(item => optimizeImages(item));
    if (typeof data === 'object') {
        const newData = { ...data };
        for (const key in newData) {
            if (key === 'src' && typeof newData[key] === 'string') {
                // Mantener la URL original (WP servirá el JPG/PNG correcto)
                newData[key] = newData[key];
            } else {
                newData[key] = optimizeImages(newData[key]);
            }
        }
        return newData;
    }
    return data;
}
