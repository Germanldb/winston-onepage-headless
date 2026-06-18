export const prerender = false;
import type { APIRoute } from 'astro';
import { wcFetch, PUBLIC_WP_URL } from '../../lib/woocommerce';

// Función para mapear a códigos de departamento válidos en WooCommerce (Colombia)
const getValidStateCode = (stateName: string) => {
    if (!stateName) return 'BOG';
    const s = stateName.toLowerCase();
    if (s.includes('antio')) return 'ANT';
    if (s.includes('atlan') || s.includes('atle')) return 'ATL';
    if (s.includes('valle')) return 'VAC';
    if (s.includes('cundin')) return 'CUN';
    if (s.includes('sant')) return 'SAN';
    return 'BOG'; // Fallback seguro
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
    try {
        const body = await request.json();
        const WC_URL = PUBLIC_WP_URL;

        // Capturar cabeceras reales del navegador para evitar bloqueos antifraude de Addi
        const clientUserAgent = request.headers.get('user-agent') || 'Mozilla/5.0';
        const clientLanguage = request.headers.get('accept-language') || 'es-ES,es;q=0.9';
        const clientIp = request.headers.get('x-forwarded-for') || clientAddress || '127.0.0.1';

        const forwardHeaders = {
            'User-Agent': clientUserAgent,
            'Accept-Language': clientLanguage,
            'X-Forwarded-For': clientIp,
            'X-Real-IP': clientIp,
        };

        console.log('[API Store Checkout] Iniciando sesión con IP:', clientIp);

        // 1. Obtener Cart-Token y Nonce inicial
        const cartRes = await fetch(`${WC_URL}/wp-json/wc/store/v1/cart`, { headers: forwardHeaders });
        const cartToken = cartRes.headers.get('Cart-Token') || '';
        const nonce = cartRes.headers.get('Nonce') || '';

        // 2. Agregar cada producto al carrito
        for (const item of body.items) {
            const itemId = item.variation_id ? item.variation_id : item.product_id;
            await fetch(`${WC_URL}/wp-json/wc/store/v1/cart/add-item`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cart-Token': cartToken,
                    'Nonce': nonce,
                    ...forwardHeaders
                },
                body: JSON.stringify({
                    id: itemId,
                    quantity: item.quantity,
                })
            });
        }

        // 3. Preparar el payload del Checkout (Store API)
        const paymentMethodId = body.payment_method === 'addi' ? 'addi' : 'woo-mercado-pago-basic';
        
        const validState = getValidStateCode(body.state);
        const validShippingState = body.ship_to_different_address ? getValidStateCode(body.shipping_state) : validState;
        
        const validPostcode = body.postcode || '110010';
        const validShippingPostcode = body.ship_to_different_address ? (body.shipping_postcode || '110010') : validPostcode;

        const checkoutPayload = {
            billing_address: {
                first_name: body.first_name || 'Cliente',
                last_name: body.last_name || 'Winston',
                address_1: body.address_1 || 'No proporcionada',
                address_2: body.address_2 || '',
                city: body.city || 'Bogotá',
                state: validState,
                postcode: validPostcode,
                country: 'CO',
                email: body.email,
                phone: body.phone || '0000000000',
                'addi/cedula-id': body.document_id || '000000000',
            },
            shipping_address: {
                first_name: body.ship_to_different_address ? (body.shipping_first_name || 'Cliente') : (body.first_name || 'Cliente'),
                last_name: body.ship_to_different_address ? (body.shipping_last_name || 'Winston') : (body.last_name || 'Winston'),
                address_1: body.ship_to_different_address ? (body.shipping_address_1 || 'No proporcionada') : (body.address_1 || 'No proporcionada'),
                address_2: body.ship_to_different_address ? (body.shipping_address_2 || '') : (body.address_2 || ''),
                city: body.ship_to_different_address ? (body.shipping_city || 'Bogotá') : (body.city || 'Bogotá'),
                state: validShippingState,
                postcode: validShippingPostcode,
                country: 'CO',
                phone: body.phone || '0000000000',
                'addi/cedula-id': body.document_id || '000000000',
            },
            customer_note: body.order_notes || '',
            payment_method: paymentMethodId,
        };

        console.log('[API Store Checkout] Procesando pago con:', paymentMethodId);

        // 4. Ejecutar el Checkout en Store API
        const checkoutRes = await fetch(`${WC_URL}/wp-json/wc/store/v1/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cart-Token': cartToken,
                'Nonce': nonce,
                ...forwardHeaders
            },
            body: JSON.stringify(checkoutPayload)
        });

        const checkoutData = await checkoutRes.json();
        console.log('[API Store Checkout] Respuesta Store API:', checkoutData.order_id ? `Orden ${checkoutData.order_id} OK` : 'ERROR', checkoutData);

        if (!checkoutRes.ok || !checkoutData.order_id) {
            return new Response(
                JSON.stringify({ 
                    error: 'Error en la pasarela de pago', 
                    details: checkoutData.message || 'El checkout de WooCommerce falló.' 
                }),
                { status: 400 }
            );
        }

        // 5. (Híbrido) Inyectar los Meta Datos de Cédula mediante la API v3 clásica
        if (body.document_id) {
            await wcFetch(`/orders/${checkoutData.order_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    meta_data: [
                        { key: '_billing_cedula', value: body.document_id },
                        { key: 'billing_cedula', value: body.document_id },
                        { key: '_billing_dni', value: body.document_id }
                    ]
                })
            });
        }

        // 6. Obtener la URL de redirección directa
        let finalPaymentUrl = '';
        if (checkoutData.payment_result && checkoutData.payment_result.redirect_url) {
            finalPaymentUrl = checkoutData.payment_result.redirect_url;
        } else {
            // Fallback nativo
            finalPaymentUrl = `${WC_URL}/checkout/order-pay/${checkoutData.order_id}/?pay_for_order=true`;
        }

        return new Response(
            JSON.stringify({
                order_id: checkoutData.order_id,
                order_number: checkoutData.order_id,
                payment_url: finalPaymentUrl,
                status: 'pending',
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error: any) {
        console.error('[API Store Checkout] Error crítico:', error.message);
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor', details: error.message }),
            { status: 500 }
        );
    }
};
