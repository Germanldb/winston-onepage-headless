import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
    try {
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

        // We need to fetch the full product data for product_1 and product_2
        // Since we only have the IDs from Meta Boxes
        const product1Id = look.custom_fields?.look_producto_1;
        const product2Id = look.custom_fields?.look_producto_2;

        const [product1Res, product2Res] = await Promise.all([
            product1Id ? fetch(`https://winstonandharrystore.com/wp-json/wc/store/v1/products/${product1Id}`) : null,
            product2Id ? fetch(`https://winstonandharrystore.com/wp-json/wc/store/v1/products/${product2Id}`) : null
        ]);

        const product1 = product1Res && product1Res.ok ? await product1Res.json() : null;
        const product2 = product2Res && product2Res.ok ? await product2Res.json() : null;

        const result = {
            id: look.id,
            look_titulo: look.custom_fields?.look_titulo || look.title.rendered,
            look_descripcion: look.custom_fields?.look_descripcion || look.content.rendered,
            look_imagen: look.custom_fields?.look_imagen || look._embedded?.['wp:featuredmedia']?.[0]?.source_url,
            products: [product1, product2].filter(p => p !== null)
        };

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
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
