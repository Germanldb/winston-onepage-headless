import { useState, useEffect, useMemo } from 'react';

interface Product {
  id: number;
  name: string;
  description: string;
  short_description: string;
  prices: {
    price: string;
    currency_code: string;
    currency_symbol: string;
    currency_minor_unit: number;
    currency_prefix: string;
  };
  images: {
    id: number;
    src: string;
    alt: string;
    name: string;
  }[];
  attributes: {
    id: number;
    name: string;
    terms: { id: number; name: string; slug: string }[];
  }[];
  categories: { id: number; name: string; slug: string }[];
  variations?: {
    id: number;
    attributes: { name: string; value: string }[];
    image?: { id: number; src: string; alt: string };
  }[];
  variation_images_map?: Record<string, any[]>;
}

interface Props {
  initialProduct: Product;
}

export default function ProductDetail({ initialProduct }: Props) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const product = initialProduct;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const colorParam = params.get('color');
    const tallaParam = params.get('talla');

    if (colorParam) setSelectedColor(colorParam);
    if (tallaParam) setSelectedSize(tallaParam);
  }, []);

  const sizeAttribute = product.attributes?.find(attr =>
    attr.name.toLowerCase().includes('talla') ||
    attr.terms.some(t => !isNaN(Number(t.name)))
  );

  const hasSize = !!sizeAttribute;

  const colorAttribute = product.attributes?.find(attr =>
    attr.name.toLowerCase().includes('color')
  );

  const mainCategory = useMemo(() => {
    if (!product.categories || product.categories.length === 0) return null;
    const cat = product.categories.find(c =>
      !c.name.includes('$') &&
      !c.name.toLowerCase().includes('regalo') &&
      !c.name.toLowerCase().includes('grande')
    );
    return cat || product.categories[0];
  }, [product.categories]);

  const filteredImages = useMemo(() => {
    if (!selectedColor) return product.images;
    const colorSlug = selectedColor.toLowerCase();

    if (product.variation_images_map && product.variation_images_map[colorSlug]) {
      return product.variation_images_map[colorSlug];
    }

    const colorTerm = colorAttribute?.terms.find(t => t.slug === selectedColor);
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
    return product.images;
  }, [selectedColor, product.images, colorAttribute, product.variation_images_map]);

  useEffect(() => {
    setActiveImageIndex(0);
    const gallery = document.querySelector('.product-gallery');
    if (gallery) gallery.scrollLeft = 0;
  }, [filteredImages]);

  const isCombinationAvailable = (color: string | null, size: string | null) => {
    if (!product.variations || product.variations.length === 0) return true;

    return product.variations.some(variation => {
      const vColor = variation.attributes.find(a =>
        a.name.toLowerCase().includes('color') || a.name === 'Pa_selecciona-el-color'
      )?.value.toLowerCase();

      const vSize = variation.attributes.find(a =>
        a.name.toLowerCase().includes('talla') || a.name === 'Pa_selecciona-una-talla'
      )?.value.toLowerCase();

      const matchesColor = !color || vColor === color.toLowerCase();
      const matchesSize = !size || vSize === size.toLowerCase();

      return matchesColor && matchesSize;
    });
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: product.prices.currency_code,
      minimumFractionDigits: 0
    }).format(parseInt(price) / (10 ** product.prices.currency_minor_unit));
  };

  const isSelectionComplete = selectedColor && (!hasSize || selectedSize);

  const handleAddToCart = () => {
    const cartItem = {
      id: product.id,
      name: product.name,
      price: parseInt(product.prices.price) / (10 ** product.prices.currency_minor_unit),
      color: selectedColor,
      size: selectedSize,
      quantity: quantity,
      image: filteredImages[0]?.src || product.images[0]?.src
    };

    const cart = JSON.parse(localStorage.getItem('wh_cart') || '[]');
    const existingItemIndex = cart.findIndex((item: any) =>
      item.id === cartItem.id && item.color === cartItem.color && item.size === cartItem.size
    );

    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += quantity;
    } else {
      cart.push(cartItem);
    }

    localStorage.setItem('wh_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    window.dispatchEvent(new Event('open-cart-drawer'));
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== activeImageIndex) setActiveImageIndex(newIndex);
  };

  return (
    <div className="product-detail">
      <div className="product-detail-split">
        <div className="product-gallery-container" id="main-gallery">
          <div className="product-gallery" onScroll={handleScroll}>
            {filteredImages.map((img, index) => (
              <div key={img.id || index} className="gallery-item">
                <picture>
                  <img
                    src={img.src}
                    alt={img.alt || product.name}
                    referrerPolicy="no-referrer"
                    loading={index === 0 ? "eager" : "lazy"}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'https://via.placeholder.com/1200x1200?text=Winston+%26+Harry';
                    }}
                  />
                </picture>
              </div>
            ))}
          </div>
          {filteredImages.length > 1 && (
            <div className="gallery-dots">
              {filteredImages.map((_, i) => (
                <span key={i} className={`dot ${i === activeImageIndex ? 'active' : ''}`}></span>
              ))}
            </div>
          )}
        </div>

        <div className="product-info-sidebar">
          <div className="sidebar-inner">
            <div className="sidebar-content">
              <div className="product-breadcrumbs">
                <a href="/">Inicio</a>
                <span className="separator">/</span>
                {mainCategory && (
                  <>
                    <a href="/#tienda">{mainCategory.name}</a>
                    <span className="separator">/</span>
                  </>
                )}
                <span className="current">{product.name}</span>
              </div>

              <span className="product-category">Colección Artesanal</span>
              <h1 className="product-title">{product.name}</h1>
              <p className="product-price">{formatPrice(product.prices.price)}</p>

              <div className="product-short-description" dangerouslySetInnerHTML={{ __html: product.short_description }} />

              <div className="product-selectors">
                {colorAttribute && (
                  <div className="selector-group">
                    <label>Color: <strong>{colorAttribute.terms.find(t => t.slug === selectedColor)?.name || ''}</strong></label>
                    <div className="color-options">
                      {colorAttribute.terms.map((term) => {
                        const isAvailable = isCombinationAvailable(term.slug, null);
                        return (
                          <button
                            key={term.id}
                            className={`color-dot-btn ${selectedColor === term.slug ? 'active' : ''} ${!isAvailable ? 'out-of-stock' : ''}`}
                            onClick={() => setSelectedColor(term.slug)}
                          >
                            <span className="color-dot" style={{ backgroundColor: getColorCode(term.slug) }}></span>
                            {!isAvailable && <span className="x-mark">✕</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {hasSize && (
                  <div className="selector-group">
                    <div className="label-row-between">
                      <label>Talla: <strong>{sizeAttribute?.terms.find(t => t.slug === selectedSize)?.name || ''}</strong></label>
                      <button className="size-guide-dark" onClick={() => setShowSizeGuide(true)}>GUÍA DE TALLAS</button>
                    </div>
                    <div className="size-options">
                      {sizeAttribute.terms.map((term) => {
                        const isAvailable = isCombinationAvailable(selectedColor, term.slug);
                        return (
                          <button
                            key={term.id}
                            className={`size-box-btn ${selectedSize === term.slug ? 'active' : ''} ${!isAvailable ? 'out-of-stock' : ''}`}
                            onClick={() => isAvailable && setSelectedSize(term.slug)}
                          >
                            {term.name}
                            {!isAvailable && <span className="x-mark">✕</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="quantity-selector-container">
                <label>Cantidad:</label>
                <div className="quantity-controls">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)}>+</button>
                </div>
              </div>

              <div className="product-actions-grid">
                <button
                  className={`btn-action btn-fill ${isSelectionComplete ? '' : 'disabled'}`}
                  disabled={!isSelectionComplete}
                  onClick={handleAddToCart}
                >
                  Añadir al Carrito
                </button>
                <button
                  className={`btn-action btn-outline-thick ${isSelectionComplete ? '' : 'disabled'}`}
                  disabled={!isSelectionComplete}
                  onClick={() => {
                    handleAddToCart();
                    window.location.href = '/checkout';
                  }}
                >
                  Comprar Ahora
                </button>
              </div>

              <div className="product-details-dropdowns">
                <details open>
                  <summary>Descripción y Detalles</summary>
                  <div className="dropdown-inner" dangerouslySetInnerHTML={{ __html: product.description }} />
                </details>
                <details>
                  <summary>Envío y Cambios</summary>
                  <div className="dropdown-inner">
                    <p>Entrega estándar gratuita en todos los pedidos. Cambios disponibles dentro de los 15 días.</p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSizeGuide && (
        <div className="size-guide-modal-overlay" onClick={() => setShowSizeGuide(false)}>
          <div className="size-guide-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSizeGuide(false)}>✕</button>
            <h2>Guía de Tallas</h2>
            <div className="table-responsive">
              <table className="size-guide-table">
                <thead>
                  <tr>
                    <th>COLOMBIA</th>
                    <th>WINSTON & HARRY</th>
                    <th>US</th>
                    <th>UK</th>
                    <th>EUROPA</th>
                    <th>PIE (CM)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['37', '37', '6.5', '5', '39', '24.5'],
                    ['38', '38', '7.5', '6', '41.5', '25.5'],
                    ['39', '39', '8', '7', '41', '26'],
                    ['40', '40', '9', '8', '42', '27'],
                    ['41', '41', '9.5', '8.5', '42.5', '27.5'],
                    ['42', '42', '10', '9', '43', '28'],
                    ['43', '43', '11', '10', '44', '29'],
                    ['44', '44', '12', '11', '45', '29.5'],
                  ].map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => <td key={j}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .product-detail { background: #fff; width: 100%; }

        .product-breadcrumbs {
            margin-bottom: 2rem;
            font-size: 0.8rem;
            color: #777;
            font-family: var(--font-paragraphs);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        .product-breadcrumbs a {
            color: #708090;
            transition: color 0.2s;
        }
        .product-breadcrumbs a:hover {
            color: var(--color-beige);
        }
        .product-breadcrumbs .separator {
            color: #ddd;
        }
        .product-breadcrumbs .current {
            color: #121212;
            font-weight: 500;
        }

        .product-detail-split { display: flex; flex-direction: row; }
        .product-gallery-container { width: 50%; position: relative; }
        .product-gallery { display: flex; flex-direction: column; background: #f8f8f8; }
        .gallery-item img { width: 100%; height: auto; display: block; object-fit: cover; }
        .gallery-dots { display: none; }
        .product-info-sidebar { width: 50%; background: #fff; }
        .sidebar-inner { padding: 4rem 10% 5rem; height: 100%; }
        .sidebar-content { position: sticky; top: 140px; }
        .product-category { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-bottom: 1rem; }
        .product-title { font-family: var(--font-products); font-size: 1.8rem; color: #000; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 500; }
        .product-price { font-size: 1rem; color: #A98B68; margin-bottom: 2rem; font-weight: 400; }
        
        .quantity-selector-container {
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .quantity-selector-container label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #888;
        }
        .quantity-controls {
            display: flex;
            align-items: center;
            border: 1px solid #eee;
            border-radius: 2px;
            overflow: hidden;
            background: #fff;
        }
        .quantity-controls button {
            background: none;
            border: none;
            width: 32px;
            height: 32px;
            cursor: pointer;
            font-size: 1.1rem;
            color: #121212;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        .quantity-controls button:hover {
            background: #f9f9f9;
        }
        .quantity-controls span {
            width: 40px;
            text-align: center;
            font-size: 0.9rem;
            font-weight: 600;
        }

        .product-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 3rem; }
        .btn-action { padding: 1.1rem 0.5rem; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all 0.3s; border-radius: 2px; font-family: var(--font-paragraphs); border: 1.5px solid var(--color-green); }
        .btn-fill { background-color: var(--color-green); color: #fff; }
        .btn-outline-thick { background-color: #fff; color: var(--color-green); border: 1px solid var(--color-green) !important; }
        .btn-action:hover:not(.disabled) { opacity: 0.8; transform: translateY(-2px); }
        .btn-action.disabled { background-color: #eee; border-color: #eee; color: #999; cursor: not-allowed; }
        .product-short-description { font-size: 0.85rem; color: #555; line-height: 1.7; margin-bottom: 3rem; }
        .selector-group { margin-bottom: 1.5rem; }
        .selector-group label { display: block; font-size: 0.75rem; text-transform: uppercase; color: #888; margin-bottom: 0px; letter-spacing: 1px; }
        .label-row-between { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem; }
        .color-dot-btn { background: none; border: none; padding: 4px; cursor: pointer; border: 1px solid transparent; border-radius: 50%; transition: all 0.2s; position: relative; }
        .color-dot-btn.active { border-color: #000; }
        .color-dot-btn.out-of-stock { opacity: 0.4; }
        .color-dot { display: block; width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.05); }
        .size-options { display: flex; flex-wrap: wrap; gap: 0.8rem; }
        .size-box-btn { min-width: 48px; height: 48px; border: 1px solid #eee; background: #fff; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; border-radius: 2px; position: relative; color: #121212; }
        .size-box-btn.active { background: #000; color: #fff; border-color: #000; }
        .size-box-btn.out-of-stock { background-color: #fcfcfc; color: #ddd; border-color: #f1f1f1; }
        .size-guide-dark { background: none; border: none; text-decoration: underline; color: #000; font-weight: 700; cursor: pointer; font-size: 0.7rem; letter-spacing: 1px; text-transform: uppercase; padding: 0; }
        .size-guide-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .size-guide-modal-content { background: #fff; padding: 3rem; max-width: 800px; width: 100%; position: relative; border-radius: 4px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
        .modal-close { position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999; }
        .size-guide-modal-content h2 { font-family: var(--font-products); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2rem; text-align: center; color: var(--color-green); }
        .size-guide-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .size-guide-table th { background: #f9f9f9; padding: 1rem; text-align: center; font-weight: 700; color: var(--color-green); font-family: var(--font-products); border-bottom: 2px solid #eee; }
        .size-guide-table td { padding: 1rem; text-align: center; border-bottom: 1px solid #eee; color: #666; }
        .product-details-dropdowns { border-top: 1px solid #eee; margin-top: 4rem; }
        summary { list-style: none; padding: 1.5rem 0; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; }
        summary::after { content: '+'; color: #999; font-size: 1.2rem; }
        details[open] summary::after { content: '−'; }
        @media (max-width: 992px) {
          .product-breadcrumbs { margin-top: 0; margin-bottom: 1.5rem; font-size: 0.75rem; }
          .product-detail-split { flex-direction: column; }
          .product-gallery-container { width: 100%; order: 1; }
          .product-gallery { flex-direction: row; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
          .gallery-item { flex: 0 0 100%; scroll-snap-align: center; }
          .gallery-dots { display: flex; justify-content: center; gap: 6px; position: absolute; bottom: 20px; left: 0; right: 0; z-index: 5; }
          .dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(0,0,0,0.2); transition: all 0.3s; }
          .dot.active { background: #000; transform: scale(1.2); }
          .product-info-sidebar { width: 100%; order: 2; }
          .sidebar-inner { padding: 3rem 1.5rem; }
          .sidebar-content { position: static; }
          .product-actions-grid { grid-template-columns: 1fr 1fr; }
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
