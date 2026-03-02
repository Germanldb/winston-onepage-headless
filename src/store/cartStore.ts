import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

export type CartItem = {
    id: number;          // Product or Variation ID (from WooCommerce)
    name: string;        // Product Name
    price: number;       // Product Price
    image: string;       // Image URL
    quantity: number;    // Quantity added
    color?: string;      // Selected Color (if applicable)
    size?: string;       // Selected Size (if applicable)
    slug: string;        // For linking back to the product page
};

// UI State: Controls whether the Side Cart is currently open or closed
export const isCartOpen = atom<boolean>(false);

// Cart State: Persistent items array synced with localStorage
// We use JSON to serialize and deserialize the cart array
export const cartItems = persistentAtom<CartItem[]>('winston:cart', [], {
    encode: JSON.stringify,
    decode: JSON.parse,
});

// Computed State: Calculate total number of items
export const cartItemCount = computed(cartItems, (items) => {
    return items.reduce((total, item) => total + item.quantity, 0);
});

// Computed State: Calculate subtotal price
export const cartSubtotal = computed(cartItems, (items) => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
});

// Action: Add an item or update its quantity if it already exists
export function addCartItem(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
    const currentItems = cartItems.get();
    const quantityToAdd = item.quantity || 1;
    const existingIndex = currentItems.findIndex(
        (i) => i.id === item.id && i.color === item.color && i.size === item.size
    );

    if (existingIndex > -1) {
        // Clone array and update quantity of existing item
        const newItems = [...currentItems];
        newItems[existingIndex].quantity += quantityToAdd;
        cartItems.set(newItems);
    } else {
        // Add totally new item
        cartItems.set([...currentItems, { ...item, quantity: quantityToAdd }]);
    }

    // Auto-open side cart when the user adds something
    isCartOpen.set(true);
}

// Action: Remove an item entirely by finding its unique combination
export function removeCartItem(id: number, color?: string, size?: string) {
    const currentItems = cartItems.get();
    const newItems = currentItems.filter(
        (i) => !(i.id === id && i.color === color && i.size === size)
    );
    cartItems.set(newItems);
}

// Action: Update the specific quantity of an item
export function updateCartItemQuantity(id: number, color: string | undefined, size: string | undefined, quantity: number) {
    if (quantity < 1) {
        removeCartItem(id, color, size);
        return;
    }
    const currentItems = cartItems.get();
    const index = currentItems.findIndex(
        (i) => i.id === id && i.color === color && i.size === size
    );

    if (index > -1) {
        const newItems = [...currentItems];
        newItems[index].quantity = quantity;
        cartItems.set(newItems);
    }
}

// Action: Clear entire cart (e.g. after successful checkout)
export function clearCart() {
    cartItems.set([]);
}
