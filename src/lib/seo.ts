
import { PUBLIC_WP_URL } from "./woocommerce";

/**
 * Sanitiza metadatos de RankMath para Headless
 * - Reemplaza URLs de WordPress por las del sitio actual
 * - Asegura que el canonical apunte al dominio principal
 */
export function sanitizeSEO(seoData: any, currentPath: string, siteUrl: string) {
    if (!seoData) return null;

    // 1. Extraer título y descripción tolerando RankMath / Yoast / default
    let title = seoData.title || seoData.rank_math_title || seoData.yoast_head_json?.title || "";
    let description = seoData.description || seoData.rank_math_description || seoData.yoast_head_json?.description || "";

    // 2. Reemplazar subdominio de WP por el Main en descripciones
    const wpUrl = PUBLIC_WP_URL.replace(/\/$/, "");
    const cleanSiteUrl = siteUrl.replace(/\/$/, "");
    
    const replacementRegex = new RegExp(wpUrl, 'g');
    
    description = description.replace(replacementRegex, cleanSiteUrl);

    // 3. Generar Canonical propio (Ignorar el de RankMath)
    const canonical = `${cleanSiteUrl}${currentPath === '/' ? '' : currentPath}`;

    // 4. OpenGraph Images (Asegurar que sean absolutas)
    let ogImage = seoData.opengraph_image || seoData.rank_math_og_image || seoData.yoast_head_json?.og_image || "";
    if (ogImage && !ogImage.startsWith('http')) {
        ogImage = `${wpUrl}${ogImage}`;
    }

    return {
        title,
        description,
        canonical,
        ogTitle: seoData.opengraph_title || seoData.rank_math_og_title || seoData.yoast_head_json?.og_title || title,
        ogDescription: seoData.opengraph_description || seoData.rank_math_og_description || seoData.yoast_head_json?.og_description || description,
        ogImage,
        ogType: seoData.opengraph_type || 'website'
    };
}
