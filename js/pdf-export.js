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
  generateCoverHtml({ includeCover = true, academyName, academySlogan, academyCourse, subjectName, subject, academyLogo, coverTitle } = {}) {
    if (!includeCover) return '';

    const defaults = this.getDefaults();
    const esc = this.escapeHtml;

    // Detección automática del idioma inglés
    const isEnglish = subject === 'english' || (subjectName && /ingl[eé]s|english/i.test(subjectName));

    const nombre = esc(academyName?.trim() || defaults.academyName);

    // 1. Lema: si el usuario no escribió uno específico, adaptar al idioma
    const defaultSlogan = isEnglish ? 'Excellence and rigor in education' : defaults.academySlogan;
    const lema = esc(academySlogan?.trim() || defaultSlogan);

    // 2. Curso: si es el valor por defecto y está en inglés, adaptar etiqueta
    let cursoTexto = academyCourse?.trim() || defaults.academyCourse;
    if (isEnglish && (!academyCourse || cursoTexto === defaults.academyCourse || cursoTexto === '2º Bachillerato · Ciencias')) {
      cursoTexto = '2nd Baccalaureate';
    }
    const curso = esc(cursoTexto);

    // 3. Nombre de la Asignatura en la portada
    let materiaTexto = subjectName?.trim() || (isEnglish ? 'English' : 'Material Docente');
    if (isEnglish && (materiaTexto.toLowerCase() === 'inglés' || materiaTexto.toLowerCase() === 'ingles')) {
      materiaTexto = 'English';
    }
    const materia = esc(materiaTexto);

    // 4. Títulos y etiquetas adaptados al idioma
    const customTitle = coverTitle ? esc(coverTitle.trim()) : '';
    const tituloProfesor = customTitle || (isEnglish ? 'Solved Exercises' : (defaults.coverTitle || 'Ejercicios Resueltos'));
    const tituloAlumno = customTitle || (isEnglish ? 'Exercise Booklet' : 'Cuaderno de Ejercicios');

    const sloganTop = isEnglish ? 'STUDY MATERIAL' : 'MATERIAL DE ESTUDIO';
    const kickerProfesor = isEnglish ? "Teacher's Guide · Step-by-Step Solutions" : 'Guía Didáctica · Solucionario Paso a Paso';
    const kickerAlumno = isEnglish ? 'Student Practice Booklet &amp; Exercises' : 'Cuaderno de Trabajo y Ejercicios';
    const tagProfesor = isEnglish ? '✓ ANSWER KEY INCLUDED' : '✓ CON SOLUCIONES';
    const tagAlumno = isEnglish ? 'QUESTIONS ONLY' : 'ENUNCIADOS';
    const noteBottom = isEnglish ? 'Educational Use' : 'Uso Docente';
    
    // Recupera el logo de los parámetros o del almacenamiento local
    const logoKey = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.STORAGE_KEYS?.academyLogo) 
      ? APP_CONFIG.STORAGE_KEYS.academyLogo 
      : 'myaulastudio_academy_logo';
    const rawLogo = (academyLogo || (typeof localStorage !== 'undefined' ? localStorage.getItem(logoKey) : '') || '').trim();

    // Validación estricta de Data URI para impedir inyecciones javascript: o URLs remotas
    const isValidDataImage = /^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(rawLogo);
    const safeLogoSrc = isValidDataImage ? esc(rawLogo) : '';

    const logoMarkup = safeLogoSrc
      ? `<img src="${safeLogoSrc}" alt="Logo" style="max-height: 48px; max-width: 120px; object-fit: contain; border-radius: 6px; background: rgba(255,255,255,0.95); padding: 4px; display: inline-block; vertical-align: middle;">`
      : `<span style="font-size: 28px; line-height: 1; display: inline-block; vertical-align: middle;">🏫</span>`;

    return [
      '<section class="portada not-prose">',
      '<div class="cover-top">',
      `  <div class="cover-brand" style="display: flex; align-items: center; gap: 12px;">${logoMarkup}<span>${nombre}</span></div>`,
      `  <div class="cover-slogan-top">${sloganTop}</div>`,
      '</div>',
      '<div class="cover-main">',
      `  <p class="cover-kicker cover-kicker-profesor">${kickerProfesor}</p>`,
      `  <p class="cover-kicker cover-kicker-alumno">${kickerAlumno}</p>`,
      `  <h1 class="cover-title cover-title-profesor">${tituloProfesor}</h1>`,
      `  <h1 class="cover-title cover-title-alumno">${tituloAlumno}</h1>`,
      `  <p class="cover-subtitle">${materia}</p>`,
      '  <div>',
      `    <span class="cover-tag">${curso}</span>`,
      `    <span class="cover-tag cover-tag-badge tag-profesor">${tagProfesor}</span>`,
      `    <span class="cover-tag cover-tag-badge tag-alumno">${tagAlumno}</span>`,
      '  </div>',
      '</div>',
      '<div class="cover-bottom">',
      `  <em>${lema}</em>`,
      `  <span class="cover-note">${noteBottom}</span>`,
      '</div>',
      '</section>'
    ].join('') + '\n\n';
  },

  // ========================================================================
  // TÍTULO DEL DOCUMENTO (/Title del PDF) Y SESIÓN DE IMPRESIÓN
  // ========================================================================

  _printSession: null,      // { mode, title, originalTitle, printReturned, afterprintSeen, external }
  _eventsBound: false,
  _metaProvider: null,

  /**
   * Registra una función que devuelve los datos actuales del formulario
   * ({ subjectName, coverTitle, ... }). Se usa cuando la impresión NO
   * la lanzan nuestros botones (Ctrl+P, menú del navegador).
   */
  setMetaProvider(fn) {
    this._metaProvider = typeof fn === 'function' ? fn : null;
    this._bindPrintEvents();
  },

  /** Combina proveedor + meta explícita; el título personalizado se lee del DOM si falta. */
  resolveMeta(meta = {}) {
    let fromProvider = {};
    try { fromProvider = (this._metaProvider && this._metaProvider()) || {}; } catch (_) { /* noop */ }
    const merged = { ...fromProvider, ...meta };
    if (merged.coverTitle === undefined || merged.coverTitle === null) {
      merged.coverTitle = document.getElementById('coverTitle')?.value || '';
    }
    return merged;
  },

  /**
   * Genera el título/nombre de archivo.
   *   Con tema:  "Junio 2016 - Soluciones"  /  "Junio 2016 - Enunciados"
   *   Sin tema:  "Matemáticas - Soluciones" /  "Ejercicios - Soluciones"
   * Conserva tildes y ñ (el /Title del PDF es Unicode); solo elimina los
   * caracteres prohibidos en nombres de archivo y los de control.
   */
  buildFileName({ coverTitle = '', type = 'Soluciones', subjectName = '' } = {}) {
    const clean = (str) =>
      String(str ?? '')
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .replace(/[\\/:*?"<>|]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const base = clean(coverTitle) || clean(subjectName) || 'Ejercicios';
    return `${base} - ${clean(type)}`;
  },

  _applyPrintState(session) {
    document.title = session.title;
    document.body.classList.toggle('mode-student-print', session.mode === 'student');
  },

  _endSession(session) {
    if (this._printSession !== session) return;
    document.body.classList.remove('mode-student-print');
    document.title = session.originalTitle;
    this._printSession = null;
  },

  /**
   * Una sesión termina cuando el navegador ya no va a volver a renderizar:
   *  - Impresión lanzada por la app: cuando window.print() ha vuelto Y se ha visto afterprint
   *    (Chromium: print() bloquea hasta cerrar el diálogo y afterprint puede llegar ANTES;
   *     Firefox: print() vuelve al instante y afterprint llega al cerrar).
   *  - Impresión externa (Ctrl+P): en afterprint; si el usuario cambia ajustes en la
   *    vista previa, beforeprint vuelve a crear la sesión.
   */
  _maybeFinish(session) {
    const done = session.external
      ? session.afterprintSeen
      : (session.afterprintSeen && session.printReturned);
    if (done) this._endSession(session);
  },

  _bindPrintEvents() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    window.addEventListener('beforeprint', () => {
      // Cada (re)renderizado de la vista previa pasa por aquí: reafirmamos título y modo.
      if (!this._printSession) {
        const meta = this.resolveMeta();
        this._printSession = {
          mode: 'teacher',
          title: this.buildFileName({ coverTitle: meta.coverTitle, subjectName: meta.subjectName, type: 'Soluciones' }),
          originalTitle: document.title,
          printReturned: false,
          afterprintSeen: false,
          external: true,
        };
      }
      this._applyPrintState(this._printSession);
    });

    window.addEventListener('afterprint', () => {
      const s = this._printSession;
      if (!s) return;
      s.afterprintSeen = true;
      this._maybeFinish(s);
    });
  },

  /**
   * Lanza el diálogo de impresión con el /Title correcto.
   * @param {'teacher'|'student'} mode
   * @param {Object} meta - { subjectName, coverTitle, ... }
   */
  triggerPrint(mode = 'teacher', meta = {}) {
    this._bindPrintEvents();

    const resolved = this.resolveMeta(meta);
    const isStudent = mode === 'student';
    const title = this.buildFileName({
      coverTitle: resolved.coverTitle,
      subjectName: resolved.subjectName,
      type: isStudent ? 'Enunciados' : 'Soluciones',
    });

    // Si quedaba una sesión anterior colgada, la sustituimos conservando el título original.
    const originalTitle = this._printSession ? this._printSession.originalTitle : document.title;
    const session = {
      mode: isStudent ? 'student' : 'teacher',
      title,
      originalTitle,
      printReturned: false,
      afterprintSeen: false,
      external: false,
    };
    this._printSession = session;
    this._applyPrintState(session);

    // Damos tiempo a que el navegador propague el nuevo document.title (el proceso
    // principal lo recibe por IPC, de forma asíncrona) y a que se aplique la clase CSS.
    const settle = () => new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 250))));

    settle().then(() => {
      if (this._printSession !== session) return;
      try {
        this._applyPrintState(session);   // reafirmar justo antes de imprimir
        window.print();                   // Chromium: bloquea hasta cerrar el diálogo
      } catch (e) {
        console.error('PdfExporter: error al imprimir', e);
        this._endSession(session);
        return;
      }
      session.printReturned = true;
      this._maybeFinish(session);
    });
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

    const filename = options.filename || `${this.buildFileName({ coverTitle: options.coverTitle, subjectName: options.subjectName, type: options.type || 'Soluciones' })}.pdf`;

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