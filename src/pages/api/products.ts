import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const slug = url.searchParams.get('slug');

    try {
        // 1. Si viene un slug, buscamos ese producto específico (Lógica existente)
        if (slug) {
            const response = await fetch(
                `https://winstonandharrystore.com/wp-json/wc/store/v1/products?slug=${slug}`
            );

            if (!response.ok) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

            const products = await response.json();
            if (products.length === 0) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

            const product = products.find((p: any) => p && p.attributes && Array.isArray(p.attributes) && p.attributes.length > 0) || products[0];

            if (!product) return new Response(JSON.stringify({ error: 'Product data malformed' }), { status: 500 });

            // ENRIQUECIMIENTO: Traer imágenes de variaciones
            if (product.type === 'variable' && product.variations && Array.isArray(product.attributes)) {
                const colorAttr = product.attributes.find((a: any) => a && a.name && a.name.toLowerCase().includes('color'));
                if (colorAttr && Array.isArray(colorAttr.terms)) {
                    const variationImages: any = {};
                    const colors = colorAttr.terms.map((t: any) => t.slug);

                    await Promise.all(colors.map(async (colorSlug: string) => {
                        const variation = product.variations.find((v: any) =>
                            v.attributes && Array.isArray(v.attributes) && v.attributes.some((attr: any) => attr.value && attr.value.toLowerCase() === colorSlug.toLowerCase())
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
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600'
                }
            });
        }

        // 2. LISTADO DE PRODUCTOS PARA EL GRID
        let resultProducts = [];

        // MÉTODO DIRECTO: Usar la categoría 'Zapatos' (ID: 63) verificada
        try {
            // ID 63 confirmado para zapatos en la taxonomía product_cat
            const productsResponse = await fetch(
                `https://winstonandharrystore.com/wp-json/wc/store/v1/products?category=63&page=${page}&per_page=12`
            );

            if (productsResponse.ok) {
                const products = await productsResponse.json();
                if (products.length > 0) {
                    resultProducts = products;
                }
            }
        } catch (e) {
            console.warn('Error intentando fetch por categoría ID 63, usando fallback...', e);
        }

        // FALLBACK: Si el método anterior no trajo productos (ej. ID incorrecto o categoría vacía), usamos el método antiguo de filtrado manual
        if (resultProducts.length === 0) {
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
                const hasShoeCategory = categoryNames.some((cat: string) => shoeKeywords.some(kw => cat.includes(kw)));
                const hasShoeName = shoeKeywords.some(kw => name.includes(kw));
                const isExcluded = excludeKeywords.some(kw => name.includes(kw));
                return (hasShoeCategory || hasShoeName) && !isExcluded;
            });

            resultProducts = shoes.slice(0, 12);
        }

        // ENRIQUECIMIENTO (Común para ambos métodos)
        // Traer imágenes de variaciones para mostrar los colores correctamente en la tarjeta
        await Promise.all(resultProducts.map(async (product: any) => {
            if (product && product.type === 'variable' && product.variations && Array.isArray(product.attributes)) {
                const colorAttr = product.attributes.find((a: any) =>
                    a && a.name && (a.name.toLowerCase().includes('color') ||
                        (a.taxonomy && a.taxonomy.includes('color')))
                );

                if (colorAttr && Array.isArray(colorAttr.terms)) {
                    const variationImages: any = {};
                    const colors = colorAttr.terms.map((t: any) => t.slug);

                    await Promise.all(colors.map(async (colorSlug: string) => {
                        const colorTerm = colorAttr.terms.find((t: any) => t.slug === colorSlug);
                        const colorName = colorTerm?.name || "";

                        const variation = product.variations.find((v: any) =>
                            v.attributes && Array.isArray(v.attributes) && v.attributes.some((attr: any) =>
                                attr.name && (attr.name.toLowerCase().includes('color') || (attr.taxonomy && attr.taxonomy.includes('color'))) &&
                                attr.value && (attr.value.toLowerCase() === colorSlug.toLowerCase() ||
                                    attr.value.toLowerCase() === colorName.toLowerCase())
                            )
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
        }));

        return new Response(JSON.stringify(resultProducts), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600'
            }
        });
    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }), { status: 500 });
    }
};
