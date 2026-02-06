import type { APIRoute } from 'astro';

export const ALL: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const pageStr = url.searchParams.get('p') || url.searchParams.get('page') || '1';
    const page = parseInt(pageStr);
    const slug = url.searchParams.get('slug');

    try {
        // ... (resto del código del producto individual se mantiene)
        // 1. DETALLE DEL PRODUCTO
        if (slug) {
            const res = await fetch(`https://winstonandharrystore.com/wp-json/wc/store/v1/products?slug=${slug}`);
            if (!res.ok) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

            const data = await res.json();
            const product = data.find((p: any) => p && p.attributes && Array.isArray(p.attributes) && p.attributes.length > 0) || data[0];

            if (product && product.type === 'variable' && product.variations) {
                const colorAttr = product.attributes.find((a: any) => a.name.toLowerCase().includes('color'));
                if (colorAttr && colorAttr.terms) {
                    const variationImages: any = {};
                    const colors = colorAttr.terms.map((t: any) => t.slug);

                    await Promise.all(colors.map(async (colorSlug: string) => {
                        const variation = product.variations.find((v: any) =>
                            v.attributes && v.attributes.some((attr: any) => attr.value.toLowerCase() === colorSlug.toLowerCase())
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

            return new Response(JSON.stringify(product), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
                }
            });
        }

        // 2. LISTADO PARA EL HOME - Aplicamos caché agresivo para evitar los 8s de espera
        const wcResponse = await fetch(
            `https://winstonandharrystore.com/wp-json/wc/store/v1/products?category=63&per_page=100&orderby=date&order=desc`,
            {
                method: 'GET',
                // Eliminamos la cache-control de la petición externa para que Vercel pueda cachear la respuesta
            }
        );

        if (!wcResponse.ok) return new Response(JSON.stringify({ error: 'API Error' }), { status: wcResponse.status });

        const allProducts = await wcResponse.json();

        return new Response(JSON.stringify(allProducts), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
