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

    const product = initialProduct;

    // Encontrar atributo de talla (usualmente tiene 'talla' o es un número)
    const sizeAttribute = product.attributes?.find(attr =>
        attr.name.toLowerCase().includes('talla') ||
        attr.terms.some(t => !isNaN(Number(t.name)))
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

                        <div className="product-description" dangerouslySetInnerHTML={{ __html: product.short_description || product.description }} />

                        {sizeAttribute && (
                            <div className="size-selector">
                                <div className="size-header">
                                    <span>Talla</span>
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
                            <button className="btn btn-add-cart">Añadir al carrito</button>
                            <button className="btn btn-buy-now">Comprar ahora</button>
                        </div>

                        <div className="product-accordions">
                            <details open>
                                <summary>Descripción y Detalles</summary>
                                <div className="accordion-content" dangerouslySetInnerHTML={{ __html: product.description }} />
                            </details>
                            <details>
                                <summary>Cuidado del Producto</summary>
                                <div className="accordion-content">
                                    <ul>
                                        <li>Limpiar con un paño suave.</li>
                                        <li>Usar productos específicos para el cuidado del cuero.</li>
                                        <li>No secar directamente al sol o fuentes de calor.</li>
                                    </ul>
                                </div>
                            </details>
                            <details>
                                <summary>Envío y Devoluciones</summary>
                                <div className="accordion-content">
                                    <p>Envío gratuito a toda Colombia. Cambios y devoluciones sin costo adicional dentro de los primeros 30 días.</p>
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
          grid-template-columns: 1.2fr 0.8fr;
          gap: 4rem;
          align-items: start;
        }

        /* Galería Estilo Lignarolo (Imágenes una tras otra) */
        .product-gallery {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .gallery-item img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
        }

        /* Sidebar Sticky */
        .product-sidebar {
          position: sticky;
          top: 120px;
        }

        .breadcrumb {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 2rem;
          color: #999;
        }

        .breadcrumb a:hover { color: var(--color-beige); }

        .product-title {
          font-family: var(--font-products);
          font-size: 2.5rem;
          color: var(--color-green);
          margin-bottom: 1rem;
          line-height: 1;
        }

        .product-price {
          font-family: var(--font-paragraphs);
          font-size: 1.5rem;
          color: var(--color-beige);
          font-weight: 700;
          margin-bottom: 2rem;
        }

        .product-description {
          font-family: var(--font-paragraphs);
          font-size: 0.95rem;
          color: #666;
          margin-bottom: 2.5rem;
          line-height: 1.7;
        }

        /* Selector de Tallas */
        .size-selector {
          margin-bottom: 2.5rem;
        }

        .size-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          font-family: var(--font-paragraphs);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 1px;
        }

        .size-guide-btn {
          background: none;
          border: none;
          text-decoration: underline;
          color: #999;
          cursor: pointer;
          font-size: 0.75rem;
        }

        .size-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.5rem;
        }

        .size-btn {
          padding: 0.8rem;
          border: 1px solid #ddd;
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

        /* Acciones */
        .actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .btn-add-cart {
          width: 100%;
          background-color: var(--color-green);
          color: #fff;
        }

        .btn-buy-now {
          width: 100%;
          background-color: transparent;
          border: 1px solid var(--color-green);
          color: var(--color-green);
        }

        .btn-buy-now:hover {
          background-color: var(--color-green);
          color: #fff;
        }

        /* Acordeones */
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
          font-size: 0.8rem;
          letter-spacing: 1px;
          cursor: pointer;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        summary::after {
          content: '+';
          font-size: 1.2rem;
          color: #999;
        }

        details[open] summary::after {
          content: '-';
        }

        .accordion-content {
          padding-bottom: 1.5rem;
          font-size: 0.9rem;
          color: #666;
          line-height: 1.6;
        }
        
        .accordion-content ul {
          padding-left: 1.2rem;
          list-style: disc;
        }

        @media (max-width: 992px) {
          .product-detail-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .product-sidebar {
            position: static;
          }
          .product-detail {
            padding-top: 1rem;
          }
        }
      `}</style>
        </div>
    );
}
