import { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  permalink: string;
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
  }[];
  slug: string;
}

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (pageNumber: number) => {
    try {
      setLoading(true);
      // El proxy ya nos devuelve 15 zapatos filtrados
      const response = await fetch(`/api/products?page=${pageNumber}`);

      if (!response.ok) throw new Error('Error al cargar zapatos');

      const data = await response.json();

      if (data.length < 15) {
        setHasMore(false);
      }

      if (pageNumber === 1) {
        setProducts(data);
      } else {
        setProducts(prev => [...prev, ...data]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage);
  };

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => fetchProducts(1)} className="btn">Reintentar</button>
      </div>
    );
  }

  return (
    <section id="tienda" className="tienda">
      <div className="container">
        <div className="section-title">
          <h2>Colección de Calzado</h2>
          <div className="divider"></div>
        </div>

        <div className="grid-5x3">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <a href={`/productos/${product.slug}`}>
                <div className="product-image">
                  <img
                    src={product.images[0]?.src || 'https://via.placeholder.com/300x400?text=Zapato'}
                    alt={product.images[0]?.alt || product.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="overlay">
                    <span>Ver Detalles</span>
                  </div>
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="price">
                    {product.prices.currency_prefix || product.prices.currency_symbol}
                    {new Intl.NumberFormat('es-CO').format(parseInt(product.prices.price) / (10 ** (product.prices.currency_minor_unit || 0)))}
                  </p>
                </div>
              </a>
            </div>
          ))}
        </div>

        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        )}

        {hasMore && !loading && (
          <div className="load-more-container">
            <button onClick={loadMore} className="btn btn-outline">
              Ver más zapatos
            </button>
          </div>
        )}
      </div>

      <style>{`
        .tienda { background-color: #fff; padding: 6rem 0; }
        .section-title { text-align: center; margin-bottom: 4rem; }
        .section-title h2 { font-size: 3rem; margin-bottom: 1rem; color: var(--color-green); }
        .divider { width: 60px; height: 3px; background-color: var(--color-beige); margin: 0 auto; }

        .grid-5x3 {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 1200px) { .grid-5x3 { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 768px) { .grid-5x3 { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .grid-5x3 { grid-template-columns: 1fr; } }

        .product-card { background: #fff; transition: var(--transition-smooth); border: 1px solid #eee; }
        .product-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }

        .product-image { position: relative; aspect-ratio: 1/1; overflow: hidden; background-color: #f9f9f9; }
        .product-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
        .product-card:hover .product-image img { transform: scale(1.05); }

        .overlay {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(21, 83, 56, 0.85); display: flex; align-items: center;
          justify-content: center; opacity: 0; transition: var(--transition-smooth);
        }
        .product-card:hover .overlay { opacity: 1; }
        .overlay span { color: #fff; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #fff; padding: 0.5rem 1rem; }

        .product-info { padding: 1.5rem 1rem; text-align: center; }
        .product-info h3 { 
          font-family: var(--font-products); 
          font-size: 1.4rem; 
          font-weight: 300; 
          margin-bottom: 0.7rem; 
          color: var(--color-green); 
          min-height: 2.2rem; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          text-transform: uppercase; 
          letter-spacing: 0px;
          transform: scaleX(0.9);
          transform-origin: center;
        }
        .price { color: var(--color-beige); font-weight: 700; font-size: 1rem; }

        .load-more-container { margin-top: 4rem; display: flex; justify-content: center; }
        .error-container { text-align: center; padding: 4rem 0; }
        .loading-spinner { display: flex; justify-content: center; margin-top: 3rem; }
        .spinner { width: 40px; height: 40px; border: 4px solid rgba(21, 83, 56, 0.1); border-left-color: var(--color-green); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}
