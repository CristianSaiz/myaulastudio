// ==========================================================================
// Motor de Renderizado Matemático y Markdown (Marked.js + KaTeX Blindado)
// ==========================================================================

const MarkdownMathRenderer = {
  /**
   * Opciones de delimitadores para KaTeX
   */
  katexOptions: {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
      { left: '[', right: ']', display: true },
      { left: '\\(', right: '\\)', display: false }
    ],
    throwOnError: false,
    errorColor: '#cc0000',
    strict: false
  },

  /**
   * Transforma texto plano Markdown a HTML protegiendo las fórmulas LaTeX
   * para evitar que marked.js se coma las barras invertidas de las matrices (\\\\).
   * @param {string} markdownText - Texto plano devuelto por la IA o el Mock.
   * @returns {string} Código HTML resultante con fórmulas compiladas.
   */
  parseMarkdown(markdownText) {
    if (!markdownText) return '';

    const mathBlocks = [];

    // 1. Proteger bloques display ($$...$$) para que marked.js no altere sus '\\'
    let protectedText = markdownText.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      const id = `@@KATEX_DISPLAY_${mathBlocks.length}@@`;
      const cleanFormula = formula.trim().replace(/^[\*\-•]\s*/, '');
      mathBlocks.push({ id, formula: cleanFormula, display: true });
      return `\n\n${id}\n\n`;
    });

    // 2. Proteger fórmulas en línea ($...$)
    protectedText = protectedText.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
      const id = `@@KATEX_INLINE_${mathBlocks.length}@@`;
      mathBlocks.push({ id, formula: formula.trim(), display: false });
      return id;
    });

    // 3. Parsear el resto de la estructura Markdown a HTML
    let html = (typeof marked !== 'undefined' && marked.parse)
      ? marked.parse(protectedText)
      : protectedText.replace(/\n/g, '<br>');

    // 4. Renderizar las fórmulas directamente con KaTeX conservando los '\\' intactos
    mathBlocks.forEach(item => {
      if (typeof window.katex !== 'undefined' && window.katex.renderToString) {
        try {
          const renderedMath = window.katex.renderToString(item.formula, {
            displayMode: item.display,
            throwOnError: false,
            errorColor: '#cc0000'
          });
          html = html.split(item.id).join(renderedMath);
          return;
        } catch (err) {
          console.error('Error renderizando fórmula con KaTeX:', err);
        }
      }

      // Fallback si KaTeX falla
      const delim = item.display ? '$$' : '$';
      html = html.split(item.id).join(`${delim}${item.formula}${delim}`);
    });

    return html;
  },

  /**
   * Ejecuta el análisis de KaTeX sobre un contenedor del DOM como respaldo adicional.
   */
  renderMath(domElement) {
    if (!domElement) return;

    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(domElement, this.katexOptions);
      } catch (err) {
        console.error('Error durante el renderizado de KaTeX:', err);
      }
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
      const regexSoluciones = /(?:^|\n)(?:#{2,3}\s*(?:✍️\s*)?(?:[0-9]+\.\s*)?(?:Ejercicios\s+Resueltos|Desarrollo|Soluci[oó]n(?:es)?|Detailed\s+Solutions|An[aá]lisis\s+Sint[aá]ctico|Resoluci[oó]n))/i;
      const match = rawMarkdown.match(regexSoluciones);
      if (match && match.index !== undefined) {
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

    // Renderizamos las fórmulas de KaTeX residuales
    this.renderMath(container);
  }
};