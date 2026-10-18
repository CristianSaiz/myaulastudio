/**
 * Cloudflare Worker: Proxy Seguro para Gemini API con Blindaje de Seguridad
 * 
 * Este worker actúa como un puente seguro entre el frontend y Google Gemini,
 * implementando validación de origen (CORS) y control de licencias.
 */

export default {
  async fetch(request, env) {
    // 1. Configuración de Orígenes Permitidos (CORS)
    const allowedOrigins = [
      'https://myaulastudio.vercel.app',
      'http://localhost:5500',
      'http://127.0.0.1:5500'
    ];

    const origin = request.headers.get('Origin');
    const isAllowedOrigin = allowedOrigins.includes(origin);

    // Manejo de Preflight OPTIONS
    if (request.method === 'OPTIONS') {
      if (isAllowedOrigin) {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-license-key',
            'Access-Control-Max-Age': '86400',
          },
        });
      }
      return new Response(null, { status: 403 });
    }

    // 2. Validación de Origen para peticiones reales
    if (!isAllowedOrigin) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Origen no autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Validación de Licencia
    const licenseKey = request.headers.get('x-license-key');
    const allowedLicenses = (env.ALLOWED_LICENSES || '').split(',').map(k => k.trim());
    
    const isValidLicense = 
      (licenseKey && licenseKey.startsWith('DEMO-')) || 
      (licenseKey && allowedLicenses.includes(licenseKey));

    if (!isValidLicense) {
      return new Response(JSON.stringify({ error: 'Licencia no autorizada' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin
        }
      });
    }

    // 4. Procesamiento de la petición a Gemini
    try {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Método no permitido' }), {
          status: 405,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin 
          }
        });
      }

      const body = await request.json();
      const { model, geminiData } = body;

      if (!model || !geminiData) {
        return new Response(JSON.stringify({ error: 'Datos de petición incompletos' }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin 
          }
        });
      }

      // Reenvío seguro a Gemini usando la API KEY de entorno (secreta)
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(geminiData)
      });

      const data = await geminiResponse.json();

      // Devolvemos la respuesta al frontend manteniendo el aislamiento
      return new Response(JSON.stringify(data), {
        status: geminiResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin
        }
      });

    } catch (error) {
      // Manejo de errores sin exponer detalles técnicos o credenciales
      return new Response(JSON.stringify({ error: 'Error interno en el servidor de enlace' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin
        }
      });
    }
  }
};
