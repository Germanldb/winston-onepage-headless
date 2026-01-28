import { useState } from 'react';

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
    src: string;
    alt: string;
    name: string;
  }[];
  attributes: {
    id: number;
    name: string;
    terms: { id: number; name: string; slug: string }[];
  }[];
}

interface Props {
  initialProduct: Product;
}

export default function ProductDetail({ initialProduct }: Props) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const product = initialProduct;

  // Encontrar atributo de talla
  const sizeAttribute = product.attributes?.find(attr =>
    attr.name.toLowerCase().includes('talla') ||
    attr.terms.some(t => !isNaN(Number(t.name)))
  );

  // Encontrar atributo de color
  const colorAttribute = product.attributes?.find(attr =>
    attr.name.toLowerCase().includes('color')
  );

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: product.prices.currency_code,
      minimumFractionDigits: 0
    }).format(parseInt(price) / (10 ** product.prices.currency_minor_unit));
  };

  return (
    <div className="product-detail">
      <div className="container product-detail-grid">
        {/* Galería de Imágenes (Izquierda) */}
        <div className="product-gallery">
          {product.images.map((img, index) => (
            <div key={index} className="gallery-item">
              <img
                src={img.src}
                alt={img.alt || product.name}
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>

        {/* Información del Producto (Derecha - Sticky) */}
        <div className="product-sidebar">
          <div className="sidebar-sticky">
            <nav className="breadcrumb">
              <a href="/">Inicio</a> / <a href="/#tienda">Tienda</a> / {product.name}
            </nav>

            <h1 className="product-title">{product.name}</h1>
            <p className="product-price">{formatPrice(product.prices.price)}</p>

            <div className="product-short-desc" dangerouslySetInnerHTML={{ __html: product.short_description }} />

            {/* Selector de Color */}
            {colorAttribute && (
              <div className="attribute-selector color-selector">
                <div className="attribute-header">
                  <span>Color: {colorAttribute.terms.find(t => t.slug === selectedColor)?.name || 'Selecciona'}</span>
                </div>
                <div className="color-grid">
                  {colorAttribute.terms.map((term) => (
                    <button
                      key={term.id}
                      className={`color-btn ${selectedColor === term.slug ? 'selected' : ''}`}
                      onClick={() => setSelectedColor(term.slug)}
                      title={term.name}
                    >
                      <span className="color-swatch" style={{ backgroundColor: getColorCode(term.slug) }}></span>
                      <span className="color-name">{term.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de Talla */}
            {sizeAttribute && (
              <div className="attribute-selector size-selector">
                <div className="attribute-header">
                  <span>Talla: {sizeAttribute.terms.find(t => t.slug === selectedSize)?.name || ''}</span>
                  <button className="size-guide-btn">Guía de tallas</button>
                </div>
                <div className="size-grid">
                  {sizeAttribute.terms.map((term) => (
                    <button
                      key={term.id}
                      className={`size-btn ${selectedSize === term.slug ? 'selected' : ''}`}
                      onClick={() => setSelectedSize(term.slug)}
                    >
                      {term.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="actions">
              <button
                className={`btn btn-add-cart ${(selectedSize && (colorAttribute ? selectedColor : true)) ? '' : 'disabled'}`}
                disabled={!(selectedSize && (colorAttribute ? selectedColor : true))}
              >
                Añadir al carrito
              </button>
              <button
                className={`btn btn-buy-now ${(selectedSize && (colorAttribute ? selectedColor : true)) ? '' : 'disabled'}`}
                disabled={!(selectedSize && (colorAttribute ? selectedColor : true))}
              >
                Comprar ahora
              </button>
            </div>

            <div className="product-accordions">
              <details open>
                <summary>Características</summary>
                <div className="accordion-content" dangerouslySetInnerHTML={{ __html: product.description }} />
              </details>
              <details>
                <summary>Cuidado del Calzado</summary>
                <div className="accordion-content">
                  <ul>
                    <li>Limpiar con un paño suave y seco para remover polvo.</li>
                    <li>Usar cremas o ceras neutras para hidratar el cuero.</li>
                    <li>Dejar reposar el calzado al menos 24 horas entre usos.</li>
                    <li>Utilizar hormas de madera para mantener la forma.</li>
                  </ul>
                </div>
              </details>
              <details>
                <summary>Envío y Cambios</summary>
                <div className="accordion-content">
                  <p>Realizamos envíos a toda Colombia. Contamos con cambios gratuitos por talla dentro de los primeros 15 días posteriores a la compra.</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .product-detail {
          padding: 2rem 0 5rem;
          background-color: #fff;
        }

        .product-detail-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 5rem;
          align-items: start;
        }

        .product-gallery {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .gallery-item img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
          background-color: #f9f9f9;
        }

        .product-sidebar {
          position: sticky;
          top: 120px;
        }

        .breadcrumb {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 2rem;
          color: #aaa;
        }

        .breadcrumb a:hover { color: var(--color-green); }

        .product-title {
          font-family: var(--font-products);
          font-size: 3rem;
          color: var(--color-green);
          margin-bottom: 0.5rem;
          line-height: 1;
          text-transform: uppercase;
          font-weight: 300;
          transform: scaleX(0.95);
          transform-origin: left;
        }

        .product-price {
          font-family: var(--font-paragraphs);
          font-size: 1.6rem;
          color: var(--color-beige);
          font-weight: 700;
          margin-bottom: 2rem;
        }

        .product-short-desc {
          font-family: var(--font-paragraphs);
          font-size: 1rem;
          color: #444;
          margin-bottom: 3rem;
          line-height: 1.8;
        }

        .attribute-selector {
          margin-bottom: 2.5rem;
        }

        .attribute-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.2rem;
          font-family: var(--font-paragraphs);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 1px;
          color: var(--color-black);
        }

        /* Color Selector */
        .color-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .color-btn {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.6rem 1rem;
          border: 1px solid #eee;
          background: #fff;
          cursor: pointer;
          transition: var(--transition-smooth);
          border-radius: 4px;
        }

        .color-btn:hover { border-color: var(--color-beige); }
        .color-btn.selected {
          border-color: var(--color-green);
          background-color: rgba(21, 83, 56, 0.05);
        }

        .color-swatch {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.1);
        }

        .color-name {
          font-size: 0.9rem;
          color: #555;
        }

        /* Size Selector */
        .size-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.5rem;
        }

        .size-btn {
          padding: 1rem 0;
          border: 1px solid #eee;
          background: #fff;
          font-family: var(--font-paragraphs);
          font-size: 0.9rem;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .size-btn:hover { border-color: var(--color-green); }
        .size-btn.selected {
          background-color: var(--color-green);
          color: #fff;
          border-color: var(--color-green);
        }

        .size-guide-btn {
          background: none;
          border: none;
          text-decoration: underline;
          color: #999;
          cursor: pointer;
          font-size: 0.75rem;
        }

        /* Actions */
        .actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 4rem;
        }

        .btn-add-cart, .btn-buy-now {
          width: 100%;
          padding: 1.2rem;
          font-size: 1rem;
        }

        .btn-add-cart {
          background-color: var(--color-green);
          color: #fff;
        }

        .btn-buy-now {
          background-color: transparent;
          border: 1px solid var(--color-green);
          color: var(--color-green);
        }

        .btn-buy-now:hover {
          background-color: var(--color-green);
          color: #fff;
        }

        .btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background-color: #ccc;
          border-color: #ccc;
        }

        /* Accordions */
        .product-accordions {
          border-top: 1px solid #eee;
        }

        details {
          border-bottom: 1px solid #eee;
        }

        summary {
          padding: 1.5rem 0;
          font-family: var(--font-paragraphs);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 1px;
          cursor: pointer;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--color-black);
        }

        summary::after {
          content: '+';
          font-size: 1.4rem;
          color: #999;
          font-weight: 300;
        }

        details[open] summary::after {
          content: '−';
        }

        .accordion-content {
          padding-bottom: 2rem;
          font-size: 0.95rem;
          color: #555;
          line-height: 1.8;
        }
        
        .accordion-content ul {
          padding-left: 1.5rem;
          list-style: square;
        }

        @media (max-width: 992px) {
          .product-detail-grid {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
          .product-sidebar { position: static; }
          .product-gallery { gap: 1rem; }
          .product-title { font-size: 2.5rem; }
        }
      `}</style>
    </div>
  );
}

// Función auxiliar para códigos de color
function getColorCode(slug: string): string {
  const colors: Record<string, string> = {
    'negro': '#121212',
    'cafe': '#6F4E37',
    'miel': '#D4A373',
    'azul': '#1B3F8B',
    'verde': '#155338',
    'vino': '#722F37',
    'tabaco': '#8B5A2B',
    'cognac': '#9A463D'
  };
  return colors[slug.toLowerCase()] || '#ddd';
}
