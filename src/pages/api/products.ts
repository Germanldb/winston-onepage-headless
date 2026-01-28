import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';

    try {
        // Pedimos un lote grande para filtrar solo zapatos y asegurar cantidad para la grid
        const response = await fetch(
            `https://winstonandharrystore.com/wp-json/wc/store/v1/products?per_page=100&page=${page}`
        );

        if (!response.ok) {
            return new Response(JSON.stringify({ error: 'Failed' }), { status: response.status });
        }

        let allProducts = await response.json();

        // FILTRADO ESTRICTO DE ZAPATOS
        const shoes = allProducts.filter((p: any) => {
            const categoryNames = p.categories.map((c: any) => c.name.toLowerCase());
            const name = p.name.toLowerCase();

            const shoeKeywords = ['zapatos', 'botas', 'tenis', 'mocasin', 'mocasín', 'pantuflas', 'calzado', 'oxford', 'derby', 'sneaker'];
            const excludeKeywords = ['camisa', 'camiseta', 'hoodie', 'media', 'calcetin', 'cinturon', 'morral', 'maleta', 'chaqueta', 'sueter'];

            const hasShoeCategory = categoryNames.some((cat: string) =>
                shoeKeywords.some(kw => cat.includes(kw))
            );

            const hasShoeName = shoeKeywords.some(kw => name.includes(kw));

            const isExcluded = excludeKeywords.some(kw => name.includes(kw));

            return (hasShoeCategory || hasShoeName) && !isExcluded;
        });

        // Retornamos los productos con sus URLs ORIGINALES
        // No limpiamos el path /YYYY/MM/ porque vimos que muchos productos lo requieren
        const processedProducts = shoes.map((product: any) => ({
            ...product
        }));

        // Retornamos 15 productos para cumplir con la grid de 5x3
        const paginatedShoes = processedProducts.slice(0, 15);

        return new Response(JSON.stringify(paginatedShoes), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Server Error' }), { status: 500 });
    }
};
