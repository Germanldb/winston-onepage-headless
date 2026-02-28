import type { APIRoute } from 'astro';

// Cache in-memory
let cachedLook: any = null;
let lastLookFetch = 0;
const LOOK_CACHE_DURATION = 1000 * 60 * 60; // 1 Hora

export const GET: APIRoute = async () => {
    try {
        const now = Date.now();

        // Check Cache
        if (cachedLook && (now - lastLookFetch < LOOK_CACHE_DURATION)) {
            return new Response(JSON.stringify(cachedLook), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
                }
            });
        }

        const response = await fetch('https://winstonandharrystore.com/wp-json/wp/v2/look-semana?per_page=1&_embed');

        if (!response.ok) {
            return new Response(JSON.stringify({ error: 'Failed to fetch look of the week' }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await response.json();
        const look = data[0];

        if (!look) {
            return new Response(JSON.stringify({ error: 'No look found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // IDs de productos desde Meta Boxes
        const product1Id = look.custom_fields?.look_producto_1;
        const product2Id = look.custom_fields?.look_producto_2;

        const productIds = [product1Id, product2Id].filter(id => !!id);

        // Procesamos los productos para extraer variaciones e imágenes (Mapa de colores)
        const products = await Promise.all(productIds.map(async (id) => {
            try {
                const pRes = await fetch(`https://winstonandharrystore.com/wp-json/wc/store/v1/products/${id}`);
                if (!pRes.ok) return null;

                let product = await pRes.json();

                // SI el producto es variable, necesitamos cargar sus variaciones para el mapa de colores
                if (product.type === 'variable' && product.variations) {
                    const colorAttr = product.attributes.find((a: any) => a.name.toLowerCase().includes('color'));
                    if (colorAttr && colorAttr.terms) {
                        const variationImages: any = {};
                        const colors = colorAttr.terms.map((t: any) => t.slug);

                        await Promise.all(colors.map(async (colorSlug: string) => {
                            // Encontramos la variación por color. A veces es .value, a veces .option
                            const variation = product.variations.find((v: any) =>
                                v.attributes && v.attributes.some((attr: any) =>
                                    (attr.value?.toLowerCase() === colorSlug.toLowerCase()) ||
                                    (attr.option?.toLowerCase() === colorSlug.toLowerCase())
                                )
                            );

                            if (variation) {
                                try {
                                    const varRes = await fetch(`https://winstonandharrystore.com/wp-json/wc/store/v1/products/${variation.id}`);
                                    if (varRes.ok) {
                                        const varData = await varRes.json();
                                        if (varData.images && varData.images.length > 0) {
                                            variationImages[colorSlug] = varData.images;
                                        }
                                    }
                                } catch (e) { }
                            }
                        }));
                        product.variation_images_map = variationImages;
                    }
                }

                return optimizeImages(product);
            } catch (e) {
                console.error(`Error processing product ${id}:`, e);
                return null;
            }
        }));

        const result = {
            id: look.id,
            look_titulo: look.custom_fields?.look_titulo || look.title.rendered,
            look_descripcion: look.custom_fields?.look_descripcion || look.content.rendered,
            look_imagen: look.custom_fields?.look_imagen || look._embedded?.['wp:featuredmedia']?.[0]?.source_url,
            products: products.filter(p => p !== null)
        };

        // Guardar en cache local
        cachedLook = result;
        lastLookFetch = now;

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

/**
 * Función auxiliar para añadir .webp a las URLs de imágenes (Recursiva)
 */
function optimizeImages(data: any): any {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(item => optimizeImages(item));
    if (typeof data === 'object') {
        const newData = { ...data };
        for (const key in newData) {
            if (key === 'src' && typeof newData[key] === 'string') {
                if (newData[key].includes('wp-content/uploads') && !newData[key].toLowerCase().endsWith('.webp')) {
                    let cleanSrc = newData[key].replace(/-e\d+(?=\.(jpg|jpeg|png))/i, '');
                    newData[key] = `${cleanSrc}.webp`;
                }
            } else {
                newData[key] = optimizeImages(newData[key]);
            }
        }
        return newData;
    }
    return data;
}
