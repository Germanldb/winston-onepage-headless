import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const slug = url.searchParams.get('slug');

    try {
        // 1. PRODUCTO ESPECÍFICO (Detalle)
        if (slug) {
            const response = await fetch(
                `https://winstonandharrystore.com/wp-json/wc/store/v1/products?slug=${slug}`
            );

            if (!response.ok) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

            const products = await response.json();
            if (products.length === 0) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

            const product = products.find((p: any) => p && p.attributes && Array.isArray(p.attributes) && p.attributes.length > 0) || products[0];

            // Enriquecimiento profundo solo para el detalle
            if (product.type === 'variable' && product.variations) {
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

        // 2. LISTADO PARA EL HOME (Buscador Robusto)
        // Pedimos más productos por página (40) para filtrar y asegurar que queden suficientes zapatos
        const response = await fetch(
            `https://winstonandharrystore.com/wp-json/wc/store/v1/products?per_page=40&page=${page}`
        );

        if (!response.ok) return new Response(JSON.stringify({ error: 'API Error' }), { status: response.status });

        const allProducts = await response.json();

        // Criterios de filtrado para asegurar que solo carguen zapatos en la tienda
        const shoeKeywords = ['zapato', 'bota', 'tenis', 'mocasin', 'mocasín', 'pantuflas', 'calzado', 'oxford', 'derby', 'sneaker', 'bota'];
        const excludeKeywords = ['camisa', 'camiseta', 'hoodie', 'media', 'calcetin', 'cinturon', 'morral', 'maleta', 'chaqueta', 'sueter', 'kit'];

        const filteredShoes = allProducts.filter((p: any) => {
            const name = p.name.toLowerCase();
            const categories = p.categories?.map((c: any) => c.name.toLowerCase()) || [];

            // Es zapato si el nombre o la categoría contienen palabras clave de calzado
            const isShoe = shoeKeywords.some(kw => name.includes(kw) || categories.some(cat => cat.includes(kw)));
            // Excluimos explícitamente ropa y accesorios por nombre
            const isExcluded = excludeKeywords.some(kw => name.includes(kw));

            return isShoe && !isExcluded;
        });

        // Devolvemos un bloque de 12 para que coincida con la paginación del frontend
        const result = filteredShoes.slice(0, 12);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600'
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
