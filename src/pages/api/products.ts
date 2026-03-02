import type { APIRoute } from 'astro';
import { getProductBySlug, getProductsByCategory } from '../../lib/woocommerce';

export const GET: APIRoute = async ({ url }) => {
    const pageStr = url.searchParams.get('p') || url.searchParams.get('page') || '1';
    const page = parseInt(pageStr);
    const slug = url.searchParams.get('slug');

    try {
        // 1. DETALLE DEL PRODUCTO INDIVIDUAL
        if (slug) {
            let product = await getProductBySlug(slug);

            if (!product) {
                return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
            }

            // Optimizamos las imágenes del producto (añadimos .webp)
            product = optimizeImages(product);

            return new Response(JSON.stringify(product), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
                }
            });
        }

        // 2. LISTADO POR CATEGORÍA
        const category = url.searchParams.get('category') || '63';
        let allProducts = await getProductsByCategory(category, 100, page);

        // Optimizamos las imágenes de toda la lista
        allProducts = optimizeImages(allProducts);

        return new Response(JSON.stringify(allProducts), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};

/**
 * Función auxiliar para añadir .webp a las URLs de imágenes de WordPress de forma recursiva.
 */
function optimizeImages(data: any): any {
    if (!data) return data;

    if (Array.isArray(data)) {
        return data.map(item => optimizeImages(item));
    }

    if (typeof data === 'object') {
        const newData = { ...data };
        for (const key in newData) {
            if (key === 'src' && typeof newData[key] === 'string') {
                // Solo si es una URL de WordPress y no tiene ya .webp
                if (newData[key].includes('wp-content/uploads') && !newData[key].toLowerCase().endsWith('.webp')) {
                    // Limpieza de sufijos de edición de WordPress (-e1755...)
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
