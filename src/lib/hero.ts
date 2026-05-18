import { wcFetch, PUBLIC_WP_URL } from "./woocommerce";

/**
 * Resuelve un ID numérico de adjunto de WordPress a su URL real en build-time.
 * Si ya es una URL, la retorna tal cual.
 */
async function resolveImageIdOrUrl(val: any): Promise<string> {
    if (!val) return "";
    const strVal = String(val).trim();
    if (!strVal) return "";
    
    // Si es un número (ej. "85343" o 85343), es un ID de adjunto de WordPress
    if (!isNaN(Number(strVal)) && Number(strVal) > 0) {
        try {
            console.log(`[Hero API] Resolviendo ID de imagen de WordPress: ${strVal}`);
            const res = await fetch(`${PUBLIC_WP_URL}/wp-json/wp/v2/media/${strVal}`, {
                signal: AbortSignal.timeout(5000)
            });
            if (res.ok) {
                const mediaData = await res.json();
                const resolvedUrl = mediaData.source_url || mediaData.guid?.rendered || "";
                if (resolvedUrl) {
                    console.log(`[Hero API] ID ${strVal} resuelto con éxito a: ${resolvedUrl}`);
                    return resolvedUrl;
                }
            }
        } catch (e) {
            console.warn(`[Hero API] Error resolviendo ID de imagen ${strVal}:`, e);
        }
    }
    
    return strVal;
}

/**
 * Obtiene las diapositivas del Banner Hero desde el CPT 'home_banner_hero'
 * El usuario ha expuesto una salida personalizada en 'banner_data'
 */
export async function getHeroSlides() {
    try {
        const data = await wcFetch('wp/v2/home_banner_hero?per_page=5');
        
        if (data && Array.isArray(data) && data.length > 0) {
            const heroPost = data[0];
            if (heroPost.banner_data) {
                const slides = heroPost.banner_data.slides || [];
                const acfMobile = heroPost.acf?.mobile_images || [];
                
                const mergedSlides = await Promise.all(slides.map(async (slide: any, idx: number) => {
                    // Soporte para ACF versión Free (campos individuales: mobile_image_1, mobile_image_2, etc.)
                    const singleFieldImage = heroPost.acf?.[`mobile_image_${idx + 1}`] || "";
                    
                    const mobileRaw = slide.media_url_mobile || singleFieldImage || acfMobile[idx]?.mobile_image || acfMobile[idx]?.mobile_url || "";
                    const resolvedMobileUrl = await resolveImageIdOrUrl(mobileRaw);

                    return {
                        ...slide,
                        media_url_mobile: resolvedMobileUrl
                    };
                }));

                return {
                    slides: mergedSlides,
                    slots: parseInt(heroPost.banner_data.slots) || 1
                };
            }
        }
    } catch (e) {
        console.warn("[Hero API] Error con wcFetch home_banner_hero:", e);
    }

    try {
        const publicRes = await fetch(`${PUBLIC_WP_URL}/wp-json/wp/v2/home_banner_hero?per_page=1`);
        if (publicRes.ok) {
            const data = await publicRes.json();
            if (data && Array.isArray(data) && data.length > 0) {
                const heroPost = data[0];
                if (heroPost.banner_data) {
                    const slides = heroPost.banner_data.slides || [];
                    const acfMobile = heroPost.acf?.mobile_images || [];
                    
                    const mergedSlides = await Promise.all(slides.map(async (slide: any, idx: number) => {
                        // Soporte para ACF versión Free (campos individuales: mobile_image_1, mobile_image_2, etc.)
                        const singleFieldImage = heroPost.acf?.[`mobile_image_${idx + 1}`] || "";
                        
                        const mobileRaw = slide.media_url_mobile || singleFieldImage || acfMobile[idx]?.mobile_image || acfMobile[idx]?.mobile_url || "";
                        const resolvedMobileUrl = await resolveImageIdOrUrl(mobileRaw);

                        return {
                            ...slide,
                            media_url_mobile: resolvedMobileUrl
                        };
                    }));

                    return {
                        slides: mergedSlides,
                        slots: parseInt(heroPost.banner_data.slots) || 1
                    };
                }
            }
        }
    } catch (e) {}

    return { slides: [], slots: 0 };
}
