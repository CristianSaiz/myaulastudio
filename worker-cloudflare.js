export default {
  async fetch(request, env) {
    // 1. Orígenes autorizados (CORS estricto)
    const allowedOrigins = [
      'https://myaulastudio.vercel.app',
      'https://cristiansaiz.github.io',
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
      'Vary': 'Origin'
    };

    // Preflight OPTIONS (negociación del navegador)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Solo se permite método POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método no permitido.' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Bloqueo si viene de un origen web no listado
    if (origin && !isAllowedOrigin) {
      return new Response(JSON.stringify({ error: 'Acceso no autorizado desde este origen.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ----------------------------------------------------------------------
    // CONTROL DE FRECUENCIA POR IP (Rate Limiting 100 % Gratis en KV)
    // ----------------------------------------------------------------------
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (env.LICENCIAS_KV && clientIp !== 'unknown') {
      const ipKey = `ratelimit:${clientIp}`;
      const currentIpRequests = parseInt(await env.LICENCIAS_KV.get(ipKey) || '0', 10);

      // Máximo 10 peticiones por minuto por dirección IP
      if (currentIpRequests >= 10) {
        return new Response(JSON.stringify({ 
          error: 'Demasiadas solicitudes desde tu conexión. Por favor, espera un minuto antes de reintentar.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Incrementa el contador y fija una expiración de 60 segundos en KV
      await env.LICENCIAS_KV.put(ipKey, String(currentIpRequests + 1), {
        expirationTtl: 60
      });
    }

    // 2. Validación de carga útil real en memoria (Techo estricto de 5 MB)
    const MAX_PAYLOAD_SIZE = 5 * 1024 * 1024; // 5 MB
    const rawBody = await request.text();
    const actualByteLength = new TextEncoder().encode(rawBody).byteLength;

    if (actualByteLength > MAX_PAYLOAD_SIZE) {
      return new Response(JSON.stringify({ 
        error: 'El tamaño de la petición excede el límite permitido de 5 MB.' 
      }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: 'Payload JSON malformado.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // 3. Validación de Licencia
      const licenseKey = request.headers.get('x-license-key')?.trim();

      if (!licenseKey) {
        return new Response(JSON.stringify({ error: 'Licencia requerida. Introduce una clave autorizada.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Comprobación de Licencia VIP / Ilimitada (Variables de entorno)
      const allowedVipLicenses = (env.ALLOWED_LICENSES || '')
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);

      const isVipLicense = allowedVipLicenses.includes(licenseKey);

      // Comprobación de Licencia DEMO en Cloudflare KV
      let storedUsage = null;
      let isDemoLicense = false;

      if (!isVipLicense && env.LICENCIAS_KV) {
        storedUsage = await env.LICENCIAS_KV.get(licenseKey);
        isDemoLicense = (storedUsage !== null);
      }

      // Si no es VIP ni está en KV -> BLOQUEO
      if (!isVipLicense && !isDemoLicense) {
        return new Response(JSON.stringify({ 
          error: 'Licencia no válida o no registrada. Solicita tu clave de prueba autorizada.' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 4. Control de cuota (solo Demo)
      let currentUsage = storedUsage ? parseInt(storedUsage, 10) : 0;
      const MAX_TRIAL_USAGE = 15;

      if (!isVipLicense && isDemoLicense) {
        if (currentUsage >= MAX_TRIAL_USAGE) {
          return new Response(JSON.stringify({ 
            error: `Has alcanzado el límite de ${MAX_TRIAL_USAGE} resoluciones de prueba. Contacta para activar tu plan mensual.` 
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

      // 5. Blindaje de Modelo y Autorización de Tier [VULN-02]
      const ALLOWED_MODELS = {
        flash: 'gemini-3.8-flash',
        pro: 'gemini-3.1-pro-preview'
      };

      // Las licencias Demo SOLO pueden usar Flash. Pro está reservado para VIPs
      let model = ALLOWED_MODELS.flash;
      if (isVipLicense && payload.model === ALLOWED_MODELS.pro) {
        model = ALLOWED_MODELS.pro;
      }

      // 6. Sanitización estricta del cuerpo Gemini (Anti-Object Pollution) [VULN-05]
      const userParts = payload?.geminiData?.contents?.[0]?.parts;
      if (!Array.isArray(userParts) || userParts.length === 0 || userParts.length > 8) {
        return new Response(JSON.stringify({ error: 'Estructura o número de elementos adjuntos no válido (máx. 8).' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!env.GEMINI_API_KEY) {
        return new Response(JSON.stringify({ error: 'Servicio de IA temporalmente no disponible.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const geminiBody = {
        contents: [{ parts: userParts }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          thinkingConfig: model.startsWith('gemini-3') 
            ? { thinkingLevel: 'low' } 
            : { thinkingBudget: 1024 }
        }
      };

      // 7. Reserva preventiva de cuota en KV (Mitigación TOCTOU) [VULN-01 y VULN-03]
      const KV_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 días de persistencia
      if (!isVipLicense && isDemoLicense && env.LICENCIAS_KV) {
        await env.LICENCIAS_KV.put(licenseKey, String(currentUsage + 1), {
          expirationTtl: KV_TTL_SECONDS
        });
      }

      // 8. Llamada a Google Gemini con cabecera segura x-goog-api-key [VULN-12]
      const callGemini = async (modelToUse) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent`;
        return fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-goog-api-key': env.GEMINI_API_KEY
          },
          body: JSON.stringify(geminiBody)
        });
      };

      let geminiResponse = await callGemini(model);

      // Reintento automático ante 503 (servidor momentáneamente sobrecargado)
      if (geminiResponse.status === 503) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        geminiResponse = await callGemini(model);
      }

      // Si la llamada falla por error 5xx de servidor Google, revertimos el consumo en KV
      if (!geminiResponse.ok && geminiResponse.status >= 500 && !isVipLicense && isDemoLicense && env.LICENCIAS_KV) {
        await env.LICENCIAS_KV.put(licenseKey, String(currentUsage), {
          expirationTtl: KV_TTL_SECONDS
        });
      } else if (geminiResponse.ok && !isVipLicense && isDemoLicense) {
        currentUsage += 1;
      }

      const responseData = await geminiResponse.text();
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
      console.error('[Worker Error]:', err);
      return new Response(JSON.stringify({ error: 'Error interno en el procesamiento de la solicitud.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};