// ==========================================================================
// Cliente de API e Integración con Modelos de IA (Híbrido: Directo vs Worker)
// ==========================================================================

const ApiClient = {
  /**
   * Envía la petición a la IA o devuelve datos simulados si MOCK_MODE está activo.
   * @param {Object} params
   * @param {string} params.provider - 'gemini' | 'openai'
   * @param {string} [params.apiKey] - Clave personal (opcional: si falta, usa Worker)
   * @param {string} params.systemPrompt - Instrucciones pedagógicas
   * @param {string} params.userMessage - Enunciado del problema
   * @param {Array}  params.files - Array de objetos [{ mimeType, base64, name }]
   * @param {string} params.engineMode - 'flash' | 'pro'
   * @param {string} params.subject - Materia para fallback / mock
   * @returns {Promise<string>} Markdown con la resolución y fórmulas en LaTeX
   */
  async resolveExercise({
    provider = 'gemini',
    apiKey = '',
    systemPrompt,
    userMessage,
    files = [],
    engineMode = 'flash',
    subject = 'math',
    signal = null // <-- Parámetro de cancelación
  }) {
    // ----------------------------------------------------------------------
    // 1. MODO SIMULACIÓN (Coste Cero / Sin consumo de red)
    // ----------------------------------------------------------------------
    if (APP_CONFIG.MOCK_MODE) {
      console.info(`[MOCK_MODE] Respuesta simulada para: ${subject} (${engineMode})`);
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, APP_CONFIG.MOCK_DELAY_MS);
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Resolución cancelada por el usuario.', 'AbortError'));
          });
        }
      });
      return getMockResponse(subject);
    }

    // ----------------------------------------------------------------------
    // 2. CONSTRUCCIÓN DE PROMPTS Y ADJUNTOS
    // ----------------------------------------------------------------------
    const defaultPrompt = 'Resuelve paso a paso de manera detallada todos los ejercicios presentes en los documentos o imágenes adjuntos.';
    const finalMessage = userMessage ? `${userMessage}` : defaultPrompt;

    // ----------------------------------------------------------------------
    // 3. GOOGLE GEMINI (Bifurcación Híbrida: Directo con API Key vs Worker Proxy)
    // ----------------------------------------------------------------------
    if (provider === 'gemini') {
      const modelId = APP_CONFIG.MODELS.gemini[engineMode] || APP_CONFIG.MODELS.gemini.flash;

      // Estructuramos los bloques de contenido para Gemini
      const parts = [
        { text: `${systemPrompt}\n\nEnunciado / Tarea:\n${finalMessage}` }
      ];

      // Inyección de archivos multimodales (imágenes o PDF)
      files.forEach(file => {
        parts.push({
          inline_data: {
            mime_type: file.mimeType,
            data: file.base64
          }
        });
      });

      const geminiData = { contents: [{ parts }] };
      const hasPersonalKey = Boolean(apiKey && apiKey.trim().length > 0);

      let response;

      if (hasPersonalKey) {
        // --- RUTA A: LLAMADA DIRECTA (BYOK - Clave propia con cabecera segura) ---
        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;
        response = await fetch(directUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey.trim()
          },
          body: JSON.stringify(geminiData),
          signal: signal || undefined // <-- Soporte AbortSignal
        });
      } else {
        // --- RUTA B: PROXY SEGURO EN CLOUDFLARE WORKER (Clave centralizada en backend) ---
        const licenseKey = localStorage.getItem(APP_CONFIG.STORAGE_LICENSE_KEY);
        
        if (!licenseKey) {
          throw new Error('No se ha configurado una clave de licencia válida.');
        }

        response = await fetch(APP_CONFIG.WORKER_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-license-key': licenseKey
          },
          body: JSON.stringify({
            model: modelId,
            geminiData: geminiData
          }),
          signal: signal || undefined // <-- Soporte AbortSignal
        });
      }

      // 1. Si el Worker devuelve un error (ej: 401, 403, 503)
      if (!response.ok) {
        let errorMsg = `Error en el servidor (${response.status})`;
        try {
          const errJson = await response.json();
          if (errJson && errJson.error) {
            errorMsg = (typeof errJson.error === 'object')
              ? (errJson.error.message || JSON.stringify(errJson.error))
              : errJson.error;
          }
        } catch (e) {
          // Si no vino en formato JSON, se mantiene el mensaje genérico
        }

        // Si es una sobrecarga temporal de Google, dar mensaje amigable
        if (response.status === 503 || errorMsg.includes('overloaded')) {
          errorMsg = 'Los servidores de Google Gemini están momentáneamente saturados. Por favor, pulsa "Resolver Ejercicio" de nuevo en unos segundos.';
        }

        throw new Error(errorMsg);
      }

      // 2. Sincronizar el contador de usos devuelto por Cloudflare KV
      const serverUsage = response.headers.get('x-usage-count');
      if (serverUsage !== null) {
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.trialUsageCount, serverUsage);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || `Error devuelto por Gemini (${modelId})`);
      }

      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Gemini devolvió una respuesta vacía o el contenido fue retenido por filtros de seguridad.');
      }

      return data.candidates[0].content.parts[0].text;
    }

    // ----------------------------------------------------------------------
    // 4. OPENAI (GPT-4o-mini / Fallback BYOK)
    // ----------------------------------------------------------------------
    if (provider === 'openai') {
      if (!apiKey) {
        throw new Error('Para utilizar OpenAI debes suministrar una clave API válida.');
      }

      const modelId = APP_CONFIG.MODELS.openai.standard;
      const content = [{ type: 'text', text: finalMessage }];

      files.forEach(file => {
        if (file.mimeType.startsWith('image/')) {
          content.push({
            type: 'image_url',
            image_url: { url: `data:${file.mimeType};base64,${file.base64}` }
          });
        }
      });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: content }
          ],
          temperature: 0.2
        }),
        signal: signal || undefined // <-- Soporte AbortSignal
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || 'Error en la API de OpenAI');
      }

      return data.choices[0].message.content;
    }

    throw new Error(`Proveedor de IA no soportado: ${provider}`);
  }
};