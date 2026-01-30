import { useState, useEffect } from 'react';

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
        src: string;
        alt: string;
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
}

interface Props {
    product: Product;
}

export default function ProductCard({ product }: Props) {
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);

    // Lógica de Favoritos
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        const favorites = JSON.parse(localStorage.getItem('wh_favorites') || '[]');
        setIsFavorite(favorites.some((fav: Product) => fav.id === product.id));
    }, [product.id]);

    const toggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Evitar navegación al clickear

        const favorites = JSON.parse(localStorage.getItem('wh_favorites') || '[]');
        let newFavorites;

        if (isFavorite) {
            newFavorites = favorites.filter((fav: Product) => fav.id !== product.id);
        } else {
            newFavorites = [...favorites, product];
        }

        localStorage.setItem('wh_favorites', JSON.stringify(newFavorites));
        setIsFavorite(!isFavorite);

        // Disparar evento custom para actualizar otros componentes si es necesario
        window.dispatchEvent(new Event('storage'));
    };

    // Identificar atributos
    const colorAttribute = product.attributes.find(attr =>
        attr.name.toLowerCase().includes('color') || attr.name.toLowerCase().includes('color')
    );

    const sizeAttribute = product.attributes.find(attr =>
        attr.name.toLowerCase().includes('talla') ||
        attr.terms.some(t => !isNaN(Number(t.name)))
    );

    const hasSize = !!sizeAttribute;

    // Price Logic
    const regularPrice = parseInt(product.prices.regular_price);
    const price = parseInt(product.prices.price);
    const currencyMinorUnit = product.prices.currency_minor_unit || 0;

    // Check for valid discount
    const isSale = regularPrice > price;

    // Calculate values properly considering minor units (usually 0 for COP but good practice)
    const renderRegularPrice = regularPrice / (10 ** currencyMinorUnit);
    const renderPrice = price / (10 ** currencyMinorUnit);

    const discountPercentage = isSale
        ? Math.round(((renderRegularPrice - renderPrice) / renderRegularPrice) * 100)
        : 0;

    // Filtrar tallas disponibles según el color seleccionado
    const availableSizes = selectedColor && hasSize
        ? sizeAttribute?.terms.filter(term => {
            // Estrategia 1: Buscar en 'variations' si existe la combinación
            if (product.variations && product.variations.length > 0) {
                return product.variations.some(variation => {
                    const variationColor = variation.attributes.find(a =>
                        a.name.toLowerCase().includes('color') || a.name === 'Pa_selecciona-el-color'
                    )?.value.toLowerCase();

                    const variationSize = variation.attributes.find(a =>
                        a.name.toLowerCase().includes('talla') || a.name === 'Pa_selecciona-una-talla'
                    )?.value.toLowerCase();

                    const matchesColor = variationColor === selectedColor.toLowerCase();
                    const matchesSize = variationSize === term.slug.toLowerCase() || variationSize === term.name.toLowerCase();

                    return matchesColor && matchesSize;
                });
            }
            // Estrategia 2: Fallback
            return true;
        })
        : [];

    const isSelectionComplete = selectedColor && (!hasSize || selectedSize);

    const handleAddToCart = (e: React.MouseEvent) => {
        if (!isSelectionComplete) {
            // Si no está completo, navegamos al producto
            return;
        }
        e.preventDefault();

        let url = `/productos/${product.slug}?color=${selectedColor}`;
        if (selectedSize) url += `&talla=${selectedSize}`;

        window.location.href = url;
    };

    const currencySymbol = product.prices.currency_prefix || product.prices.currency_symbol;

    return (
        <div className="product-card">
            <div className="card-content">
                <a href={`/productos/${product.slug}`} className="image-link">
                    <div className="product-image">
                        {/* Badges Logic */}
                        <div className="badges-container">
                            {isSale && discountPercentage > 0 && (
                                <>
                                    <span className="badge badge-sale">-{discountPercentage}%</span>
                                    {discountPercentage >= 40 && <span className="badge badge-hot">HOT</span>}
                                </>
                            )}
                        </div>

                        <picture className="primary-image">
                            {product.images[0]?.src && (
                                <source srcSet={product.images[0].src + '.webp'} type="image/webp" />
                            )}
                            <img
                                src={product.images[0]?.src || 'https://via.placeholder.com/300x400?text=Zapato'}
                                alt={product.images[0]?.alt || product.name}
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null; // Prevent loop
                                    target.src = 'https://via.placeholder.com/300x400?text=Sin+Imagen';
                                }}
                            />
                        </picture>

                        {product.images.length > 1 && (
                            <picture className="hover-image">
                                <source srcSet={product.images[1].src + '.webp'} type="image/webp" />
                                <img
                                    src={product.images[1].src}
                                    alt={product.images[1].alt || product.name}
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                />
                            </picture>
                        )}
                        <button
                            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                            onClick={toggleFavorite}
                            aria-label={isFavorite ? "Eliminar de favoritos" : "Añadir a favoritos"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                    </div>
                </a>

                <div className="product-info">
                    <div className="info-row">
                        <div className="info-left">
                            <h3>
                                <a href={`/productos/${product.slug}`}>{product.name}</a>
                            </h3>
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

                        <div className="info-right">
                            {/* Selector de Colores */}
                            {colorAttribute && (
                                <div className="card-colors">
                                    {colorAttribute.terms.map(term => (
                                        <button
                                            key={term.id}
                                            className={`color-dot ${selectedColor === term.slug ? 'selected' : ''}`}
                                            style={{ backgroundColor: getColorCode(term.slug) }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setSelectedColor(term.slug === selectedColor ? null : term.slug);
                                                if (hasSize) setSelectedSize(null);
                                            }}
                                            title={term.name}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selector de Tallas (Solo si tiene tallas y color seleccionado) */}
                    {selectedColor && hasSize && (
                        <div className="card-sizes fade-in">
                            <select
                                value={selectedSize || ''}
                                onChange={(e) => setSelectedSize(e.target.value)}
                                className="size-select"
                            >
                                <option value="">Talla</option>
                                {availableSizes?.map(term => (
                                    <option key={term.id} value={term.slug}>
                                        {term.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .product-card {
          background: #fff;
          transition: var(--transition-smooth);
          /* border: 1px solid #eee; Eliminamos borde si queremos look más limpio */
          display: flex;
          flex-direction: column;
        }

        .image-link {
          display: block;
          overflow: hidden;
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
          object-position: center;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease;
        }

        .hover-image {
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1;
        }

        .primary-image {
            display: block;
            width: 100%;
            height: 100%;
            z-index: 0;
        }
        
        /* Botón de Favoritos */
        .favorite-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            transition: all 0.2s ease;
            color: var(--color-green); /* Verde por defecto */
            padding: 0;
        }

        .favorite-btn:hover {
            transform: scale(1.1);
            color: #d62828;
        }

        .favorite-btn.active {
            color: #d62828; /* Rojo al estar activo */
        }
        
        .favorite-btn svg {
            pointer-events: none;
        }

        /* Badges */
        .badges-container {
            position: absolute;
            top: 10px;
            left: 10px;
            display: flex;
            flex-direction: column;
            gap: 5px;
            z-index: 10;
        }

        .badge {
            color: #fff;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 4px 8px;
            text-transform: uppercase;
            font-family: 'Helvetica', sans-serif;
        }

        .badge-sale {
            background-color: #A98B68; /* Tono beige oscuro de la imagen */
        }

        .badge-hot {
            background-color: #D32F2F; /* Rojo intenso */
        }

        .product-card:hover .product-image img { transform: scale(1.05); }
        
        .product-card:hover .hover-image {
            opacity: 1;
        }

        .product-card:hover .primary-image {
            opacity: 0.8; /* Efecto sutil de desvanecido */
        }

        .product-info { 
            padding: 1.5rem 1rem; 
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 1rem;
        }

        .info-left {
            flex-grow: 1;
        }
        
        .product-info h3 { 
           margin: 0 0 0.2rem;
           min-height: auto;
           display: flex;
           justify-content: flex-start;
        }

        .product-info h3 a {
          font-family: var(--font-products); 
          font-size: 0.8rem; 
          font-weight: 300; 
          color: #121212; 
          text-decoration: none;
          text-transform: none; 
          letter-spacing: 0.3px;
          display: block;
        }

        .price { 
            color: #a3a3a3ff; 
            font-weight: 400; 
            font-size: 0.8rem; 
            font-family: var(--font-products);
            margin-bottom: 0;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .old-price {
            text-decoration: line-through;
            color: #999;
            font-weight: 400;
            font-size: 0.75rem;
        }

        .sale-price {
            color: var(--color-beige);
            font-weight: 500;
        }

        .card-colors {
          display: flex;
          justify-content: flex-end;
          gap: 0.8rem;
          margin-bottom: 0px;
          min-height: 18px;
        }

        .color-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.1);
          cursor: pointer;
          transition: transform 0.2s;
          padding: 0;
          position: relative;
        }
        
        .color-dot:hover { transform: scale(1.1); }
        .color-dot.selected::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 0;
          width: 100%;
          height: 1.5px;
          background-color: #121212;
        }

        .card-sizes {
          margin-top: 0.5rem;
        }

        .size-select {
          width: fit-content;
          min-width: 80px;
          padding: 0.3rem 0.5rem;
          border: 1px solid #eee;
          background: #fff;
          font-family: var(--font-products);
          font-size: 0.75rem;
          color: #777;
          cursor: pointer;
        }

        /* Ajuste fino del icono */
        .btn-icon svg { width: 20px; height: 20px; }

        .fade-in {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
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
        'rojo': '#C41E3A'
    };
    return colors[slug.toLowerCase()] || '#ddd';
}
