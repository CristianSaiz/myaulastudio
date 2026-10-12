// ==========================================================================
// Configuración Global de la Aplicación
// ==========================================================================

const APP_CONFIG = {
  // ------------------------------------------------------------------------
  // INTERRUPTOR DE PRUEBAS (Coste Cero)
  // ------------------------------------------------------------------------
  // true  -> No llama a la API externa. Devuelve datos simulados al instante
  //          para ajustar maquetación, KaTeX y la portada sin consumir cuota.
  // false -> Realiza la llamada HTTP real hacia Gemini o el proveedor elegido.
  MOCK_MODE: true,

  // Endpoint de tu proxy seguro en Cloudflare Workers
  WORKER_URL: 'https://resolutor-edtech-api.c-saiz-montes.workers.dev',

  // Retardo simulado en milisegundos cuando MOCK_MODE está activo
  // (permite verificar que la animación de carga/spinner funciona visualmente)
  MOCK_DELAY_MS: 600,

  // Límite máximo de archivos adjuntos simultáneos
  MAX_FILES: 7,

  // Mapeo de identificadores de modelos según el modo seleccionado
  MODELS: {
    gemini: {
      flash: 'gemini-3.8-flash',
      pro: 'gemini-3.1-pro'
    },
    openai: {
      standard: 'gpt-4o-mini'
    }
  },

  // Valores predeterminados para la portada editorial
  DEFAULTS: {
    academyName: 'Mates, Amor y Magia',
    academySlogan: 'Donde las matemáticas cobran sentido',
    academyCourse: '2º Bachillerato · Ciencias',
    provider: 'gemini',
    subject: 'math'
  },

  // Claves fijas utilizadas en localStorage
  STORAGE_KEYS: {
    apiKeyPrefix: 'myaulastudio_key_',
    academyName: 'myaulastudio_academy_name',
    academySlogan: 'myaulastudio_academy_slogan',
    academyCourse: 'myaulastudio_academy_course'
  }
};

// Congelamos el objeto para evitar modificaciones accidentales en tiempo de ejecución
Object.freeze(APP_CONFIG);
Object.freeze(APP_CONFIG.MODELS);
Object.freeze(APP_CONFIG.DEFAULTS);
Object.freeze(APP_CONFIG.STORAGE_KEYS);