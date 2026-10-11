// ==========================================================================
// Orquestador Principal de la Aplicación (UI, Eventos y Estado Reactivo)
// ==========================================================================

// --------------------------------------------------------------------------
// 1. SELECTORES DEL DOM
// --------------------------------------------------------------------------
const subjectSelect = document.getElementById('subject');
const problemInput = document.getElementById('problemInput');
const resolveBtn = document.getElementById('resolveBtn');
const solutionContainer = document.getElementById('solutionContainer');
const downloadStudentPdfBtn = document.getElementById('downloadStudentPdfBtn');
const downloadTeacherPdfBtn = document.getElementById('downloadTeacherPdfBtn');

// Modo de resolución (Flash / Pro)
const modeRadios = document.querySelectorAll('input[name="engineMode"]');
const modeHelperText = document.getElementById('modeHelperText');

// Archivos adjuntos
const imageInput = document.getElementById('imageInput');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const fileCountBadge = document.getElementById('fileCountBadge');

// Portada / Datos de academia
const academyNameInput = document.getElementById('academyName');
const academySloganInput = document.getElementById('academySlogan');
const academyCourseInput = document.getElementById('academyCourse');
const includeCoverCheckbox = document.getElementById('includeCover');

// --------------------------------------------------------------------------
// 2. ESTADO LOCAL
// --------------------------------------------------------------------------
let uploadedFiles = [];          // [{ name, mimeType, base64, previewUrl }]
let lastResolvedMarkdown = null; // Almacena la solución generada para no perderla al editar la portada

/**
 * Valida si el botón "Resolver" debe habilitarse según el contenido.
 */
function updateResolveButtonState() {
  if (!resolveBtn) return;
  const hasText = problemInput && problemInput.value.trim().length > 0;
  const hasFiles = uploadedFiles.length > 0;
  
  resolveBtn.disabled = !(hasText || hasFiles);
}

/**
 * Convierte un archivo File a Base64 puro.
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Renderiza la lista visual de archivos cargados y actualiza el contador.
 */
function updateFileListUI() {
  const count = uploadedFiles.length;
  const max = APP_CONFIG.MAX_FILES;

  if (fileCountBadge) {
    fileCountBadge.textContent = `${count} / ${max}`;
    if (count === max) {
      fileCountBadge.className = 'text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800';
    } else if (count > 0) {
      fileCountBadge.className = 'text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700';
    } else {
      fileCountBadge.className = 'text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700';
    }
  }

  if (imageInput) {
    imageInput.disabled = (count >= max);
  }

  if (!imagePreviewContainer) return;
  imagePreviewContainer.innerHTML = '';

  if (count === 0) {
    imagePreviewContainer.classList.add('hidden');
    updateResolveButtonState();
    return;
  }

  imagePreviewContainer.classList.remove('hidden');

  uploadedFiles.forEach((file, index) => {
    const card = document.createElement('div');
    card.className = 'flex items-center justify-between gap-2 p-2 border border-slate-200 rounded-lg bg-white shadow-xs';

    const info = document.createElement('div');
    info.className = 'flex items-center gap-2 overflow-hidden flex-1';

    if (file.mimeType === 'application/pdf') {
      info.innerHTML = `
        <span class="w-8 h-8 bg-red-100 text-red-600 font-bold rounded flex items-center justify-center text-xs shrink-0">PDF</span>
        <span class="text-xs text-slate-700 truncate font-medium" title="${file.name}">${file.name}</span>
      `;
    } else {
      info.innerHTML = `
        <img src="${file.previewUrl}" class="w-8 h-8 rounded object-cover border border-slate-200 shrink-0" alt="Vista previa">
        <span class="text-xs text-slate-700 truncate font-medium" title="${file.name}">${file.name}</span>
      `;
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'text-xs text-slate-400 hover:text-red-600 font-bold px-2 py-1 transition-colors';
    deleteBtn.textContent = '✕';
    deleteBtn.title = 'Eliminar archivo';
    deleteBtn.onclick = () => {
      uploadedFiles.splice(index, 1);
      updateFileListUI();
    };

    card.appendChild(info);
    card.appendChild(deleteBtn);
    imagePreviewContainer.appendChild(card);
  });

  updateResolveButtonState();
}

// --------------------------------------------------------------------------
// 3. PERSISTENCIA EN LOCALSTORAGE
// --------------------------------------------------------------------------
function loadSavedPreferences() {
  if (academyNameInput) {
    academyNameInput.value = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.academyName) || APP_CONFIG.DEFAULTS.academyName;
  }
  if (academySloganInput) {
    academySloganInput.value = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.academySlogan) || APP_CONFIG.DEFAULTS.academySlogan;
  }
  if (academyCourseInput) {
    academyCourseInput.value = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.academyCourse) || APP_CONFIG.DEFAULTS.academyCourse;
  }
}

function saveAcademyPreferences() {
  if (academyNameInput) localStorage.setItem(APP_CONFIG.STORAGE_KEYS.academyName, academyNameInput.value.trim());
  if (academySloganInput) localStorage.setItem(APP_CONFIG.STORAGE_KEYS.academySlogan, academySloganInput.value.trim());
  if (academyCourseInput) localStorage.setItem(APP_CONFIG.STORAGE_KEYS.academyCourse, academyCourseInput.value.trim());
}

// --------------------------------------------------------------------------
// 4. PREVISUALIZACIÓN REACTIVA EN TIEMPO REAL
// --------------------------------------------------------------------------
/**
 * Renderiza el visor derecho (#solutionContainer).
 * Si hay solución previa, refresca la portada y mantiene el markdown resuelto.
 * Si no hay solución previa, muestra la portada en vivo o el placeholder vacío.
 */
function renderCurrentView() {
  if (!solutionContainer) return;

  const includeCover = includeCoverCheckbox ? includeCoverCheckbox.checked : true;
  const subjectName = subjectSelect ? subjectSelect.options[subjectSelect.selectedIndex].text : '';

  const coverHtml = PdfExporter.generateCoverHtml({
    includeCover: includeCover,
    academyName: academyNameInput?.value.trim(),
    academySlogan: academySloganInput?.value.trim(),
    academyCourse: academyCourseInput?.value.trim(),
    subjectName: subjectName
  });

  // Caso A: Ya hay una solución resuelta
  if (lastResolvedMarkdown) {
    MarkdownMathRenderer.renderDocument(solutionContainer, lastResolvedMarkdown, coverHtml);
    if (downloadStudentPdfBtn) downloadStudentPdfBtn.classList.remove('hidden');
    if (downloadTeacherPdfBtn) downloadTeacherPdfBtn.classList.remove('hidden');
    return;
  }

  // Caso B: Estado inicial (antes de pulsar "Resolver")
  if (downloadStudentPdfBtn) downloadStudentPdfBtn.classList.add('hidden');
  if (downloadTeacherPdfBtn) downloadTeacherPdfBtn.classList.add('hidden');

  if (includeCover) {
    solutionContainer.innerHTML = `
      ${coverHtml}
      <div class="mt-4 p-5 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-xl bg-white/70">
        <p class="font-semibold text-slate-600 mb-1">👀 Vista Previa de la Portada en Tiempo Real</p>
        <p>Escribe tu problema a la izquierda o adjunta fotos/PDFs y pulsa <strong>«Resolver Ejercicio»</strong> para generar los enunciados y soluciones.</p>
      </div>
    `;
  } else {
    solutionContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center h-80 text-center p-6 text-slate-400">
        <div class="w-12 h-12 rounded-full bg-slate-200/60 flex items-center justify-center text-xl mb-3">📄</div>
        <p class="text-sm font-semibold text-slate-600">Portada desactivada</p>
        <p class="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
          Los ejercicios y soluciones se maquetarán directamente a partir de la primera página sin portada editorial.
        </p>
      </div>
    `;
  }
}

// --------------------------------------------------------------------------
// 5. MANEJADORES DE EVENTOS REACTIVOS
// --------------------------------------------------------------------------

// Reacción en tiempo real al escribir en los datos de la portada
[academyNameInput, academySloganInput, academyCourseInput].forEach(el => {
  if (el) {
    el.addEventListener('input', () => {
      saveAcademyPreferences();
      renderCurrentView();
    });
  }
});

// Reacción al marcar / desmarcar la portada
if (includeCoverCheckbox) {
  includeCoverCheckbox.addEventListener('change', () => {
    renderCurrentView();
  });
}

// Reacción al cambiar la materia (actualiza el subtítulo de la portada)
if (subjectSelect) {
  subjectSelect.addEventListener('change', () => {
    renderCurrentView();
  });
}

// Validación reactiva del campo de enunciado
if (problemInput) {
  ['input', 'change', 'keyup', 'paste'].forEach(evt => {
    problemInput.addEventListener(evt, () => setTimeout(updateResolveButtonState, 0));
  });
}

// Subida de archivos
if (imageInput) {
  imageInput.addEventListener('change', async (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;

    const availableSlots = APP_CONFIG.MAX_FILES - uploadedFiles.length;

    if (availableSlots <= 0) {
      alert(`Has alcanzado el límite máximo de ${APP_CONFIG.MAX_FILES} archivos.`);
      imageInput.value = '';
      return;
    }

    if (selected.length > availableSlots) {
      alert(`Solo puedes añadir ${availableSlots} archivo(s) más. Límite: ${APP_CONFIG.MAX_FILES}.`);
      imageInput.value = '';
      return;
    }

    for (const file of selected) {
      try {
        const base64 = await fileToBase64(file);
        uploadedFiles.push({
          name: file.name,
          mimeType: file.type || 'application/pdf',
          base64: base64,
          previewUrl: file.type.startsWith('image/') ? `data:${file.type};base64,${base64}` : null
        });
      } catch (err) {
        console.error('Error al procesar el archivo:', err);
      }
    }

    imageInput.value = '';
    updateFileListUI();
  });
}

// Selector de velocidad Flash / Pro
modeRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (!modeHelperText) return;
    if (e.target.value === 'flash') {
      modeHelperText.textContent = 'Resolución instantánea (~3 s). Ideal para ESO, Bachillerato y Selectividad.';
      modeHelperText.className = 'text-[11px] text-slate-400 mt-1 leading-tight';
    } else {
      modeHelperText.textContent = 'Análisis extendido (~15-20 s). Para problemas abstractos, teoremas u olimpiadas.';
      modeHelperText.className = 'text-[11px] text-indigo-700 mt-1 leading-tight font-medium';
    }
  });
});

// Manejadores de Impresión Dual (Versión Alumno vs Versión Profesor)
if (downloadStudentPdfBtn) {
  downloadStudentPdfBtn.addEventListener('click', () => {
    const subjectName = subjectSelect ? subjectSelect.options[subjectSelect.selectedIndex].text : '';
    const academyName = academyNameInput ? academyNameInput.value.trim() : '';
    const academyCourse = academyCourseInput ? academyCourseInput.value.trim() : '';
    PdfExporter.triggerPrint('student', { subjectName, academyName });
  });
}

if (downloadTeacherPdfBtn) {
  downloadTeacherPdfBtn.addEventListener('click', () => {
    const subjectName = subjectSelect ? subjectSelect.options[subjectSelect.selectedIndex].text : '';
    const academyName = academyNameInput ? academyNameInput.value.trim() : '';
    const academyCourse = academyCourseInput ? academyCourseInput.value.trim() : '';
    PdfExporter.triggerPrint('teacher', { subjectName, academyName });
  });
}

// --------------------------------------------------------------------------
// 6. FLUJO PRINCIPAL: RESOLVER EJERCICIO
// --------------------------------------------------------------------------
if (resolveBtn) {
  resolveBtn.addEventListener('click', async () => {
    const subject = subjectSelect ? subjectSelect.value : 'math';
    const problem = problemInput ? problemInput.value.trim() : '';
    const engineMode = document.querySelector('input[name="engineMode"]:checked')?.value || 'flash';

    if (!problem && uploadedFiles.length === 0) {
      alert('Debes escribir un problema o adjuntar al menos un archivo.');
      return;
    }

    // Feedback visual de carga
    resolveBtn.disabled = true;
    if (downloadStudentPdfBtn) downloadStudentPdfBtn.classList.add('hidden');
    if (downloadTeacherPdfBtn) downloadTeacherPdfBtn.classList.add('hidden');

    const loaderSubtext = APP_CONFIG.MOCK_MODE
      ? '🔧 Modo Simulación (Coste 0) activado...'
      : engineMode === 'pro'
        ? 'Razonando paso a paso con máxima profundidad (~15-20 s)...'
        : 'Resolviendo ejercicio con velocidad Flash (~3 s)...';

    solutionContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center h-80 gap-3 text-indigo-600">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p class="text-sm font-semibold">${loaderSubtext}</p>
        <p class="text-xs text-slate-400">Procesando ${uploadedFiles.length > 0 ? uploadedFiles.length + ' archivo(s)' : 'texto'}</p>
      </div>
    `;

    try {
      const systemPrompt = getSystemPrompt(subject);

      // Petición a la API (o Mock)
      const rawMarkdown = await ApiClient.resolveExercise({
        provider: 'gemini',
        apiKey: '', // Se gestionará por el worker / mock
        systemPrompt,
        userMessage: problem,
        files: uploadedFiles,
        engineMode,
        subject
      });

      // Guardamos en memoria para permitir editar la portada después sin perder la solución
      lastResolvedMarkdown = rawMarkdown;

      // Renderizamos la vista combinada
      renderCurrentView();

    } catch (error) {
      console.error('Error al resolver ejercicio:', error);
      solutionContainer.innerHTML = `
        <div class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <strong>Error al generar la resolución:</strong>
          <p class="mt-1">${error.message}</p>
        </div>
      `;
    } finally {
      updateResolveButtonState();
    }
  });
}

// --------------------------------------------------------------------------
// 7. INICIALIZACIÓN
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadSavedPreferences();
  renderCurrentView();
  updateResolveButtonState();
});

// Llamada inmediata de sincronización
updateResolveButtonState();