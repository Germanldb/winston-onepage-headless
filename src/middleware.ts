import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
    const url = new URL(context.request.url);
    let path = url.pathname;

    // 0. Normalizar trailing slash (debe ir primero)
    if (path !== '/' && path.endsWith('/')) {
        const newPath = path.slice(0, -1) + url.search;
        return context.redirect(newPath, 301);
    }

    const lowerPath = path.toLowerCase();

    // 1. Redirecciones de Productos Legacy
    if (lowerPath.startsWith('/product/') && !lowerPath.startsWith('/productos/')) {
        const newPath = path.replace(/^\/product\//i, '/productos/');
        return context.redirect(newPath, 301);
    }
    if (lowerPath.startsWith('/producto/')) {
        const newPath = path.replace(/^\/producto\//i, '/productos/');
        return context.redirect(newPath, 301);
    }

    // 2. Redirecciones de Categorías y Tags Legacy
    if (lowerPath.startsWith('/product-category/')) {
        const newPath = path.replace(/^\/product-category\//i, '/categoria/');
        return context.redirect(newPath, 301);
    }
    if (lowerPath.startsWith('/product-tag/')) {
        const newPath = path.replace(/^\/product-tag\//i, '/categoria/');
        return context.redirect(newPath, 301);
    }

    return next();
});
