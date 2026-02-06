import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const origin = url.origin;

    // Solo activamos si viene de un Cron de Vercel o tenemos autorización simple
    // Vercel añade un header de autorización secreto si se configura, pero por ahora lo dejamos libre
    // para pruebas, o validamos que el origin sea el mismo.

    try {
        console.log('--- Iniciando Calentamiento de Caché Total (Warmer) ---');
        const slugs: string[] = [];
        let page = 1;
        let hasMore = true;

        // 1. Obtenemos TODOS los productos de WooCommerce (paginando)
        while (hasMore) {
            const res = await fetch(`https://winstonandharrystore.com/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
            if (!res.ok) {
                hasMore = false;
                break;
            }
            const data = await res.json();
            if (data.length === 0) {
                hasMore = false;
            } else {
                data.forEach((p: any) => { if (p.slug) slugs.push(p.slug); });
                page++;
            }
            // Límite de seguridad para evitar bucles infinitos
            if (page > 10) hasMore = false;
        }

        console.log(`Páginas de productos encontradas: ${slugs.length}.`);

        // 2. Definimos todas las rutas críticas de la web
        const criticalRoutes = [
            '/',                    // Home
            '/lista-de-deseos',     // Wishlist
            '/api/products',        // API de productos (Home grid)
        ];

        const allUrlsToWarm = [
            ...criticalRoutes.map(route => `${origin}${route}`),
            ...slugs.map(slug => `${origin}/productos/${slug}`)
        ];

        console.log(`Iniciando visita a ${allUrlsToWarm.length} enlaces...`);

        // 3. Ejecutamos las visitas
        // Usamos HEAD para no descargar todo el HTML y ser más rápidos
        const results = await Promise.allSettled(
            allUrlsToWarm.map(async (url) => {
                const res = await fetch(url, { method: 'HEAD' });
                return { url, status: res.status };
            })
        );

        return new Response(JSON.stringify({
            success: true,
            total_links: allUrlsToWarm.length,
            products: slugs.length,
            message: `Caché calentado con éxito para toda la tienda`,
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
