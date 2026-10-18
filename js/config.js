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

  // Configuración del periodo de prueba (Trial)
  TRIAL_MAX_DAYS: 7,
  TRIAL_MAX_USAGE: 15,
  DEMO_LICENSE_KEY: 'DEMO-TRIAL-7D',

  // Orígenes permitidos para el Worker
  ALLOWED_ORIGIN: ['https://myaulastudio.vercel.app', 'http://localhost:5500'],

  // Clave de licencia guardada en localStorage
  STORAGE_LICENSE_KEY: 'edtech_license_key',

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
    licenseKey: 'edtech_license_key',
    trialStartDate: 'edtech_trial_start',
    trialUsageCount: 'edtech_trial_usage',
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