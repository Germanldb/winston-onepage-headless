import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const pageStr = url.searchParams.get('page') || '1';
    const page = parseInt(pageStr);
    const slug = url.searchParams.get('slug');

    try {
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
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600'
                }
            });
        }

        // 2. LISTADO PARA EL HOME - Usamos paginación directa de WC para mayor consistencia
        const wcPage = page;
        const wcPerPage = 12;

        const wcResponse = await fetch(
            `https://winstonandharrystore.com/wp-json/wc/store/v1/products?category=63&per_page=${wcPerPage}&page=${wcPage}&orderby=date&order=desc&_cv=${Date.now()}`,
            {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            }
        );

        if (!wcResponse.ok) return new Response(JSON.stringify({ error: 'API Error' }), { status: wcResponse.status });

        const resultProducts = await wcResponse.json();

        return new Response(JSON.stringify(resultProducts), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'CDN-Cache-Control': 'no-store',
                'Vercel-CDN-Cache-Control': 'no-store'
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
