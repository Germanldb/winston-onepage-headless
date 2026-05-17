import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const deployHookUrl = (import.meta.env.VERCEL_DEPLOY_HOOK_URL || '').trim();
        
        if (!deployHookUrl) {
            console.error("[Rebuild API] VERCEL_DEPLOY_HOOK_URL environment variable is not defined in Vercel settings!");
            return new Response(JSON.stringify({ 
                success: false, 
                error: "Vercel Deploy Hook is not configured on the server. Please add VERCEL_DEPLOY_HOOK_URL in project environment variables." 
            }), { 
                status: 500, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        console.log(`[Rebuild API] Pinging Vercel Deploy Hook...`);
        
        // Trigger Vercel Build (Vercel Deploy Hook accepts empty POST requests)
        const vercelRes = await fetch(deployHookUrl, {
            method: 'POST'
        });

        if (!vercelRes.ok) {
            const errorText = await vercelRes.text();
            console.error(`[Rebuild API] Vercel Deploy Hook failed: ${vercelRes.statusText} - ${errorText}`);
            return new Response(JSON.stringify({
                success: false,
                error: `Vercel build trigger failed: ${vercelRes.statusText}`,
                details: errorText
            }), {
                status: 502,
                headers: { "Content-Type": "application/json" }
            });
        }

        const vercelData = await vercelRes.json();
        console.log("[Rebuild API] Vercel build successfully triggered!", vercelData);

        return new Response(JSON.stringify({
            success: true,
            message: "Winston & Harry — Rebuild triggered successfully! Vercel is now building the site statically.",
            job: vercelData.job || null,
            timestamp: new Date().toISOString()
        }), { 
            status: 200, 
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            } 
        });

    } catch (e: any) {
        console.error('[Rebuild API Error]', e.message);
        return new Response(JSON.stringify({ 
            success: false, 
            error: e.message 
        }), { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
        });
    }
};

// Also support GET for status check
export const GET: APIRoute = async () => {
    const hasHook = !!import.meta.env.VERCEL_DEPLOY_HOOK_URL;
    return new Response(JSON.stringify({
        status: "OK",
        message: "Winston & Harry Rebuild Endpoint is ready.",
        is_configured: hasHook,
        action_required: hasHook ? "Send a POST request to trigger the build" : "Configure VERCEL_DEPLOY_HOOK_URL environment variable in Vercel"
    }), { status: 200, headers: { "Content-Type": "application/json" } });
};
