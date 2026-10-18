// ==========================================================================
// Módulo de Generación de Portada y Exportación a PDF / Impresión
// ==========================================================================

const PdfExporter = {
  /**
   * Sanitiza cualquier cadena de texto antes de insertarla en el DOM.
   * Evita inyecciones HTML y roturas visuales por caracteres reservados (&, <, >, ", ').
   * @param {*} value - Valor de entrada
   * @returns {string} Texto escapado seguro para innerHTML
   */
  escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[ch]));
  },

  /**
   * Obtiene los valores predeterminados de la aplicación de forma defensiva
   * en caso de que APP_CONFIG no esté cargado en el scope global.
   * @returns {Object} Valores por defecto
   */
  getDefaults() {
    return (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.DEFAULTS) ? APP_CONFIG.DEFAULTS : {
      academyName: 'Mates, Amor y Magia',
      academySlogan: 'Donde las matemáticas cobran sentido',
      academyCourse: '2º Bachillerato · Ciencias'
    };
  },

  /**
   * Genera el bloque HTML de la portada editorial A4 para pantalla e impresión.
   * Se construye sin sangrías iniciales de más de 3 espacios para evitar que
   * analizadores como marked.js lo interpreten como bloque de código preformateado.
   *
   * @param {Object} options
   * @param {boolean} [options.includeCover=true] - Si es false, devuelve cadena vacía
   * @param {string} [options.academyName] - Nombre del centro o academia
   * @param {string} [options.academySlogan] - Lema o subtítulo descriptivo
   * @param {string} [options.academyCourse] - Curso o nivel formativo
   * @param {string} [options.subjectName] - Nombre de la materia
   * @param {string} [options.academyLogo] - Logotipo en Base64 o URL (opcional)
   * @returns {string} Fragmento HTML listo para inyectar
   */
  generateCoverHtml({ includeCover = true, academyName, academySlogan, academyCourse, subjectName, academyLogo } = {}) {
    if (!includeCover) return '';

    const defaults = this.getDefaults();
    const esc = this.escapeHtml;

    const nombre = esc(academyName?.trim() || defaults.academyName);
    const lema = esc(academySlogan?.trim() || defaults.academySlogan);
    const curso = esc(academyCourse?.trim() || defaults.academyCourse);
    const materia = esc(subjectName?.trim() || 'Material Docente');

    // Recupera el logo de los parámetros o del almacenamiento local
    const logoKey = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.STORAGE_KEYS?.academyLogo) 
      ? APP_CONFIG.STORAGE_KEYS.academyLogo 
      : 'myaulastudio_academy_logo';
    const logoSrc = academyLogo || (typeof localStorage !== 'undefined' ? localStorage.getItem(logoKey) : '') || '';

    // Si hay logo, renderiza una etiqueta img maquetada; de lo contrario, muestra el icono escolar tradicional
    const logoMarkup = logoSrc
      ? `<img src="${logoSrc}" alt="Logo" style="max-height: 48px; max-width: 120px; object-fit: contain; border-radius: 6px; background: rgba(255,255,255,0.95); padding: 4px; display: inline-block; vertical-align: middle;">`
      : `<span style="font-size: 28px; line-height: 1; display: inline-block; vertical-align: middle;">🏫</span>`;

    return [
      '<section class="portada not-prose">',
      '<div class="cover-top">',
      `  <div class="cover-brand" style="display: flex; align-items: center; gap: 12px;">${logoMarkup}<span>${nombre}</span></div>`,
      '  <div class="cover-slogan-top">MATERIAL DE ESTUDIO</div>',
      '</div>',
      '<div class="cover-main">',
      '<p class="cover-kicker cover-kicker-profesor">Guía Didáctica · Solucionario Paso a Paso</p>',
      '<p class="cover-kicker cover-kicker-alumno">Cuaderno de Trabajo y Ejercicios</p>',
      '<h1 class="cover-title cover-title-profesor">Ejercicios Resueltos</h1>',
      '<h1 class="cover-title cover-title-alumno">Cuaderno de Ejercicios</h1>',
      `<p class="cover-subtitle">${materia}</p>`,
      '<div>',
      `  <span class="cover-tag">${curso}</span>`,
      '  <span class="cover-tag cover-tag-badge tag-profesor">✓ CON SOLUCIONES</span>',
      '  <span class="cover-tag cover-tag-badge tag-alumno">ENUNCIADOS</span>',
      '</div>',
      '</div>',
      '<div class="cover-bottom">',
      `<em>${lema}</em>`,
      '<span class="cover-note">Uso Docente</span>',
      '</div>',
      '</section>'
    ].join('') + '\n\n';
  },

  /**
   * Genera el nombre del archivo normalizado:
   * Nombre_Centro_Asignatura_Curso_Tipo.pdf
   */
  buildFileName({ academyName = '', subjectName = '', academyCourse = '', type = 'Soluciones' } = {}) {
    const sanitize = (str) =>
      String(str ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
        .replace(/[^a-zA-Z0-9]/g, '_')   // Sustituye espacios y símbolos por guiones bajos
        .replace(/_+/g, '_')             // Evita guiones dobles
        .replace(/^_|_$/g, '');          // Limpia guiones al inicio o final

    const centro = sanitize(academyName) || 'Centro';
    const asignatura = sanitize(subjectName) || 'Asignatura';
    const curso = sanitize(academyCourse) || 'Curso';
    const sufijo = sanitize(type);

    return `${centro}_${asignatura}_${curso}_${sufijo}`;
  },

  /**
   * Dispara el diálogo de impresión nativo configurando el título sugerido para el PDF.
   */
  triggerPrint(mode = 'teacher', meta = {}) {
    const originalTitle = document.title;
    const isStudent = mode === 'student';

    // 1. Alternar clase CSS para ocultar/mostrar soluciones
    if (isStudent) {
      document.body.classList.add('mode-student-print');
    } else {
      document.body.classList.remove('mode-student-print');
    }

    // 2. Construir el nombre exacto del archivo
    const tipo = isStudent ? 'Enunciados' : 'Soluciones';
    document.title = this.buildFileName({
      academyName: meta.academyName,
      subjectName: meta.subjectName,
      academyCourse: meta.academyCourse,
      type: tipo
    });

    // 3. Limpieza al terminar o cancelar la impresión
    const cleanup = () => {
      document.body.classList.remove('mode-student-print');
      document.title = originalTitle;
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup, { once: true });

    try {
      window.print();
    } finally {
      setTimeout(cleanup, 400);
    }
  },

  // Mantener compatibilidad si se llama al nombre antiguo
  triggerNativePrint(meta = {}, mode = 'teacher') {
    this.triggerPrint(mode, meta);
  },

  /**
   * Exportador auxiliar vía html2pdf.js en caso de requerir descarga binaria
   * directa sin abrir la interfaz de impresión del sistema.
   *
   * @param {HTMLElement|string} element - Elemento o ID del contenedor a exportar
   * @param {Object} [options] - Parámetros de configuración del PDF
   * @returns {Promise<void>}
   */
  async exportWithHtml2Pdf(element, options = {}) {
    if (typeof html2pdf === 'undefined') {
      console.warn('html2pdf.js no se encuentra disponible. Usando impresión nativa.');
      this.triggerNativePrint();
      return;
    }

    const targetElement = typeof element === 'string' ? document.getElementById(element) : element;
    if (!targetElement) {
      console.error('PdfExporter: No se encontró el elemento objetivo para exportar a PDF.');
      return;
    }

    const filename = options.filename || `${this.buildFileName({ subjectName: options.subjectName, academyName: options.academyName })}.pdf`;

    const config = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    return html2pdf().set(config).from(targetElement).save();
  }
};