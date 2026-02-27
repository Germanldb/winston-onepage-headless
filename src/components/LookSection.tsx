import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

interface Product {
    id: number;
    name: string;
    slug: string;
    permalink: string;
    prices: {
        price: string;
        regular_price: string;
        sale_price: string;
        currency_code: string;
        currency_symbol: string;
        currency_minor_unit: number;
        currency_prefix: string;
    };
    images: {
        src: string;
        alt: string;
    }[];
    attributes: any[];
    variations?: any[];
    variation_images_map?: any;
}

interface LookData {
    look_titulo: string;
    look_descripcion: string;
    look_imagen: string;
    products: Product[];
}

export default function LookSection() {
    const [data, setData] = useState<LookData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    useEffect(() => {
        const fetchLook = async () => {
            try {
                const res = await fetch('/api/look-of-the-week');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                    if (json.products) {
                        setSelectedIds(json.products.map((p: Product) => p.id));
                    }
                }
            } catch (e) {
                console.error("Error fetching look:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchLook();
    }, []);

    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    if (loading || !data) return <div className="look-loading">Cargando look...</div>;

    const total = data.products
        .filter(p => selectedIds.includes(p.id))
        .reduce((sum, p) => {
            const price = parseInt(p.prices.price) / (10 ** (p.prices.currency_minor_unit || 0));
            return sum + price;
        }, 0);

    const currencySymbol = data.products[0]?.prices.currency_prefix || '$';

    return (
        <section className="look-of-the-week">
            <div className="look-wrapper">
                <div className="look-grid">
                    {/* Lado Izquierdo: Imagen Lifestyle */}
                    <div className="look-image-container">
                        {data.look_imagen ? (
                            <img
                                src={data.look_imagen}
                                alt={data.look_titulo}
                                className="lifestyle-image"
                            />
                        ) : (
                            <div className="lifestyle-placeholder">
                                <span>No lifestyle image found</span>
                            </div>
                        )}
                    </div>

                    {/* Lado Derecho: Contenido */}
                    <div className="look-content-container">
                        <div className="look-header">
                            <h2 className="look-title">{data.look_titulo || 'LOOK DE LA SEMANA'}</h2>
                            <div
                                className="look-intro"
                                dangerouslySetInnerHTML={{ __html: data.look_descripcion || 'Descubre nuestra selección semanal.' }}
                            />
                        </div>

                        <div className="products-selection-wrapper">
                            <div className="products-row">
                                {data.products.map((product, index) => (
                                    <div key={product.id} className="look-product-item-wrapper">
                                        {index > 0 && <div className="product-plus">+</div>}
                                        <div className="look-product-card-container">
                                            <ProductCard
                                                product={product}
                                                isSelected={selectedIds.includes(product.id)}
                                                onSelectionToggle={toggleSelection}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {selectedIds.length > 0 && (
                                <div className="total-summary-card">
                                    <p className="summary-label">TOTAL POR LO SELECCIONADOS:</p>
                                    <p className="total-amount">
                                        {currencySymbol} {new Intl.NumberFormat('es-CO').format(total)}
                                    </p>
                                    <button
                                        className="add-all-btn"
                                        onClick={() => alert(`Añadiendo ${selectedIds.length} productos al carrito`)}
                                    >
                                        AÑADIR SELECCIONADOS AL CARRITO
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .look-of-the-week {
                    background-color: #fcfcfc;
                    padding: 6rem 1rem;
                }
                .look-wrapper {
                    max-width: 1400px;
                    margin: 0 auto;
                    background: #fff;
                    box-shadow: 0 5px 30px rgba(0,0,0,0.05);
                    overflow: hidden;
                }
                .look-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    min-height: 800px;
                }
                .look-image-container {
                    position: relative;
                    background-color: #eee;
                }
                .lifestyle-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }
                .lifestyle-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #999;
                    font-size: 0.8rem;
                }
                .look-content-container {
                    padding: 5rem 3rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                }
                .look-header {
                    max-width: 500px;
                    margin-bottom: 4rem;
                }
                .look-title {
                    color: #155338;
                    font-family: var(--font-titles);
                    font-size: 1.8rem;
                    letter-spacing: 6px;
                    text-transform: uppercase;
                    margin-bottom: 1.5rem;
                }
                .look-intro {
                    font-size: 0.9rem;
                    color: #444;
                    line-height: 1.8;
                }
                .products-selection-wrapper {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .products-row {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    margin-bottom: 4rem;
                    width: 100%;
                }
                .look-product-item-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .product-plus {
                    font-size: 1.2rem;
                    color: #155338;
                    font-weight: 300;
                    margin-bottom: 40px;
                    opacity: 0.6;
                }
                .look-product-card-container {
                    width: 220px;
                }
                /* Sobrescribir estilos de ProductCard para que se vea limpio aquí */
                .look-product-card-container .product-card {
                    border: none;
                }
                .total-summary-card {
                    background: #fff;
                    border: 1px solid #f2f2f2;
                    padding: 2.5rem 4rem;
                    text-align: center;
                    width: fit-content;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
                }
                .summary-label {
                    font-size: 0.75rem;
                    letter-spacing: 2px;
                    color: #888;
                    margin-bottom: 0.8rem;
                    text-transform: uppercase;
                }
                .total-amount {
                    font-size: 1.8rem;
                    color: #A98B68;
                    font-weight: 600;
                    margin-bottom: 2rem;
                    font-family: var(--font-titles);
                }
                .add-all-btn {
                    background: #155338;
                    color: #fff;
                    border: none;
                    padding: 1.2rem 2.5rem;
                    font-size: 0.8rem;
                    font-weight: 600;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    width: 100%;
                }
                .add-all-btn:hover { 
                    background: #0d3b28;
                    transform: translateY(-2px);
                }

                @media (max-width: 1024px) {
                    .look-grid { grid-template-columns: 1fr; }
                    .look-product-card-container { width: 180px; }
                    .products-row { flex-wrap: wrap; }
                }
            `}</style>
        </section>
    );
}
