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

                        <picture>
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
                        <button
                            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                            onClick={toggleFavorite}
                            aria-label={isFavorite ? "Eliminar de favoritos" : "Añadir a favoritos"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                    </div>
                </a>

                <div className="product-info">
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

                    {/* Selector de Tallas (Solo si tiene tallas y color seleccionado) */}
                    {selectedColor && hasSize && (
                        <div className="card-sizes fade-in">
                            <select
                                value={selectedSize || ''}
                                onChange={(e) => setSelectedSize(e.target.value)}
                                className="size-select"
                            >
                                <option value="">Elige una opción</option>
                                {availableSizes?.map(term => (
                                    <option key={term.id} value={term.slug}>
                                        {term.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="card-footer">
                        {selectedColor ? (
                            <button
                                className="btn-action"
                                onClick={handleAddToCart}
                                disabled={false}
                            >
                                <div className="btn-content-wrapper">
                                    <span className="btn-text">
                                        {hasSize && !selectedSize ? 'SELECCIONA TALLA' : 'AÑADIR AL CARRITO'}
                                    </span>
                                    <span className="btn-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                                    </span>
                                </div>
                            </button>
                        ) : (
                            <a href={`/productos/${product.slug}`} className="btn-action">
                                <div className="btn-content-wrapper">
                                    <span className="btn-text">SELECCIONAR OPCIONES</span>
                                    <span className="btn-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                                    </span>
                                </div>
                            </a>
                        )}
                    </div>
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
          aspect-ratio: 1/1;
          overflow: hidden;
          background-color: #f6f6f6;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        
        /* Botón de Favoritos */
        .favorite-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.8);
            border: none;
            border-radius: 50%;
            width: 35px;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            transition: all 0.2s ease;
            color: #333;
        }

        .favorite-btn:hover {
            transform: scale(1.1);
            background: #fff;
            color: #d62828;
             box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .favorite-btn.active {
            color: #d62828;
            background: #fff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
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

        .product-info { 
            padding: 1.5rem 0; 
            text-align: left; /* Alineación izquierda */
        }
        
        .product-info h3 { 
           margin: 0 0 0.5rem;
           min-height: auto;
           display: flex;
           justify-content: flex-start;
        }

        .product-info h3 a {
          font-family: var(--font-products); 
          font-size: 1.25rem; 
          font-weight: 300; 
          color: var(--color-green); 
          text-decoration: none;
          text-transform: uppercase; 
          letter-spacing: 0px;
          display: block;
          transform: scaleX(0.9);
          transform-origin: left;
        }

        .price { 
            color: var(--color-beige); 
            font-weight: 700; 
            font-size: 0.9rem; 
            font-family: 'Helvetica', sans-serif;
            margin-bottom: 0.8rem;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .old-price {
            text-decoration: line-through;
            color: #999;
            font-weight: 400;
            font-size: 0.85rem;
        }

        .sale-price {
            color: var(--color-beige);
            font-weight: 700;
        }

        .card-colors {
          display: flex;
          justify-content: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.8rem;
          min-height: 20px;
        }

        .color-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.1);
          cursor: pointer;
          transition: transform 0.2s;
          padding: 0;
        }
        
        .color-dot:hover { transform: scale(1.1); }
        .color-dot.selected { 
          transform: scale(1.1); 
          box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--color-green);
        }

        .card-sizes {
          margin-bottom: 0.8rem;
        }

        .size-select {
          width: 100%;
          padding: 0.4rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: 'Helvetica', sans-serif;
          font-size: 0.85rem;
          color: #555;
        }

        /* Botón de Acción */
        .btn-action {
          width: 100%;
          height: 45px; /* Altura fija para evitar cambios de tamaño */
          background-color: var(--color-green);
          color: #fff;
          border: none;
          font-family: 'Helvetica', sans-serif; /* Fuente solicitada */
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.8rem;
          cursor: pointer;
          display: block;
          text-decoration: none;
          position: relative;
          overflow: hidden; /* Clave para el efecto slide */
          transition: background-color 0.3s ease;
        }

        .btn-content-wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            transition: transform 0.3s ease; /* Transición suave */
        }

        /* Estado normal: Texto visible, Icono abajo */
        .btn-text, .btn-icon {
            position: absolute;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .btn-text {
            top: 0;
            left: 0;
        }

        .btn-icon {
            top: 100%; /* Inicialmente fuera por abajo */
            left: 0;
        }

        /* Hover: Todo el contenido sube color negro */
        .btn-action:hover {
            background-color: #000 !important;
        }

        .btn-action:hover .btn-content-wrapper {
            transform: translateY(-100%);
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
