# Últimos Cambios y Contexto del Proyecto

Este archivo resume los últimos cambios realizados para mantener la sincronía entre diferentes estaciones de trabajo.

## Últimos 5 Commits

1. **4978d4e** - *Adicion de la seccion el complemento ideal* (Hoy)
2. **50331fa** - *adicion de sugerencias en slug.astro* (Hoy)
3. **7a9ba73** - *arreglo de grid del home (mas parecido a LV)* (Hace 6 días)
4. **41ad9f3** - *Error al cargar las fotos dentro del modal* (Hace 6 días)
5. **48dcd16** - *arreglo de fotos despues de intentar meter los puntos otra vez* (Hace 6 días)

## Archivos Editados Recientemente y su Propósito

- **src/components/ProductDetail.tsx**: 
    - Se implementó la sección **"El Complemento Ideal"** (Frecuentemente comprados juntos).
    - Diseño full-width, centrado y con estética premium alineada a la marca.
    - Lógica de "Bundle" que permite añadir múltiples artículos al carrito simultáneamente.
    - Optimización móvil para mostrar los complementos de forma compacta y accesible.
    - Sincronización dinámica de galería de imágenes y puntos del slider.

- **src/pages/productos/[slug].astro**:
    - Se actualizó la lógica de fetching para extraer complementos específicos basados en categorías (suéteres, chaquetas, medias, accesorios).
    - Se excluye el producto actual de las sugerencias de complemento para evitar duplicidad.

- **src/components/ProductGrid.tsx** y **src/pages/index.astro**:
    - Ajustes en el grid de la página de inicio para una estética premium tipo Louis Vuitton.

## Estado Actual
- El sistema de venta cruzada ("El Complemento Ideal") está activo y funcional.
- Las sugerencias son dinámicas y se basan en un pool de categorías seleccionadas.
- La galería móvil es 100% dinámica y soporta "adivinación" de hasta 12 imágenes.
- El diseño general del sitio mantiene una línea de alta gama con enfoque en la conversión.

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

