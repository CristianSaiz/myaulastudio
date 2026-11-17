# CLAUDE.md — MyAulaStudio

Contexto para Claude Code. Léelo antes de tocar nada. Idioma de trabajo: **español** (código, comentarios y textos de UI están en español).

## Qué es

Web estática para docentes (creada para la hermana del autor). Hace tres cosas, seleccionables con pestañas (`currentToolMode`: `solve` | `create_exam` | `correct`):

1. **Resolver**: se le dan ejercicios (texto, fotos o PDF, hasta 7 adjuntos) y la IA los resuelve paso a paso.
2. **Crear examen**: genera desde cero un examen/ficha con N ejercicios (2–5).
3. **Corregir**: corrige un examen manuscrito/transcrito de un alumno.

Materias (`subject`): `math` (mates, física, química), `spanish` (lengua), `english`. Niveles: `primaria`, `eso`, `bachillerato`, `universidad`.

**Salida clave**: un único Markdown de la IA se divide en dos bloques y se imprime a **dos PDFs**:
- **PDF Alumno** (`mode-student-print`): solo enunciados, sin soluciones.
- **PDF Profesor**: enunciados + solucionario completo.

## Stack y restricciones

- HTML + JavaScript vanilla, **sin build, sin framework, sin módulos ES** (salvo `worker-cloudflare.js`). Los `.js` del front son scripts globales cargados por orden en `index.html`; **el orden de los `<script>` importa**: `config` → `mock-data` → `prompts` → `katex-render` → `api` → `pdf-export` → `app`.
- Librerías por CDN: Tailwind (play CDN), KaTeX 0.16.8 (+ auto-render), marked 12.0.2, DOMPurify 3.1.6. No hay `npm install` real (`package-lock.json` está vacío).
- Backend: **Cloudflare Worker** (`worker-cloudflare.js`) como proxy a Google Gemini. Despliegue del front: **Vercel** (`vercel.json`: rewrite a `index.html` + cabeceras de seguridad).
- Ejecutar en local: `python3 -m http.server 5500` (o `npx serve`) y abrir `http://localhost:5500`. Usa el puerto **5500** u **8000**: son los únicos orígenes locales permitidos por CORS en el Worker (y en `APP_CONFIG.ALLOWED_ORIGIN`, que solo admite 5500).
- Para probar maquetación/estilos sin gastar IA: `MOCK_MODE: true` en `js/config.js`. **No dejar nunca `MOCK_MODE: true` al hacer commit.**

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `index.html` | UI, carga de CDNs y scripts, modal de licencia, botones de PDF |
| `js/config.js` | `APP_CONFIG` (congelado): `MOCK_MODE`, `WORKER_URL`, modelos, claves de `localStorage`, contacto comercial |
| `js/prompts.js` | **Los prompts de la IA**: `SYSTEM_PROMPTS` (math/spanish/english), `LEVEL_INSTRUCTIONS`, `getSystemPrompt`, `getExamCreatorPrompt`, `getCorrectionPrompt` |
| `js/api.js` | `ApiClient.resolveExercise()`: mock / Gemini directo (BYOK) / Gemini vía Worker / OpenAI |
| `js/katex-render.js` | `MarkdownMathRenderer`: Markdown → HTML protegiendo LaTeX, DOMPurify, KaTeX, y **división en enunciados/soluciones** |
| `js/pdf-export.js` | `PdfExporter`: portada A4, título/nombre del PDF, sesión de impresión (`window.print()`) |
| `js/app.js` (~1200 líneas) | Controlador: DOM, estado, licencias, pestañas, adjuntos, flujo de “Resolver”, `renderCurrentView()` |
| `js/mock-data.js` | Respuestas simuladas por materia (`getMockResponse`) |
| `css/main.css` | Estilos de pantalla |
| `css/print.css` | Estilos de impresión: `@page`, portada, saltos de página, modo alumno |
| `worker-cloudflare.js` | Proxy: CORS, rate-limit por IP, licencias (VIP/demo), cuotas en KV, llamada a Gemini |

## Cómo fluye una resolución

1. `app.js` (listener de `resolveBtn`) elige el prompt según `currentToolMode`: `getSystemPrompt` / `getExamCreatorPrompt` / `getCorrectionPrompt`.
2. `ApiClient.resolveExercise()` envía texto + adjuntos en base64.
   - Con API key propia (BYOK) → llamada directa a Gemini desde el navegador.
   - Sin ella → `WORKER_URL` con cabecera `x-license-key`.
3. Vuelve **Markdown con LaTeX** (`$…$` en línea, `$$…$$` en bloque, SVG inline para gráficas).
4. `MarkdownMathRenderer.renderDocument()` lo divide y pinta `.bloque-enunciados` + `.page-break-soluciones` + `.bloque-soluciones`.
5. Los botones de PDF llaman a `PdfExporter.triggerPrint('student' | 'teacher')`. **No hay generación de PDF en servidor**: es impresión nativa del navegador (“Guardar como PDF”) con `print.css`. El modo alumno añade `body.mode-student-print`, y el CSS oculta soluciones y cambia textos de portada.

## Reglas importantes (no romper)

- **El contrato Markdown entre prompt y renderer.** Los prompts exigen la estructura `PARTE 1 … <div class="page-break"></div> … PARTE 2 …`. `renderDocument` divide por ese literal exacto; si falta, cae a una regex de encabezados (“Desarrollo”, “Solución”, “Detailed Solutions”, “Análisis Sintáctico”…). **Si cambias un encabezado o el separador en `prompts.js`, revisa esa regex en `katex-render.js`**, o el PDF del alumno saldrá con las soluciones.
- **Lengua e Inglés: prohibido LaTeX/`$`** en sus prompts (KaTeX deforma el texto). Mantenerlo.
- **Determinantes/matrices**: el prompt de `math` obliga a `\begin{vmatrix}` con `&` y `\\`. En el template literal de JS las barras invertidas van **escapadas** (`\\begin`, `\\\\`). Cuidado al editar esos bloques.
- **Gráficas**: la IA solo debe dibujar SVG cuando el enunciado lo pide (candado pedagógico en el prompt `math`). El SVG debe ir sin sangrías de 4 espacios ni líneas en blanco, o `marked` lo convierte en bloque de código.
- **Seguridad**: todo HTML pasa por DOMPurify; fallback fail-closed con `escapeHtml`. KaTeX con `trust:false`. El logo solo se acepta como Data URI de imagen validado por regex. No introducir `innerHTML` con datos sin sanear.
- **`print.css`** es delicado: `.portada` mide 296.5mm a propósito (evita hoja en blanco por redondeo), y hay reglas de `page-break-inside/after`, huérfanas y viudas. Probar siempre ambos PDFs tras tocarlo.
- **Modos de licencia**: una clave que contiene `DEMO` (o que no existe) = demo (solo Flash, 15 usos, contados en KV del Worker); cualquier otra = VIP/“Plan Centro” (Pro desbloqueado). Esa lógica está **duplicada** en el cliente (`updateLicenseBadge`) y en el Worker (`ALLOWED_LICENSES`, `LICENCIAS_KV`). El Worker es la fuente de verdad; el cliente solo es UX.
- **Modelos Gemini**: están en `APP_CONFIG.MODELS` y **repetidos** en `ALLOWED_MODELS` del Worker. Si cambias un modelo, cámbialo en ambos sitios (y en la lista de CORS si tocas dominios).

## Cosas a tener en cuenta (deuda conocida)

- `README.md` está **desfasado** respecto al código: muestra un Worker antiguo sin licencias, otra `WORKER_URL`, `gemini-3.1-pro` en vez de `gemini-3.1-pro-preview`, y habla de `MOCK_MODE` sin mencionar licencias. Fiarse del código, no del README.
- `app.js` concentra demasiado (UI, licencias, flujo de IA). Si se refactoriza, hacerlo por partes y sin cambiar los IDs del DOM.
- No hay tests ni linter. Verificar a mano con `MOCK_MODE` y, para cambios de prompt, con una resolución real.
- `.gitignore` excluye `*.pdf`, `*.png`, `*.svg` y `myaulastudio.md`: los ejemplos de PDF o imágenes no se versionan.
- El Worker se despliega **a mano** en Cloudflare (no hay `wrangler.toml` en el repo). Un cambio en `worker-cloudflare.js` no tiene efecto hasta pegarlo/desplegarlo allí. Secretos (`GEMINI_API_KEY`, `ALLOWED_LICENSES`) y el KV (`LICENCIAS_KV`) viven en Cloudflare, nunca en el repo.

## Convenciones de trabajo

- Comentarios y mensajes de UI en español, tono docente, tuteo.
- Mantener JS vanilla; no añadir dependencias ni paso de build sin consultarlo.
- Cambios pequeños y enfocados. Antes de editar `prompts.js`, `katex-render.js` o `print.css`, explicar el efecto sobre los PDFs.
- Nunca commitear claves, licencias reales ni `MOCK_MODE: true`.
