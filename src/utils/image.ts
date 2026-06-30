/**
 * Utility to optimize images using Astro's image service.
 * Since we are in a headless environment, we can use the /_image endpoint
 * which is standard in Astro for dynamic image optimization.
 */

export type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png';

interface OptimizeOptions {
  width?: number;
  height?: number;
  quality?: number | string;
  format?: ImageFormat;
}

/**
 * Generates an optimized URL for a remote image.
 */
export function getOptimizedUrl(src: string, options: OptimizeOptions = {}): string {
  // If it's a placeholder, already optimized, or an invalid URL, return as is
  if (!src || src.includes('placeholder.com') || src.startsWith('/_image') || src.includes('undefined')) return src;

  // Bypass Vercel Image Optimization en producción también para evitar errores
  // INVALID_IMAGE_OPTIMIZE_REQUEST (usualmente bloqueos de WordFence a IPs de Vercel)
  return src;
}

/**
 * Generates a srcset for responsive images.
 */
export function getImageSrcSet(src: string, widths: number[] = [300, 600, 900, 1200]): string {
  if (!src || src.includes('placeholder.com')) return '';
  
  return widths
    .map(w => `${getOptimizedUrl(src, { width: w })} ${w}w`)
    .join(', ');
}
