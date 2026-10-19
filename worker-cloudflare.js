export default {
  async fetch(request, env) {
    // 1. Orígenes autorizados (CORS estricto)
    const allowedOrigins = [
      'https://myaulastudio.vercel.app',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://localhost:8000',
      'http://127.0.0.1:8000'
    ];

    const origin = request.headers.get('Origin');
    const isAllowedOrigin = allowedOrigins.includes(origin);
    const corsOrigin = isAllowedOrigin ? origin : allowedOrigins[0];

    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-license-key',
      'Access-Control-Expose-Headers': 'x-usage-count, x-usage-left',
    };

    // Preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método no permitido' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // 2. Validación de Licencia
      const licenseKey = request.headers.get('x-license-key')?.trim();

      if (!licenseKey) {
        return new Response(JSON.stringify({ error: 'Licencia requerida. Introduce una clave autorizada.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Licencias VIP / Mensuales autorizadas en variables de Cloudflare
      const allowedLicenses = (env.ALLOWED_LICENSES || '')
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);

      const isVipLicense = allowedLicenses.includes(licenseKey);
      const isDemoLicense = licenseKey.startsWith('DEMO-') || licenseKey.startsWith('TRIAL-');

      if (!isVipLicense && !isDemoLicense) {
        return new Response(JSON.stringify({ error: 'Licencia no válida o no registrada.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 3. Control de cuota en Cloudflare KV (solo aplica a claves Demo)
      let currentUsage = 0;
      const MAX_TRIAL_USAGE = 15;

      if (!isVipLicense && isDemoLicense) {
        if (env.LICENCIAS_KV) {
          const storedUsage = await env.LICENCIAS_KV.get(licenseKey);
          currentUsage = storedUsage ? parseInt(storedUsage, 10) : 0;

          if (currentUsage >= MAX_TRIAL_USAGE) {
            return new Response(JSON.stringify({ 
              error: `Has alcanzado el límite de ${MAX_TRIAL_USAGE} resoluciones de prueba de esta clave. Contacta por WhatsApp para activar tu plan mensual.` 
            }), {
              status: 403,
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json',
                'x-usage-count': String(currentUsage),
                'x-usage-left': '0'
              }
            });
          }
        }
      }

      // 4. Llamada a Google Gemini
      const payload = await request.json();
      const model = payload.model || 'gemini-2.5-flash';

      if (!env.GEMINI_API_KEY) {
        return new Response(JSON.stringify({ error: 'La variable GEMINI_API_KEY no está configurada en Cloudflare.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

      const geminiResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload.geminiData)
      });

      const responseData = await geminiResponse.text();

      // 5. Incrementar contador en KV si la resolución tuvo éxito
      if (geminiResponse.ok && !isVipLicense && isDemoLicense && env.LICENCIAS_KV) {
        currentUsage += 1;
        await env.LICENCIAS_KV.put(licenseKey, String(currentUsage));
      }

      const usageLeft = Math.max(0, MAX_TRIAL_USAGE - currentUsage);

      return new Response(responseData, {
        status: geminiResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'x-usage-count': String(currentUsage),
          'x-usage-left': String(usageLeft)
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || 'Error interno del servidor proxy.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};