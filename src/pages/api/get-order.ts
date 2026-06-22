// src/pages/api/get-order.ts
import type { APIRoute } from 'astro';

const WC_URL = import.meta.env.WC_URL || 'https://tienda.winstonandharrystore.com';
const WC_KEY = import.meta.env.WC_CONSUMER_KEY;
const WC_SECRET = import.meta.env.WC_CONSUMER_SECRET;

export const GET: APIRoute = async ({ url }) => {
    const orderId = url.searchParams.get('id');

    if (!orderId || isNaN(Number(orderId))) {
        return new Response(JSON.stringify({ error: 'Invalid order ID' }), { status: 400 });
    }

    try {
        const credentials = btoa(`${WC_KEY}:${WC_SECRET}`);
        const res = await fetch(`${WC_URL}/wp-json/wc/v3/orders/${orderId}`, {
            headers: { Authorization: `Basic ${credentials}` }
        });

        if (!res.ok) {
            return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
        }

        const wcOrder = await res.json();

        // Devolver solo los campos que necesita el tracking
        return new Response(JSON.stringify({
            id: wcOrder.id,
            number: wcOrder.number,
            total: wcOrder.total,
            email: wcOrder.billing?.email,
            items: wcOrder.line_items?.map((item: any) => ({
                id: item.product_id,
                name: item.name,
                price: parseFloat(item.price),
                quantity: item.quantity
            })) || []
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
};
