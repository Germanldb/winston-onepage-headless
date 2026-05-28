// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import { loadEnv } from 'vite';

// Cargamos variables del .env (sin hardcoding)
const { WC_CONSUMER_KEY, WC_CONSUMER_SECRET, WC_URL } = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

import fs from "node:fs";
import path from "node:path";

/** Función para obtener todas las URLs de productos dinámicamente */
async function getDynamicProductPages() {
  if (!WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) return [];

  const cachePath = path.join(process.cwd(), '.astro-sitemap-cache.json');
  if (process.env.NODE_ENV !== 'production' && fs.existsSync(cachePath)) {
      try {
          return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      } catch (e) {}
  }

  const baseUrl = (WC_URL || "https://tienda.winstonandharrystore.com").replace(/\/$/, "");
  let allUrls = [];
  let page = 1;

  try {
    while (true) {
      const res = await fetch(`${baseUrl}/wp-json/wc/v3/products?page=${page}&per_page=100&consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}&status=publish&_fields=slug`);
      const products = await res.json();

      if (!Array.isArray(products) || products.length === 0) break;

      products.forEach(p => {
        if (p && p.slug && typeof p.slug === 'string') {
          const cleanSlug = p.slug.trim();
          if (cleanSlug && !cleanSlug.includes('undefined') && !cleanSlug.includes('null') && !cleanSlug.includes('[object')) {
            allUrls.push(`https://www.winstonandharrystore.com/productos/${cleanSlug}`);
          }
        }
      });
      page++;
    }
  } catch (e) {
    console.warn("[Sitemap] Error cargando productos:", e.message);
  }
  
  if (process.env.NODE_ENV !== 'production') {
      fs.writeFileSync(cachePath, JSON.stringify(allUrls), 'utf-8');
  }
  return allUrls;
}

const productPages = await getDynamicProductPages();

const mappedCategories = [
  'zapatos-cuero-hombre',
  'mocasines-cuero-hombre',
  'botas-cuero-hombre',
  'ropa-hombre-colombia',
  'maletas-morrales-cuero',
  'accesorios-hombre',
  'tenis-hombre',
  'outlet-zapatos-ropa',
  'pantuflas-cuero-hombre',
  'tallas-grandes-zapatos-hombre',
  'zapatos-hechos-colombia-hombre',
  'zapatos-cordon-hombre',
  'zapatos-hebilla-hombre',
  'cinturones-cuero-hombre',
  'billeteras-tarjeteros-cuero',
  'chaquetas-cuero-hombre',
  'collares-cuero-perro',
  'sueteres-chalecos-hombre',
  'polos-camisetas-hombre',
  'medias-hombre',
  'camisas-algodon-hombre',
  'chaquetas-hombre'
];
const categoryPages = mappedCategories.map(slug => `https://www.winstonandharrystore.com/categoria/${slug}`);

const allSitemapPages = [...productPages, ...categoryPages, 'https://www.winstonandharrystore.com/sale', 'https://www.winstonandharrystore.com/regalos-dia-del-padre'];

// Set para evitar duplicados en el sitemap durante el proceso de generación
const seenUrls = new Set();

export default defineConfig({
  site: 'https://www.winstonandharrystore.com',
  integrations: [
    react(),
    sitemap({
      customPages: allSitemapPages,
      serialize(item) {
        // Validación inicial para prevenir elementos nulos o vacíos en el build
        if (!item || !item.url || typeof item.url !== 'string') {
          return undefined;
        }

        // Filtro estricto para evitar URLs rotas o con basura de errores ('undefined', 'null', '[object')
        if (item.url.includes('undefined') || item.url.includes('null') || item.url.includes('[object')) {
          return undefined;
        }

        // Exclusión total: Nunca permitir query strings en el sitemap
        if (item.url.includes('?')) {
          return undefined;
        }

        // 1. Transformación de Dominio: Reemplaza globalmente tienda.winstonandharrystore.com por www.winstonandharrystore.com
        if (item.url.includes('tienda.winstonandharrystore.com')) {
          item.url = item.url.replace('tienda.winstonandharrystore.com', 'www.winstonandharrystore.com');
        }

        // 3. Normalización de Base: Asegúrate de que todos los productos usen el prefijo /productos/ y las categorías el prefijo /categoria/
        // Eliminando los prefijos por defecto de WooCommerce (/product/ o /product-category/)
        if (item.url.includes('/product/')) {
          item.url = item.url.replace('/product/', '/productos/');
        }
        if (item.url.includes('/product-category/')) {
          item.url = item.url.replace('/product-category/', '/categoria/');
        }

        // 2. Filtro de Exclusión de Categorías no mapeadas
        if (item.url.includes('/categoria/')) {
          const match = item.url.match(/\/categoria\/([^\/]+)/);
          if (match && match[1]) {
            const catSlug = match[1];
            if (!mappedCategories.includes(catSlug)) {
              return undefined; // Excluye esta categoría del sitemap
            }
          }
        }

        // Unificar URLs eliminando barra diagonal final (trailing slash) excepto si es la raíz
        if (item.url !== 'https://www.winstonandharrystore.com/' && item.url !== 'https://www.winstonandharrystore.com' && item.url.endsWith('/')) {
          item.url = item.url.slice(0, -1);
        }

        // Deduplicar URLs exactas
        if (seenUrls.has(item.url)) {
          return undefined;
        }
        seenUrls.add(item.url);

        return item;
      },
      filter: (page) => {
        if (!page || typeof page !== 'string') {
          return false;
        }

        // Filtro estricto para evitar indexar páginas con errores de variables en el build
        if (page.includes('undefined') || page.includes('null') || page.includes('[object')) {
          return false;
        }

        // Exclusión total de URLs parametrizadas
        if (page.includes('?')) {
          return false;
        }

        // 4. Limpieza de Páginas Técnicas: Excluye páginas internas que no deben ser indexadas
        const excludedPatterns = [
          '/wp-json/',
          '/wp-admin/',
          '/wp-content/',
          '/xmlrpc',
          '/api/',
          '/cart/',
          '/checkout/',
          '/my-account/',
          '/mi-cuenta/',
          'lost-password',
          'edit-account',
          'uncategorized',
          'sin-categorizar',
          '/carrito',
          '/buscar',
          '/gracias',
          '/lista-de-deseos',
          '/productos/producto',
          '/tienda'
        ];

        if (excludedPatterns.some(pattern => page.includes(pattern))) {
          return false;
        }

        // Filtro estricto adicional para categorías no mapeadas en la fase de descubrimiento inicial
        if (page.includes('/categoria/')) {
          const match = page.match(/\/categoria\/([^\/]+)/);
          if (match && match[1]) {
            const catSlug = match[1];
            if (!mappedCategories.includes(catSlug)) {
              return false;
            }
          }
        }

        return true;
      }
    }),
    partytown({
      config: {
        forward: ['dataLayer.push', 'fbq']
      }
    })
  ],
  redirects: {
    '/review-unicentro': 'https://g.page/r/CUpXPMxMDYUWEBM/review',
    '/review-palatino': 'https://g.page/r/CVqAdcaz3jkUEBM/review',
    '/review-santabarbara': 'https://g.page/r/CfogiOsEUdgVEBM/review',
    '/review-retiro': 'https://g.page/r/CSKXwQ5l5zSpEBM/review',
    '/categoria/pantalones-jeans-hombre': '/categoria/ropa-hombre-colombia',
    '/categoria/trajes-blazers-hombre': '/categoria/ropa-hombre-colombia',
    '/productos/limpiador-en-seco': '/categoria/accesorios-hombre',
    '/productos/sueter-tejido-escalera-negro': '/categoria/sueteres-chalecos-hombre',
  },
  output: 'static',
  adapter: vercel({
    maxDuration: 300
  }),
  security: {
    checkOrigin: false
  },
  trailingSlash: 'ignore',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  },
  image: {
    domains: ["winstonandharrystore.com", "staging.winstonandharrystore.com", "tienda.winstonandharrystore.com"],
  },
});