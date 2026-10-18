// ==========================================================================
// Motor de Renderizado Matemático y Markdown (Marked.js + KaTeX)
// ==========================================================================

const MarkdownMathRenderer = {
  /**
   * Opciones de delimitadores para KaTeX auto-render
   */
  katexOptions: {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false }
    ],
    throwOnError: false,
    errorColor: '#cc0000',
    strict: false
  },

  /**
   * Transforma texto plano Markdown a HTML utilizando marked.js
   * @param {string} markdownText - Texto plano devuelto por la IA o el Mock.
   * @returns {string} Código HTML resultante.
   */
  parseMarkdown(markdownText) {
    if (!markdownText) return '';
    if (typeof marked !== 'undefined' && marked.parse) {
      return marked.parse(markdownText);
    }
    // Fallback básico en caso de fallo de carga de marked.js
    return markdownText.replace(/\n/g, '<br>');
  },

  /**
   * Ejecuta el análisis de KaTeX sobre un contenedor del DOM para convertir
   * todas las fórmulas entre delimitadores ($y$$) en ecuaciones visuales.
   * @param {HTMLElement} domElement - Elemento que contiene el HTML ya insertado.
   */
  renderMath(domElement) {
    if (!domElement) return;

    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(domElement, this.katexOptions);
      } catch (err) {
        console.error('Error durante el renderizado de KaTeX:', err);
      }
    } else {
      console.warn('KaTeX auto-render no está disponible en window.renderMathInElement.');
    }
  },

  /**
   * Flujo completo: separa enunciados de soluciones, parsea el markdown y renderiza KaTeX.
   */
  renderDocument(container, rawMarkdown, coverHtml = '') {
    if (!container) return;

    let enunciadosMd = rawMarkdown;
    let solucionesMd = '';

    // 1. Detección por separador explícito de página
    const splitToken = '<div class="page-break"></div>';
    if (rawMarkdown.includes(splitToken)) {
      const parts = rawMarkdown.split(splitToken);
      enunciadosMd = parts[0];
      solucionesMd = parts.slice(1).join(splitToken);
    } else {
      // 2. Detección multilingüe por encabezados típicos de solución (## o ###)
      // Cubre: Ejercicios Resueltos, Desarrollo, Soluciones, Detailed Solutions, Análisis Paso a Paso
      const regexSoluciones = /(?:^|\n)(?:#{2,3}\s*(?:✍️\s*)?(?:[0-9]+\.\s*)?(?:Ejercicios\s+Resueltos|Desarrollo|Soluci[oó]n(?:es)?|Detailed\s+Solutions|An[aá]lisis\s+Sint[aá]ctico|Resoluci[oó]n))/i;
      const match = rawMarkdown.match(regexSoluciones);
      if (match && match.index !== undefined) {
        // El punto de corte es donde empieza el encabezado de soluciones
        const splitIndex = match.index + (match[0].startsWith('\n') ? 1 : 0);
        enunciadosMd = rawMarkdown.substring(0, splitIndex);
        solucionesMd = rawMarkdown.substring(splitIndex);
      }
    }

    let innerContentHtml = '';

    if (solucionesMd.trim()) {
      const enunciadosHtml = this.parseMarkdown(enunciadosMd);
      const solucionesHtml = this.parseMarkdown(solucionesMd);
      innerContentHtml = `
        <div class="bloque-enunciados">
          ${enunciadosHtml}
        </div>
        <div class="page-break page-break-soluciones"></div>
        <div class="bloque-soluciones">
          ${solucionesHtml}
        </div>
      `;
    } else {
      innerContentHtml = this.parseMarkdown(rawMarkdown);
    }

    // Inyectamos portada y contenido con sus bloques diferenciados
    container.innerHTML = `
      ${coverHtml}
      <div class="contenido-documento">
        ${innerContentHtml}
      </div>
    `;

    // Renderizamos las fórmulas de KaTeX
    this.renderMath(container);
  }
};