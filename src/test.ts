import { getProductBySlug } from './lib/woocommerce'; getProductBySlug('sueter-braid').then(res => console.log(Object.keys(res.wpc_resolved_media || {}))).catch(console.error);
