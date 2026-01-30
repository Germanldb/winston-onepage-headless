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

            const product = products.find((p: any) => p.attributes && p.attributes.length > 0) || products[0];

            // ENRIQUECIMIENTO: Traer imágenes de variaciones si es un producto variable
            if (product.type === 'variable' && product.variations) {
                const colorAttr = product.attributes.find((a: any) => a.name.toLowerCase().includes('color'));
                if (colorAttr) {
                    const variationImages: any = {};
                    const colors = colorAttr.terms.map((t: any) => t.slug);

                    // Para cada color, buscamos la primera variación y traemos sus fotos
                    // Usamos Promise.all para que sea más rápido
                    await Promise.all(colors.map(async (colorSlug: string) => {
                        const variation = product.variations.find((v: any) =>
                            v.attributes.some((attr: any) => attr.value.toLowerCase() === colorSlug.toLowerCase())
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
                            } catch (e) {
                                console.error(`Error fetching variation ${variation.id}:`, e);
                            }
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

        // Limitamos a 12 productos para completar perfectamente una grid de 4x3
        const result = shoes.slice(0, 12);

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
