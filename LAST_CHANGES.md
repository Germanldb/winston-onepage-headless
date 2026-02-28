# Últimos Cambios y Contexto del Proyecto

Este archivo resume los últimos cambios realizados para mantener la sincronía entre diferentes estaciones de trabajo.

## Últimos Cambios (28 de Febrero, 2026)

### 1. Migración a WooCommerce REST API v3 (Auth)
- **Problema:** La `Store API` anterior era limitada, devolviendo solo una imagen por producto en listados y requiriendo múltiples peticiones lentas para variaciones.
- **Solución:** 
    - Se implementó la **WooCommerce REST API v3** con credenciales (`ck`/`cs`) para acceso total.
    - Se centralizó la lógica en `src/lib/woocommerce.ts` para manejar peticiones autenticadas.
    - Se optimizó la carga de variaciones: ahora se obtienen todas las fotos, stock y precios de cada color en **una sola petición**, reduciendo drásticamente el tiempo de carga.

### 2. Sistema de Cache de Alto Rendimiento (Dual Layer)
- **Capa 1 (Servidor/SSR):** Se implementó una cache en memoria en el servidor con TTL de 1 hora para productos y categorías. Esto elimina el tiempo de consulta a la base de datos de WordPress para usuarios concurrentes.
- **Capa 2 (Navegador/CDN):** Se añadieron cabeceras `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` en los endpoints de la API (`products`, `reviews`, `look-of-the-week`).
- **Navegación Fluida:** Se eliminaron los parámetros de "cache-busting" en el frontend (`ProductGrid.tsx`), permitiendo que el cambio entre Zapatos, Ropa y Maletas sea instantáneo tras la primera carga.

### 3. Normalización de Slugs y Fix de Color "Café"
- **Corrección Crítica:** Se detectó que colores con tildes (ej. "Café") causaban errores de carga de imágenes y variaciones debido a discrepancias entre el nombre y el slug del servidor.
- **Solución:** Se implementó la función `normalizeSlug` que elimina acentos y caracteres especiales recursivamente, asegurando que "Café" siempre mapee a la ruta de imagen correcta (`cafe`).

### 4. Sincronización de Precios (IVA COP)
- **Precisión Financiera:** La API REST v3 devuelve precios base; se ajustó el mapeador para calcular el precio inclusivo de IVA (19% para Colombia) garantizando consistencia con los precios mostrados en la tienda original.

---

## Últimos Cambios (26 de Febrero, 2026)

### 1. Corrección de Espacio en Blanco en Hero (Scroll Bug)
- **Problema:** Al hacer scroll hacia abajo, el menú se ocultaba pero la sección Hero mantenía un desplazamiento superior de 90px, dejando un hueco blanco visible.
- **Solución:** 
    - Se actualizó `Header.astro` para inyectar la clase `is-header-hidden` al `body` cuando el menú se oculta.
    - Se modificó `Hero.astro` para que su posición `sticky` cambie de `top: 90px` a `top: 0` dinámicamente mediante una transición fluida.
    - Esto permite que el video de fondo ocupe el 100% de la pantalla útil tan pronto como el menú desaparece.

### 2. Nueva Sección de Categorías (CategoryGrid)
- **Implementación:** Se creó el componente `CategoryGrid.astro` con 4 bloques principales: Ropa, Zapatos, Maletas y Accesorios.
- **Estética premium:** 
    - Títulos y etiquetas en estilo Louis Vuitton (`Verde #155338`, `Bold 700`, `Antonio`).
    - Subtítulos alineados con la nueva visión: "Todo lo que necesita el hombre colombiano que viste con criterio".
    - Efectos de hover con zoom en imágenes y cambio de color a beige Winston.
- **Ajustes de Diseño:** Se redujo el padding excesivo para mejorar la compresión vertical y se ajustó el tamaño de los títulos a `1.5rem` para mayor elegancia.

## Últimos 5 Commits

1. **4978d4e** - *Adicion de la seccion el complemento ideal* (Hoy)
2. **50331fa** - *adicion de sugerencias en slug.astro* (Hoy)
3. **7a9ba73** - *arreglo de grid del home (mas parecido a LV)* (Hace 6 días)
4. **41ad9f3** - *Error al cargar las fotos dentro del modal* (Hace 6 días)
5. **48dcd16** - *arreglo de fotos despues de intentar meter los puntos otra vez* (Hace 6 días)

## Archivos Editados Recientemente y su Propósito

- **src/components/ProductGrid.tsx**:
    - **Filtros Dinámicos de Categoría:** Se implementó una barra de navegación tipo "Categoría" con botones para Zapatos (ID 63), Ropa (ID 249) y Maletas (ID 190).
    - **Barra Sticky Inteligente:** La sección de filtros ahora es fija (`sticky`) y sincronizada con el Header; se ajusta dinámicamente (`top: 80px` o `top: 0`) según la visibilidad del menú para evitar huecos visuales.
    - **Carga Progresiva (12 -> 24 -> Enlace):** Se optimizó el renderizado inicial mostrando primero 12 productos (4x3), cargando 24 tras el primer clic en "Ver más", y redirigiendo a la página de categoría completa en el siguiente paso. Esto mejora el rendimiento del DOM y la experiencia de navegación profunda.
- **src/pages/api/products.ts**:
    - **Parámetro de Categoría:** Se actualizó el endpoint para aceptar un parámetro `category`, permitiendo el filtrado desde el frontend.
    - **Optimización de Velocidad:** Se eliminó la carga pesada de variaciones en el listado masivo para evitar *timeouts* en categorías grandes (como Ropa), delegando la visualización de colores a la lógica de predicción del cliente.
- **src/components/Header.astro**:
    - **Fix de Logo:** Se reemplazó el componente `<Image />` por una etiqueta `<img>` estándar para evitar bloqueos por parte del servicio de optimización de imágenes ante ráfagas de tráfico, asegurando que el branding sea siempre visible.

## Estado Actual
- **Infraestructura de Datos:** Migrada al 100% a WooCommerce REST API v3 con autenticación por clave.
- **Rendimiento:** Sistema de cache de doble capa activo (Memoria + Browser). Tiempos de carga reducidos en >70%.
- **Precisión de Variantes:** Variaciones de color y tallas sincronizadas perfectamente, incluyendo soporte para caracteres especiales (ej. Café).
- **Consistencia de Precios:** Precios en COP con IVA incluido sincronizados con la tienda base.
- **Navegación Fluida:** Cambio entre categorías (Zapatos, Ropa, Maletas) casi instantáneo.
- **Reviews y Look de la Semana:** Migrados a la nueva API y optimizados con cache.
- El diseño general mantiene la estética de alta gama Louis Vuitton con enfoque en conversión.

## Sistema de Diseño y Línea Gráfica (Winston & Harry)

Para mantener la consistencia premium en todo el sitio, se deben seguir estos lineamientos obligatorios:

- **Colores Principales (Brand Colors):**
  - **Dorado/Beige Winston:** `#B1915F` (Usado en hovers, íconos de favoritos y estados "sale").
  - **Verde Profundo:** `#155338` (Identidad de marca, botones principales, títulos de secciones).
  - **Blanco de Lujo:** `#EFEFEF` (Color de fondo de página para suavizar el contraste).
- **Tipografía y Estética:**
  - **Títulos (H1-H4):** Fuente `Antonio`, siempre en Uppercase, con `letter-spacing: 2px`.
  - **Grid de Productos:** Estilo minimalista tipo "Louis Vuitton". Imágenes con `aspect-ratio: 3/4` o `1/1` dependiendo de la sección, con bordes rectos y sombras muy sutiles.
  - **Interactividad:** Botones con transición de `0.4s`, elevación en hover (`translateY(-3px)`) y cambio de color de verde a dorado.

## Notas de Arquitectura y Errores Conocidos

### Optimización de Imágenes (.webp) - "Estrategia Optimista"
Se ha descubierto que el servidor de imágenes de WordPress no genera archivos `.webp` para la totalidad de la librería, lo que causa errores 404 selectivos.

- **Hallazgo:** Imágenes como `Chaleco-Unifondo-Vino...jpg` pueden no tener su contraparte `.webp` disponible, incluso si otras imágenes del mismo producto sí la tienen.
- **Problema de Sufijos:** WordPress añade timestamps de edición (`-e175...`) que deben ser eliminados antes de intentar cargar el `.webp` base.
- **Estrategia Actual ("Estrategia de Fallback Obligatorio"):**
  1. El servidor (`SSR`) intenta cargar la versión `.webp` por defecto (limpiando sufijos de edición).
  2. El cliente (`React`) DEBE implementar un manejador `onError` en cada etiqueta `<img>`.
  3. Si la imagen `.webp` falla (404), el `onError` detecta la extensión y la elimina de la URL para cargar automáticamente el original (`.jpg` / `.png`).
- **Configuración en Código:** Esta lógica está centralizada en la función `optimizeImages` para la parte de datos y en el atributo `onError` de los componentes `ProductCard` y `ProductDetail`.

