# Sistema de Imágenes del Grid (ProductCard)

## Overview

El grid de productos en el home (`ProductGrid.tsx` + `ProductCard.tsx`) maneja imágenes de productos con múltiples niveles de fallback.

## Estructura de Datos

### 1. Imágenes del producto base
```typescript
product.images: { src: string, alt: string }[]
```

### 2. Mapa de imágenes de variaciones (API)
```typescript
product.variation_images_map: Record<string, Image[]>
// Ejemplo: { "negro": [img1, img2, img3], "cafe": [img1, img2, img3] }
```

**Importante:** El `variation_images_map` se genera en `/api/products.ts` para productos variables. Solo contiene las imágenes de las variaciones si:
- El producto es de tipo `variable`
- Las variaciones tienen atributos de color
- La API de WooCommerce retorna las imágenes de cada variación

## Flujo de Imágenes

## Flujo de Imágenes (Actualizado)

### Cambio de Color (seleccionar color)
1. **Prioridad 1:** Usar `variation_images_map[colorSlug]` desde la API.
2. **Prioridad 2 (NUEVO):** Si el mapa de variaciones está vacío, realizar un **On-Demand Fetch** al endpoint individual (`/api/products?slug=...`) para obtener el mapa real.
3. **Fallback 3:** Buscar en `product.images` por nombre de archivo que contenga el color (Fuzzy matching: "Vino" matchea "Vinotinto").
4. **Fallback 4 (Synthetic):** Predecir URL sustituyendo el color base por el seleccionado en el nombre del archivo (con **Smart Casing**).

## Mejoras Recientes (Sistema Robusto)

### 1. Carga Bajo Demanda (On-Demand Fetching)
Para optimizar el rendimiento, el grid principal no carga todas las variaciones de todos los productos de entrada. 
- Al hacer **hover** o **click** en un color, el `ProductCard` detecta si faltan datos enriquecidos.
- Si faltan, lanza una petición `fetch` silenciosa al API por el detalle del producto.
- Una vez recibidos, el `variation_images_map` se activa y muestra las fotos 100% reales.

### 2. Smart Casing (Sensibilidad a Mayúsculas)
Los servidores de imágenes de Winston & Harry a veces usan `Color` (Mayúscula) y otras `color` (minúscula).
- El sistema detecta el casing original en la URL base.
- Si el color original estaba capitalizado (ej: `.../Zapato-Cafe.jpg`), la predicción usará `.../Zapato-Negro.jpg`.
- Esto evita errores 404 en servidores Linux que son sensibles a mayúsculas.

### 3. Recuperación Automática (Anti-Rectángulo Blanco)
Si una predicción de imagen sintética falla (da error 404):
- El componente `onError` detecta que es una imagen generada.
- Bloquea ese color para ese producto específico (`failedSyntheticColors`).
- **Forza el regreso inmediato** a la imagen original del producto en lugar de mostrar un error o un placeholder.

### 4. Fuzzy Matching (Vino vs Vinotinto)
- El sistema de filtrado y predicción ahora entiende que `Vino`, `Vinotinto` y `Vino Florantik` son términos relacionados. 
- Si un archivo se llama `...-Vino-1.jpg` y el atributo es `vinotinto`, el sistema hace el match correctamente.

## Diagnóstico de Problemas (Actualizado)

### "El cambio de color no funciona o se queda la misma foto"
1. **Verificar Consola**: Si ves errores de red, puede que el On-Demand Fetch esté fallando.
2. **Atributos de Variación**: La API ahora es más robusta y busca tanto en el campo `.value` como en `.option` de la respuesta de WooCommerce.

## Archivos Clave

| Archivo | Responsabilidad |
|---------|-----------------|
| `/api/products.ts` | Genera `variation_images_map` (ahora busca en `value` y `option`). |
| `/src/components/ProductCard.tsx` | Lógica central: On-demand fetch, fuzzy matching, smart casing y recuperación de errores. |

## Variables de Estado Relevantes (ProductCard.tsx)

```typescript
const [enrichedProduct]      // Datos completos (variaciones) cargados tras interacción
const [isFetchingVariations] // Estado de carga del fetch on-demand
const [failedSyntheticColors] // Lista de colores que dieron 404 (para no volver a intentarlos)
```

## Notas Importantes

1. **Hard Refresh**: Si los cambios en el código de la API no se ven, usa `Ctrl+F5`. Hemos configurado cabeceras `no-store` temporalmente en desarrollo para facilitar las pruebas.
2. **Prioridad sobre Placeholder**: El sistema ahora prioriza mostrar la imagen base del producto antes que un placeholder genérico si la variante falla.
