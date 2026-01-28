import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const slug = url.searchParams.get('slug');

    try {
        // Si viene un slug, buscamos ese producto específico
        if (slug) {
            const response = await fetch(
                `https://winstonandharrystore.com/wp-json/wc/store/v1/products?slug=${slug}`
            );

            if (!response.ok) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

            const products = await response.json();
            if (products.length === 0) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

            return new Response(JSON.stringify(products[0]), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=3600'
                }
            });
        }

        // LISTADO DE PRODUCTOS (SOLO ZAPATOS)
        // Intentamos traer suficientes productos para filtrar
        const response = await fetch(
            `https://winstonandharrystore.com/wp-json/wc/store/v1/products?per_page=100&page=${page}`
        );

        if (!response.ok) {
            return new Response(JSON.stringify({ error: 'API Error' }), { status: response.status });
        }

        const allProducts = await response.json();

        const shoeKeywords = ['zapatos', 'botas', 'tenis', 'mocasin', 'mocasín', 'pantuflas', 'calzado', 'oxford', 'derby', 'sneaker', 'bota', 'zapato'];
        const excludeKeywords = ['camisa', 'camiseta', 'hoodie', 'media', 'calcetin', 'cinturon', 'morral', 'maleta', 'chaqueta', 'sueter', 'cubre bocas', 'kit'];

        const shoes = allProducts.filter((p: any) => {
            const categoryNames = p.categories.map((c: any) => c.name.toLowerCase());
            const name = p.name.toLowerCase();

            const hasShoeCategory = categoryNames.some((cat: string) =>
                shoeKeywords.some(kw => cat.includes(kw))
            );

            const hasShoeName = shoeKeywords.some(kw => name.includes(kw));
            const isExcluded = excludeKeywords.some(kw => name.includes(kw));

            return (hasShoeCategory || hasShoeName) && !isExcluded;
        });

        // Si encontramos muy pocos en esta página, intentamos traer de la siguiente (opcionalmente)
        // Pero por ahora, devolvemos lo que hay (máximo 15 para la grid)
        const result = shoes.slice(0, 15);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
