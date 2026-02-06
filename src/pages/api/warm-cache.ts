import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const origin = url.origin;

    // Solo activamos si viene de un Cron de Vercel o tenemos autorización simple
    // Vercel añade un header de autorización secreto si se configura, pero por ahora lo dejamos libre
    // para pruebas, o validamos que el origin sea el mismo.

    try {
        console.log('--- Iniciando Calentamiento de Caché (Warmer) ---');

        // 1. Obtenemos los productos actuales de WooCommerce (los primeros 100)
        const response = await fetch('https://winstonandharrystore.com/wp-json/wc/store/v1/products?per_page=100');
        if (!response.ok) throw new Error('No se pudo obtener la lista de productos de WooCommerce');

        const products = await response.json();
        const slugs = products.map((p: any) => p.slug);

        console.log(`Zapatos encontrados: ${slugs.length}. Visitando enlaces...`);

        // 2. Ejecutamos las visitas en paralelo
        // No esperamos el cuerpo de la respuesta para no agotar el tiempo de ejecución (Timeout)
        // Solo nos interesa que Vercel reciba la petición y dispare el ISR.
        const results = await Promise.allSettled(
            slugs.map(async (slug) => {
                const productUrl = `${origin}/productos/${slug}`;
                const res = await fetch(productUrl, {
                    method: 'HEAD', // HEAD es más rápido, solo queremos que Vercel procese el route
                });
                return { slug, status: res.status };
            })
        );

        // 3. También calentamos el endpoint de la API principal que usa el Home
        await fetch(`${origin}/api/products`, { method: 'HEAD' });

        return new Response(JSON.stringify({
            success: true,
            message: `Caché calentado para ${slugs.length} productos`,
            timestamp: new Date().toISOString()
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Error en Cache Warmer:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
