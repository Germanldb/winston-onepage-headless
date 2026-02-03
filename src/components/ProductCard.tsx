import { useState, useEffect, useMemo } from 'react';

interface Product {
    id: number;
    name: string;
    slug: string;
    permalink: string;
    prices: {
        price: string;
        regular_price: string;
        sale_price: string;
        price_range: any;
        currency_code: string;
        currency_symbol: string;
        currency_minor_unit: number;
        currency_prefix: string;
    };
    images: {
        id?: number;
        src: string;
        alt: string;
        name?: string;
    }[];
    attributes: {
        id: number;
        name: string;
        terms: { id: number; name: string; slug: string }[];
    }[];
    variations: {
        id: number;
        attributes: { name: string; value: string }[];
    }[];
    variation_images_map?: Record<string, any[]>;
}

interface Props {
    product: Product;
}

export default function ProductCard({ product }: Props) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [hoveredColor, setHoveredColor] = useState<string | null>(null);

    useEffect(() => {
        const favorites = JSON.parse(localStorage.getItem('wh_favorites') || '[]');
        setIsFavorite(favorites.some((fav: any) => fav.id === product.id));
    }, [product.id]);

    const toggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const favorites = JSON.parse(localStorage.getItem('wh_favorites') || '[]');
        let newFavorites;
        if (isFavorite) {
            newFavorites = favorites.filter((fav: any) => fav.id !== product.id);
        } else {
            newFavorites = [...favorites, product];
        }
        localStorage.setItem('wh_favorites', JSON.stringify(newFavorites));
        setIsFavorite(!isFavorite);
        window.dispatchEvent(new Event('storage'));
    };

    // Color Logic
    const colorAttribute = product.attributes?.find(attr =>
        attr.name.toLowerCase().includes('color')
    );

    const activeColor = hoveredColor || selectedColor;

    const displayImages = useMemo(() => {
        if (!activeColor) return product.images;

        const colorSlug = activeColor.toLowerCase();

        // 1. Prioridad: Mapa de imágenes de variaciones (Enriquecido por la API)
        if (product.variation_images_map && product.variation_images_map[colorSlug]) {
            return product.variation_images_map[colorSlug];
        }

        // 2. Fallback: Filtrado robusto (el mismo de ProductDetail)
        const colorTerm = colorAttribute?.terms.find(t => t.slug === activeColor);
        const colorName = colorTerm?.name.toLowerCase() || "";

        const matches = product.images.filter(img => {
            const src = (img.src || "").toLowerCase();
            const alt = (img.alt || "").toLowerCase();
            const name = (img.name || "").toLowerCase();

            return src.includes(`-${colorSlug}`) ||
                src.includes(`_${colorSlug}`) ||
                src.includes(`-${colorName}`) ||
                src.includes(`_${colorName}`) ||
                alt.includes(colorName) ||
                name.includes(colorName);
        });

        if (matches.length > 0) return matches;

        // 3. Fallback Avanzado: Predicción de URL (Si no hay match, intentamos construir la URL cambiando el color)
        // Ejemplo: .../Chuka-Vino-1.jpg -> .../Chuka-Negro-1.jpg
        if (product.images.length > 0 && colorAttribute) {
            const baseImage = product.images[0];
            const baseSrc = baseImage.src;

            // Buscar qué color está presente en la imagen base
            const colorInUrl = colorAttribute.terms.find(t =>
                baseSrc.toLowerCase().includes(t.slug.toLowerCase()) ||
                baseSrc.toLowerCase().includes(t.name.toLowerCase())
            );

            if (colorInUrl) {
                const colorToReplace = baseSrc.match(new RegExp(colorInUrl.name, 'i')) ? colorInUrl.name : colorInUrl.slug;
                // Determinamos el formato (Mayúscula/Minúscula) basado en lo que encontramos
                const isCapitalized = colorToReplace[0] === colorToReplace[0].toUpperCase();

                let newColorStr = activeColor;
                // Buscamos el nombre nice del color activo
                const activeColorTerm = colorAttribute.terms.find(t => t.slug === activeColor);
                if (activeColorTerm) newColorStr = activeColorTerm.name; // Usamos el nombre ('Negro' en vez de 'negro' si está disponible)

                // Ajustamos capitalización del nuevo color para que coincida con el estilo de la URL
                if (isCapitalized) {
                    newColorStr = newColorStr.charAt(0).toUpperCase() + newColorStr.slice(1).toLowerCase();
                } else {
                    newColorStr = newColorStr.toLowerCase();
                }

                // Reemplazamos el color antiguo por el nuevo (case insensitive regex)
                let newSrc = baseSrc.replace(new RegExp(colorToReplace, 'i'), newColorStr);

                // LIMPIEZA DE URL: Quitamos sufijos raros de WP (ej. -e123456...) para apuntar al archivo original limpio
                // Patrón: -e[digitos] antes de la extensión. Opcional.
                newSrc = newSrc.replace(/-e\d+(?=\.(jpg|jpeg|png|webp))/i, '');

                // Creamos imagen sintética
                const syntheticImage = {
                    ...baseImage,
                    id: 999999, // ID falso
                    src: newSrc,
                    alt: `${product.name} ${newColorStr}`
                };

                return [syntheticImage];
            }
        }

        return product.images;
    }, [activeColor, product.images, colorAttribute, product.variation_images_map]);

    const mainImage = displayImages[0] || product.images[0];

    // Smart Guess: Si no hay segunda imagen oficial para el color, intentamos adivinarla
    const hoverImageRaw = displayImages[1];

    const guessedHoverSrc = useMemo(() => {
        if (hoverImageRaw) return null;
        if (!mainImage?.src) return null;

        // Patrones comunes: nombre-1.jpg -> nombre-2.jpg, nombre_1.jpg -> nombre_2.jpg
        if (mainImage.src.match(/[-_]1\.(jpg|jpeg|png|webp)$/i)) {
            return mainImage.src.replace(/([-_])1(\.(?:jpg|jpeg|png|webp))$/i, '$12$2');
        }
        return null;
    }, [mainImage, hoverImageRaw]);

    const [isHoverImageValid, setIsHoverImageValid] = useState(true);

    // Reset validation when image changes
    useEffect(() => {
        setIsHoverImageValid(true);
    }, [guessedHoverSrc, hoverImageRaw]);

    const effectiveHoverSrc = hoverImageRaw?.src || (isHoverImageValid ? guessedHoverSrc : null);

    const regularPrice = parseInt(product.prices.regular_price);
    const price = parseInt(product.prices.price);
    const currencyMinorUnit = product.prices.currency_minor_unit || 0;
    const isSale = regularPrice > price;
    const renderRegularPrice = regularPrice / (10 ** currencyMinorUnit);
    const renderPrice = price / (10 ** currencyMinorUnit);
    const currencySymbol = product.prices.currency_prefix || product.prices.currency_symbol;

    return (
        <div className="product-card">
            <div className="card-content">
                <a href={`/productos/${product.slug}${selectedColor ? `?color=${selectedColor}` : ''}`} className="image-link">
                    <div className="product-image">
                        <div className="badges-container">
                            {isSale && (
                                <span className="badge badge-sale">
                                    -{Math.round(((renderRegularPrice - renderPrice) / renderRegularPrice) * 100)}%
                                </span>
                            )}
                        </div>

                        <picture className="primary-image">
                            {mainImage?.src && (
                                <source srcSet={mainImage.src + '.webp'} type="image/webp" />
                            )}
                            <img
                                key={mainImage?.src}
                                src={mainImage?.src || 'https://via.placeholder.com/300x400?text=Zapato'}
                                alt={mainImage?.alt || product.name}
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                className="fade-in"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = 'https://via.placeholder.com/300x400?text=Sin+Imagen';
                                }}
                            />
                        </picture>

                        {effectiveHoverSrc && (
                            <picture className="hover-image">
                                <source srcSet={effectiveHoverSrc + '.webp'} type="image/webp" />
                                <img
                                    src={effectiveHoverSrc}
                                    alt={hoverImageRaw?.alt || product.name}
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        // Si la imagen adivinada falla, ocultamos el hover
                                        e.currentTarget.style.display = 'none';
                                        setIsHoverImageValid(false);
                                    }}
                                />
                            </picture>
                        )}
                        <button
                            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                            onClick={toggleFavorite}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                    </div>
                </a>

                <div className="product-info">
                    <div className="info-top-row">
                        <h3>
                            <a href={`/productos/${product.slug}${selectedColor ? `?color=${selectedColor}` : ''}`}>{product.name}</a>
                        </h3>

                        {colorAttribute && (
                            <div className="card-colors">
                                {colorAttribute.terms.map((term) => (
                                    <button
                                        key={term.id}
                                        type="button"
                                        className={`color-swatch-btn ${selectedColor === term.slug ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSelectedColor(term.slug);
                                        }}
                                        onMouseEnter={() => setHoveredColor(term.slug)}
                                        onMouseLeave={() => setHoveredColor(null)}
                                        title={term.name}
                                    >
                                        <span
                                            className="color-circle"
                                            style={{ backgroundColor: getColorCode(term.slug) }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <p className="price">
                        {isSale ? (
                            <>
                                <span className="old-price">
                                    {currencySymbol}{new Intl.NumberFormat('es-CO').format(renderRegularPrice)}
                                </span>
                                <span className="sale-price">
                                    {currencySymbol}{new Intl.NumberFormat('es-CO').format(renderPrice)}
                                </span>
                            </>
                        ) : (
                            <span>
                                {currencySymbol}{new Intl.NumberFormat('es-CO').format(renderPrice)}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            <style>{`
        .product-card {
          background: #fff;
          display: flex;
          flex-direction: column;
        }

        .product-image {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          background-color: #f6f6f6;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .product-image img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
        }

        .hover-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1;
        }

        .favorite-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            cursor: pointer;
            z-index: 10;
            transition: all 0.2s ease;
            color: var(--color-green);
            padding: 0;
        }

        .favorite-btn:hover { transform: scale(1.1); color: #d62828; }
        .favorite-btn.active { color: #d62828; }

        .badges-container {
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 10;
        }

        .badge {
            color: #fff;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 4px 8px;
            text-transform: uppercase;
        }
        .badge-sale { background-color: #A98B68; }

        .product-card:hover .product-image img { transform: scale(1.05); }
        .product-card:hover .hover-image { opacity: 1; }
        .product-card:hover .product-image img:not(.hover-image img) { opacity: 0; } /* Opcional: Ocultar la principal si la hover es sólida */

        .product-info { 
            padding: 20px 0.5rem; 
        }

        .info-top-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.3rem;
        }
        
        .product-info h3 { 
           margin: 0;
           line-height: 1;
        }

        .product-info h3 a {
          font-family: var(--font-products); 
          font-size: 0.85rem; 
          font-weight: 300; 
          color: #121212; 
          text-decoration: none;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .price { 
            color: #a3a3a3; 
            font-weight: 400; 
            font-size: 0.85rem; 
            font-family: var(--font-products);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .old-price { text-decoration: line-through; color: #ccc; }
        .sale-price { color: var(--color-beige); font-weight: 500; }

        .card-colors {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .color-swatch-btn {
            background: none;
            border: none;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            width: 19px;
            height: 19px;
        }

        .color-circle {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 1px solid rgba(0,0,0,0.1);
            display: block;
        }

        .color-swatch-btn:hover .color-circle { transform: scale(1.1); }
        
        .color-swatch-btn.active::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 1px solid #121212;
            border-radius: 50%;
        }

        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0.5; } to { opacity: 1; } }
      `}</style>
        </div>
    );
}

function getColorCode(slug: string): string {
    const colors: Record<string, string> = {
        'negro': '#121212',
        'cafe': '#6F4E37',
        'miel': '#D4A373',
        'azul': '#1B3F8B',
        'verde': '#155338',
        'vino': '#722F37',
        'tabaco': '#8B5A2B',
        'cognac': '#9A463D',
        'rojo': '#C41E3A',
        'blanco': '#FFFFFF',
        'gris': '#888888',
        'plata': '#C0C0C0',
        'silver': '#C0C0C0',
        'oro': '#D4AF37',
        'gold': '#D4AF37',
        'beige': '#F5F5DC',
        'arena': '#E2CBA4',
        'tabac': '#8B5A2B'
    };
    return colors[slug.toLowerCase()] || '#ddd';
}
