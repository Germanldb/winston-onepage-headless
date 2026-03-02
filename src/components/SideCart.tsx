import { useStore } from '@nanostores/react';
import {
  isCartOpen,
  cartItems,
  cartSubtotal,
  removeCartItem,
  updateCartItemQuantity
} from '../store/cartStore';
import styles from './SideCart.module.css';

// Reemplaza esto con la URL real de tu WordPress
const WORDPRESS_URL = 'https://tienda.winston.com';

export default function SideCart() {
  const isOpen = useStore(isCartOpen);
  const items = useStore(cartItems);
  const subtotal = useStore(cartSubtotal);

  // Magic Checkout Button
  const handleCheckout = () => {
    if (items.length === 0) return;

    // WooCommerce native "add-to-cart" query string usually accepts a single item.
    // However, if we need multiple items, a common approach is:
    // ?add-to-cart=ID1,ID2&quantity=1,2 (if supported by a specific plugin)
    // Or we redirect to a custom endpoint on the WP side that parses an array and builds the cart.
    // For now, we will create a comma-separated list of IDs and Quantities.

    // Si tienes un script/plugin en WP que acepte un string en base64 de JSON con el carrito:
    const cartData = items.map(i => ({ product_id: i.id, quantity: i.quantity }));
    // Ejemplo de endpoint personalizado que podríamos crear luego en el Paso 4:
    // const checkoutUrl = `${WORDPRESS_URL}/wp-json/winston/v1/magic-checkout?data=${btoa(JSON.stringify(cartData))}`;

    // Ejemplo estándar (solo agrega el primer producto si no hay plugin para múltiples):
    const checkoutUrl = `${WORDPRESS_URL}/checkout/?add-to-cart=${items[0].id}&quantity=${items[0].quantity}`;

    // Puedes ajustar la lógica final del enlace aquí en el Paso 4
    window.location.href = checkoutUrl;
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
        onClick={() => isCartOpen.set(false)}
      />
      <div className={`${styles.cartPanel} ${isOpen ? styles.cartPanelOpen : ''}`}>
        <div className={styles.cartHeader}>
          <h2>Tu Bolsa</h2>
          <button className={styles.closeBtn} onClick={() => isCartOpen.set(false)}>✕</button>
        </div>

        <div className={styles.cartItems}>
          {items.length === 0 ? (
            <div className={styles.emptyCart}>
              <p>Tu carrito está vacío.</p>
              <button className="btn" onClick={() => isCartOpen.set(false)}>Continuar Comprando</button>
            </div>
          ) : (
            items.map((item) => {
              const uniqueKey = `${item.id}-${item.color || 'none'}-${item.size || 'none'}`;
              return (
                <div key={uniqueKey} className={styles.cartItem}>
                  <img src={item.image} alt={item.name} className={styles.itemImage} />
                  <div className={styles.itemDetails}>
                    <p className={styles.itemName}>{item.name}</p>
                    {item.color && <p className={styles.itemVariant}>Color: {item.color}</p>}
                    {item.size && <p className={styles.itemVariant}>Talla: {item.size}</p>}
                    <p className={styles.itemPrice}>${item.price.toFixed(2)}</p>
                    <div className={styles.quantityControl}>
                      <button onClick={() => updateCartItemQuantity(item.id, item.color, item.size, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateCartItemQuantity(item.id, item.color, item.size, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeCartItem(item.id, item.color, item.size)}>🗑️</button>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.cartFooter}>
            <div className={styles.subtotal}>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <p className={styles.shippingNotice}>Impuestos y envío calculados en el pago.</p>
            <button className={`btn ${styles.checkoutBtn}`} onClick={handleCheckout}>
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </>
  );
}
