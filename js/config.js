// ==========================================================================
// Configuración Global de la Aplicación
// ==========================================================================

const APP_CONFIG = {
  // ------------------------------------------------------------------------
  // INTERRUPTOR DE MODO REAL / SIMULACIÓN
  // ------------------------------------------------------------------------
  // false -> Modo Producción: conecta con Cloudflare Worker, KV y Gemini.
  // true  -> Modo Pruebas: responde localmente con datos simulados (coste 0).
  MOCK_MODE: false,

  // Endpoint de tu proxy seguro en Cloudflare Workers
  WORKER_URL: 'https://resolutor-edtech-api.c-saiz-montes.workers.dev',

  // Retardo simulado en milisegundos cuando MOCK_MODE está activo
  MOCK_DELAY_MS: 600,

  // Límite máximo de archivos adjuntos simultáneos
  MAX_FILES: 7,

  // Límite máximo de resoluciones para claves demo/prueba
  TRIAL_MAX_USAGE: 15,

  // Orígenes autorizados (CORS)
  ALLOWED_ORIGIN: [
    'https://myaulastudio.vercel.app',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],

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
    academyName: 'Centro de Estudios',
    academySlogan: 'Excelencia y rigor pedagógico',
    academyCourse: '2º Bachillerato',
    coverTitle: 'Ejercicios Resueltos',
    provider: 'gemini',
    subject: 'math'
  },

  // Claves fijas utilizadas en localStorage
  STORAGE_KEYS: {
    licenseKey: 'edtech_license_key',
    trialUsageCount: 'edtech_trial_usage',
    apiKeyPrefix: 'myaulastudio_key_',
    academyName: 'myaulastudio_academy_name',
    academySlogan: 'myaulastudio_academy_slogan',
    academyCourse: 'myaulastudio_academy_course',
    academyLogo: 'edtech_academy_logo',
    coverTitle: 'myaulastudio_cover_title'
  },

  // ------------------------------------------------------------------------
  // CONTACTO COMERCIAL Y SOPORTE (Solicitud de Licencias)
  // ------------------------------------------------------------------------
  CONTACT: {
    // Teléfono con prefijo internacional sin signos ni espacios
    whatsappPhone: '34633102444', 
    whatsappMessage: 'Hola, me gustaría solicitar una clave de acceso para MyAulaStudio',
    
    // Correo de contacto
    email: 'c.saiz.montes@gmail.com',
    emailSubject: 'Solicitud de Licencia MyAulaStudio',
    emailBody: 'Hola, me gustaría probar MyAulaStudio en mi centro educativo o clases particulares.'
  }
};

// Congelamos el objeto para evitar modificaciones accidentales en tiempo de ejecución
Object.freeze(APP_CONFIG);
Object.freeze(APP_CONFIG.MODELS);
Object.freeze(APP_CONFIG.DEFAULTS);
Object.freeze(APP_CONFIG.STORAGE_KEYS);
Object.freeze(APP_CONFIG.CONTACT);