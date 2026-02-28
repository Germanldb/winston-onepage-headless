import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
    try {
        const response = await fetch(
            `https://winstonandharrystore.com/wp-json/wc/store/v1/products/reviews?per_page=100`
        );

        if (!response.ok) {
            return new Response(JSON.stringify({ error: 'API Error' }), { status: response.status });
        }

        const allReviews = await response.json();

        // De-duplicar por ID (usando un Map para asegurar unicidad)
        const uniqueMap = new Map();
        allReviews.forEach((review: any) => {
            if (!uniqueMap.has(review.id)) {
                uniqueMap.set(review.id, review);
            }
        });
        const uniqueReviews = Array.from(uniqueMap.values());

        // Mezclar y tomar 10 de las únicas
        const shuffled = uniqueReviews.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 10);

        const optimizedReviews = await Promise.all(selected.map(async (review: any) => {
            // Intentar obtener el slug del producto si no viene (el Store API suele no traerlo)
            // Si viene en review.product_slug o similar lo usamos
            if (!review.product_slug && review.product_id) {
                try {
                    const pRes = await fetch(`https://winstonandharrystore.com/wp-json/wc/store/v1/products/${review.product_id}`);
                    if (pRes.ok) {
                        const product = await pRes.json();
                        review.product_slug = product.slug;
                    }
                } catch (e) {
                    console.error("Error fetching product slug:", e);
                }
            }

            if (review.product_image && review.product_image.src) {
                let src = review.product_image.src;
                if (src.includes('wp-content/uploads') && !src.toLowerCase().endsWith('.webp')) {
                    let cleanSrc = src.replace(/-e\d+(?=\.(jpg|jpeg|png))/i, '');
                    review.product_image.src = `${cleanSrc}.webp`;
                }
            }
            return review;
        }));

        return new Response(JSON.stringify(optimizedReviews), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

    } catch (error) {
        console.error('Reviews API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
