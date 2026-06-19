export const prerender = false;
import type { APIRoute } from 'astro';
import { wcFetch, PUBLIC_WP_URL } from '../../lib/woocommerce';

// Función para mapear a códigos de departamento válidos en WooCommerce (Colombia)
const getValidStateCode = (stateName: string): string => {
  if (!stateName) return "BOG";
  const s = stateName.toLowerCase();
  if (s.includes("amazona")) return "AMA";
  if (s.includes("antioqui") || s.includes("antioq")) return "ANT";
  if (s.includes("arauca")) return "ARA";
  if (s.includes("atlán") || s.includes("atlan")) return "ATL";
  if (s.includes("bolívar") || s.includes("bolivar")) return "BOL";
  if (s.includes("boyac")) return "BOY";
  if (s.includes("caldas")) return "CAL";
  if (s.includes("caquetá") || s.includes("caqueta")) return "CAQ";
  if (s.includes("casanare")) return "CAS";
  if (s.includes("cauca")) return "CAU";
  if (s.includes("cesar")) return "CES";
  if (s.includes("chocó") || s.includes("choco")) return "CHO";
  if (s.includes("córdoba") || s.includes("cordoba")) return "COR";
  if (s.includes("cundinam")) return "CUN";
  if (s.includes("guainía") || s.includes("guainia")) return "GUA";
  if (s.includes("guaviare")) return "GUV";
  if (s.includes("huila")) return "HUI";
  if (s.includes("la guajira") || s.includes("guajira")) return "LAG";
  if (s.includes("magdalena")) return "MAG";
  if (s.includes("meta")) return "MET";
  if (s.includes("nariño") || s.includes("narino")) return "NAR";
  if (s.includes("norte de santander") || s.includes("n. santander")) return "NSA";
  if (s.includes("putumayo")) return "PUT";
  if (s.includes("quindío") || s.includes("quindio")) return "QUI";
  if (s.includes("risaralda")) return "RIS";
  if (s.includes("san andrés") || s.includes("san andres")) return "SAP";
  if (s.includes("santander")) return "SAN"; // debe ir DESPUÉS de norte de santander
  if (s.includes("sucre")) return "SUC";
  if (s.includes("tolima")) return "TOL";
  if (s.includes("valle")) return "VAC";
  if (s.includes("vaupés") || s.includes("vaupes")) return "VAU";
  if (s.includes("vichada")) return "VID";
  if (s.includes("bog") || s.includes("d.c") || s.includes("capital")) return "BOG";
  return "BOG"; // fallback seguro
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

        // 2. Limpiar el carrito antes de agregar ítems (evita contaminación entre sesiones)
        await fetch(`${WC_URL}/wp-json/wc/store/v1/cart/items`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Cart-Token': cartToken,
                'Nonce': nonce,
                ...forwardHeaders
            }
        });

        // 3. Agregar cada producto al carrito
        for (const item of body.items) {
            const itemId = item.variation_id ? item.variation_id : item.product_id;
            const addRes = await fetch(`${WC_URL}/wp-json/wc/store/v1/cart/add-item`, {
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
            if (!addRes.ok) {
                const addErr = await addRes.json().catch(() => ({}));
                console.error('[API Store Checkout] Error al agregar ítem al carrito:', addErr);
                return new Response(
                    JSON.stringify({ error: addErr.message || 'Error al agregar producto al carrito' }),
                    { status: 400 }
                );
            }
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
                "addi/cedula-id": body.document_id
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
                "addi/cedula-id": body.document_id
            },
            customer_note: body.order_notes || '',
            payment_method: paymentMethodId,
            meta_data: [
                { key: 'billing_cedula', value: body.document_id },
                { key: 'addi_cedula', value: body.document_id },
                { key: '_billing_cedula', value: body.document_id },
                { key: 'billing_document_type', value: body.document_type },
                { key: 'addi_document_type', value: body.document_type },
                { key: 'billing_city_dane', value: body.city },
                { key: '_billing_city_dane', value: body.city },
            ]
        };

        console.log('[API Store Checkout] Procesando pago con:', paymentMethodId);
        console.log('[DEBUG CITY]', JSON.stringify({
          city: body.city,
          meta_data: checkoutPayload.meta_data
        }));

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
