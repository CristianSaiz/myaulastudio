# 🎓 MyAulaStudio · Suite Docente Multidisciplinar

> Plataforma web para docentes, colegios y academias orientada a la resolución pedagógica paso a paso de ejercicios, maquetación matemática con KaTeX y generación automatizada de cuadernos de trabajo y exámenes en PDF (Edición Alumno y Edición Profesor).

---

## 📋 Tabla de Contenidos

1. [Visión y Modelo de Negocio](#-visión-y-modelo-de-negocio)
2. [Características Principales](#-características-principales)
3. [Materias Soportadas y Enfoque Pedagógico](#-materias-soportadas-y-enfoque-pedagógico)
4. [Arquitectura del Sistema](#-arquitectura-del-sistema)
5. [Estructura del Proyecto](#-estructura-del-proyecto)
6. [Pila Tecnológica (Tech Stack)](#-pila-tecnológica-tech-stack)
7. [Instalación y Uso en Local](#-instalación-y-uso-en-local)
8. [Despliegue en Producción](#-despliegue-en-producción)
   - [Paso 1: Proxy Seguro en Cloudflare Workers](#paso-1-proxy-seguro-en-cloudflare-workers)
   - [Paso 2: Frontend en Vercel](#paso-2-frontend-en-vercel)
9. [Configuración y Variables](#-configuración-y-variables)
10. [Hoja de Ruta (Roadmap)](#-hoja-de-ruta-roadmap)
11. [Licencia y Créditos](#-licencia-y-créditos)

---

## 💡 Visión y Modelo de Negocio

**MyAulaStudio** resuelve la carga operativa de profesores y academias al preparar material didáctico, exámenes y solucionarios. 

- **Arquitectura de Coste Fijo Cero (0 €/mes):** El frontend se sirve como sitio estático de alto rendimiento en Vercel, y las llamadas a la IA se gestionan mediante un Cloudflare Worker serverless o de manera directa por el cliente.
- **Modelo Híbrido (Centralizado vs. BYOK):**
  - **SaaS Comercial Llave en Mano:** La plataforma utiliza el Worker con la clave del creador centralizada para ofrecer suscripciones mensuales (15 € – 30 €/mes por centro).
  - **Modo BYOK (*Bring Your Own Key*):** Si un docente o centro introduce su propia API Key de Google Gemini en la interfaz, la aplicación realiza llamadas directas sin pasar por el Worker ni generar costes al administrador.

---

## ✨ Características Principales

- **Resolución Multidisciplinar Adaptada:** Prompts maestros calibrados para niveles de ESO, Bachillerato y pruebas de acceso universitario (EBAU / Selectividad).
- **Entrada Multimodal:** Admite transcripciones textuales y subida simultánea de hasta 7 archivos adjuntos (imágenes manuscritas, fotos de libros o documentos PDF).
- **Selector de Motor Inteligente:**
  - ⚡ **Rápido (`Flash` - `gemini-3.8-flash`):** Respuesta en ~3 segundos, óptimo para ejercicios de clase estándar y flujos ágiles.
  - 🧠 **Profundo (`Pro` - `gemini-3.1-pro`):** Razonamiento deductivo avanzado (~15-20 s) para problemas abstractos, demostraciones teóricas y análisis sintácticos complejos.
- **Maquetación Matemática de Alta Precisión:** Renderizado en tiempo real de sintaxis LaTeX ($ y $$) mediante KaTeX, con tratamiento riguroso de matrices, determinantes y delimitadores.
- **Doble Exportación a PDF (Dual Print Engine):**
  - 🎒 **Versión Alumno:** Cuaderno maquetado exclusivamente con los enunciados y espacio de trabajo, ideal para deberes o pruebas evaluables.
  - 👨‍🏫 **Versión Profesor:** Solucionario didáctico completo con todo el desarrollo analítico, autocomprobación y justificación teórica.
- **Diseño Editorial y Marca Blanca:** Portada A4 personalizable en vivo con el nombre del centro educativo, lema/subtítulo, curso lectivo y distintivos de uso docente.

---

## 📚 Materias Soportadas y Enfoque Pedagógico

### 1. Ciencias (Matemáticas, Física y Química)
- Transcripción fiel de enunciados numéricos y manuscritos.
- Explicación teórica inicial antes de aplicar leyes o identidades.
- Cálculos paso a paso con fórmulas en LaTeX estricto y sustitución numérica explícita.
- Autocomprobación de soluciones y enmarcado del resultado definitivo.

### 2. Lengua Castellana y Literatura
- Transcripción y segmentación de oraciones compuestas.
- Desglose jerárquico multinivel: Oración principal, proposiciones coordinadas/subordinadas, sintagmas y funciones sintácticas (Sujeto, Predicado, CD, CI, CRég, CC, etc.).
- Explicación de morfología, valores del *se* y referencias a la normativa RAE.

### 3. Inglés (Exámenes Oficiales y EBAU)
- Resolución de ejercicios de gramática, transformación de frases (*rephrasing*), lectura y redacción.
- Explicación en español de la regla subyacente (voz pasiva, condicionales, *phrasal verbs*, estilo indirecto).
- Sección de vocabulario clave con transcripción fonética aproximada o traducción contextual.

---

## 🏗 Arquitectura del Sistema

```text
┌─────────────────────────────────────────────────────────────────┐
│                       NAVEGADOR DOCENTE                         │
│  [ Entrada: Texto / Fotos ] ─── [ Portada / Marca del Centro ]  │
└────────────────┬───────────────────────────────┬────────────────┘
                 │ (Sin API Key personal)        │ (Con API Key BYOK)
                 ▼                               │
┌───────────────────────────────────┐            │
│   Cloudflare Worker Proxy         │            │
│   - CORS Control                  │            │
│   - Secret GEMINI_API_KEY cifrada │            │
└────────────────┬──────────────────┘            │
                 │                               │
                 ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API DE GOOGLE GEMINI                        │
│             gemini-3.8-flash  /  gemini-3.1-pro                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Markdown + LaTeX
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                 MOTOR DE MAQUETACIÓN LOCAL                      │
│   - Marked.js (Markdown ➔ HTML)                                 │
│   - KaTeX (LaTeX ➔ Fórmulas vectoriales)                        │
│   - CSS Print Engine (Reglas de salto de página y huérfanas)    │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       🎒 PDF Alumno (Enunciados)      👨‍🏫 PDF Profesor (Solucionario)
```

## 📂 Estructura del Proyecto

```text
myaulastudio/
├── index.html              # Interfaz de usuario, estructura semántica y CDN
├── css/
│   ├── main.css            # Estilos de maquetación, portada editorial y visor
│   └── print.css           # Reglas CSS de impresión para exportación a PDF
├── js/
│   ├── config.js           # Configuración global, modelos e interruptores
│   ├── mock-data.js        # Exportador de portadas, PDFs y respuestas simuladas
│   ├── prompts.js          # Prompts maestros del sistema por materia
│   ├── katex-render.js     # Motor de renderizado KaTeX y parseo Markdown
│   ├── api.js              # Cliente de API híbrido (Worker vs. llamada directa)
│   ├── pdf-export.js       # Manejo de impresión dual y sanitización
│   └── app.js              # Controlador principal, estado reactivo y DOM
└── README.md               # Documentación integral del proyecto
```

## 🛠 Pila Tecnológica (Tech Stack)

- **Frontend Core:** HTML5 semántico, JavaScript vanilla (ES6+ modular, sin dependencias pesadas ni frameworks de compilación para máxima velocidad y carga instantánea).
- **Estilos y Maquetación:** Tailwind CSS (utilidades base) y motor CSS3 nativo (`break-inside`, `break-after`, `orphans`, `widows`) para control milimétrico de las páginas impresas.
- **Motor Matemático:** [KaTeX 0.16.x](https://katex.org/) (renderizado instantáneo de fórmulas en sintaxis LaTeX).
- **Procesador de Texto:** [Marked.js](https://marked.js.org/) (conversión de Markdown a HTML seguro).
- **Backend / Seguridad:** [Cloudflare Workers](https://workers.cloudflare.com/) (proxy ultrarrápido con latencia mínima y cifrado de secretos).
- **Despliegue Web:** [Vercel](https://vercel.com/) (CDN global, certificados HTTPS automáticos y sincronización continua con GitHub).

---

## 💻 Instalación y Uso en Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/CristianSaiz/myaulastudio.git
   cd myaulastudio
   ```
2. **Abrir en local:**
   Al ser una arquitectura estática sin dependencias de Node.js en tiempo de ejecución, puedes abrir `index.html` directamente en el navegador o iniciar un servidor local ligero:
   ```bash
   # Opción A: Con Python
   python3 -m http.server 8000

   # Opción B: Con Node.js / npx serve
   npx serve .
   ```

3. **Modo de pruebas sin consumo de red (`MOCK_MODE`):**
Para ajustar la maquetación o los estilos sin realizar llamadas externas, activa `MOCK_MODE: true` en `js/config.js`.

---

## 🚀 Despliegue en Producción

### Paso 1: Proxy Seguro en Cloudflare Workers

1. Crea un Worker en el panel de Cloudflare (ej. `resolutor-edtech-api`).
2. Pega y despliega el código del proxy (`worker.js`):
```javascript
export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (request.method !== 'POST') return new Response('Método no permitido', { status: 405, headers: corsHeaders });

    try {
      const payload = await request.json();
      const model = payload.model || 'gemini-3.8-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload.geminiData)
      });

      const data = await response.text();
      return new Response(data, {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};

```


3. En **Settings > Variables and Secrets**, crea la variable cifrada `GEMINI_API_KEY` con tu clave de Google AI Studio.

### Paso 2: Frontend en Vercel

1. Entra a [Vercel](https://vercel.com) e importa tu repositorio privado `myaulastudio`.
2. Asigna el nombre del proyecto (`myaulastudio`).
3. Haz clic en **Deploy**. La web quedará publicada de inmediato bajo el subdominio `https://myaulastudio.vercel.app`.
4. *(Opcional)* En **Settings > Domains**, vincula el dominio personalizado `myaulastudio.es`.

---

## ⚙️ Configuración y Variables

El archivo `js/config.js` controla los parámetros globales de la aplicación:

```javascript
const APP_CONFIG = {
  // false = conexión real (Worker / BYOK) | true = respuestas simuladas locales
  MOCK_MODE: false,

  // Endpoint del proxy seguro en Cloudflare Workers
  WORKER_URL: 'https://resolutor-edtech-api.c-saiz-montes.workers.dev',

  MOCK_DELAY_MS: 600,
  MAX_FILES: 7,

  // Modelos configurados en la suite
  MODELS: {
    gemini: {
      flash: 'gemini-3.8-flash',
      pro: 'gemini-3.1-pro'
    },
    openai: {
      standard: 'gpt-4o-mini'
    }
  },

  // Valores por defecto de la portada editorial
  DEFAULTS: {
    academyName: 'Mates, Amor y Magia',
    academySlogan: 'Donde las matemáticas cobran sentido',
    academyCourse: '2º Bachillerato · Ciencias',
    provider: 'gemini',
    subject: 'math'
  },

  // Claves para persistencia en localStorage
  STORAGE_KEYS: {
    apiKeyPrefix: 'myaulastudio_key_',
    academyName: 'myaulastudio_academy_name',
    academySlogan: 'myaulastudio_academy_slogan',
    academyCourse: 'myaulastudio_academy_course'
  }
};

```

---

## 🗺 Hoja de Ruta (Roadmap)

* [x] **Fase 1:** Prototipo funcional multidisciplinar con entrada de texto e imágenes (hasta 7 adjuntos).
* [x] **Fase 2:** Integración de KaTeX, marked.js y reglas de impresión CSS libres de roturas de página.
* [x] **Fase 3:** Sistema de impresión dual (Cuaderno del Alumno vs. Solucionario del Profesor).
* [x] **Fase 4:** Arquitectura híbrida en Cloudflare Workers para protección de credenciales y modo BYOK.
* [ ] **Fase 5:** Carga y previsualización de logotipo personalizado del centro en la portada.
* [ ] **Fase 6:** Panel de administración multi-inquilino (*multi-tenant*) con límites de cuota por centro.
* [ ] **Fase 7:** Adquisición y configuración de DNS para el dominio comercial `myaulastudio.es`.

---

## 📄 Licencia

Este proyecto es propiedad privada y confidencial. Desarrollado para uso interno y comercialización bajo la marca **MyAulaStudio**. Todos los derechos reservados.