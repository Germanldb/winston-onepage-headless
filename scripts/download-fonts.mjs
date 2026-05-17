import fs from 'fs';
import path from 'path';

async function downloadFile(url, destPath) {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    try {
        const res = await fetch(url, { headers });
        if (!res.ok) {
            console.warn(`[Warning] Could not fetch ${url}: ${res.statusText}`);
            return false;
        }
        const buffer = await res.arrayBuffer();
        fs.writeFileSync(destPath, Buffer.from(buffer));
        console.log(`Downloaded: ${url} -> ${destPath}`);
        return true;
    } catch (e) {
        console.warn(`[Warning] Error downloading ${url}: ${e.message}`);
        return false;
    }
}

async function setupAntonio() {
    console.log("Setting up local Google Font Antonio...");
    const cssUrl = 'https://fonts.googleapis.com/css2?family=Antonio:wght@300;400;700&display=swap';
    
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    const res = await fetch(cssUrl, { headers });
    let cssText = await res.text();

    const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^\)]+)\)/g;
    let match;
    const urlsToDownload = [];
    
    while ((match = urlRegex.exec(cssText)) !== null) {
        urlsToDownload.push(match[1]);
    }

    const uniqueUrls = [...new Set(urlsToDownload)];
    console.log(`Found ${uniqueUrls.length} Antonio woff2 font files to download.`);

    for (let i = 0; i < uniqueUrls.length; i++) {
        const fontUrl = uniqueUrls[i];
        const fileName = `antonio-${i}.woff2`;
        const fontDest = path.join('public', 'fonts', 'antonio', fileName);
        const success = await downloadFile(fontUrl, fontDest);
        if (success) {
            cssText = cssText.replaceAll(fontUrl, `/fonts/antonio/${fileName}`);
        }
    }

    cssText = cssText.replace(/font-display:\s*[^;]+;/g, 'font-display: swap;');
    if (!cssText.includes('font-display')) {
        cssText = cssText.replace(/font-family:[^;]+;/g, (match) => `${match}\n  font-display: swap;`);
    }

    fs.writeFileSync(path.join('public', 'fonts', 'antonio', 'antonio.css'), cssText);
    console.log("Antonio local setup complete!");
}

async function setupFontAwesome() {
    console.log("Setting up local FontAwesome...");
    const cssUrl = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    const res = await fetch(cssUrl);
    let cssText = await res.text();

    const fontFiles = [
        'fa-solid-900.woff2',
        'fa-brands-400.woff2',
        'fa-regular-400.woff2',
        'fa-v4shims.woff2'
    ];

    const baseUrl = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/';

    for (const fontName of fontFiles) {
        const url = `${baseUrl}${fontName}`;
        const dest = path.join('public', 'webfonts', fontName);
        await downloadFile(url, dest);
    }

    cssText = cssText.replace(/@font-face\s*\{/g, '@font-face {\n  font-display: swap;');

    const cssDest = path.join('public', 'fonts', 'font-awesome', 'all.css');
    const cssDir = path.dirname(cssDest);
    if (!fs.existsSync(cssDir)) fs.mkdirSync(cssDir, { recursive: true });
    
    fs.writeFileSync(cssDest, cssText);
    console.log("FontAwesome local setup complete!");
}

async function setupTypekit() {
    console.log("Setting up local Adobe Typekit...");
    const cssUrl = 'https://use.typekit.net/lpl0lgn.css';
    const res = await fetch(cssUrl);
    let cssText = await res.text();

    // Match all Typekit woff2 URLs
    const woff2Regex = /url\("([^"]+)"\) format\("woff2"\)/g;
    let match;
    const urlsToDownload = [];
    
    while ((match = woff2Regex.exec(cssText)) !== null) {
        urlsToDownload.push(match[1]);
    }

    const uniqueUrls = [...new Set(urlsToDownload)];
    console.log(`Found ${uniqueUrls.length} Typekit woff2 font files to download.`);

    for (let i = 0; i < uniqueUrls.length; i++) {
        const fontUrl = uniqueUrls[i];
        const fileName = `typekit-${i}.woff2`;
        const fontDest = path.join('public', 'fonts', 'typekit', fileName);
        const success = await downloadFile(fontUrl, fontDest);
        if (success) {
            cssText = cssText.replaceAll(fontUrl, `/fonts/typekit/${fileName}`);
        }
    }

    // Replace @import of the base Typekit CSS to avoid dynamic loads
    cssText = cssText.replace(/@import url\("https:\/\/p\.typekit\.net\/p\.css[^"]+"\);/g, '');

    // Add font-display: swap to all declarations
    cssText = cssText.replace(/@font-face\s*\{/g, '@font-face {\n  font-display: swap;');

    const cssDest = path.join('public', 'fonts', 'typekit', 'typekit.css');
    const cssDir = path.dirname(cssDest);
    if (!fs.existsSync(cssDir)) fs.mkdirSync(cssDir, { recursive: true });

    fs.writeFileSync(cssDest, cssText);
    console.log("Typekit local setup complete!");
}

async function main() {
    await setupAntonio();
    await setupFontAwesome();
    await setupTypekit();
    console.log("All fonts (Antonio, FontAwesome, Typekit) downloaded and self-hosted successfully!");
}

main().catch(err => {
    console.error("Font setup script failed:", err);
    process.exit(1);
});
