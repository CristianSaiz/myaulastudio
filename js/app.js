// ==========================================================================
// Orquestador Principal de la Aplicación (UI, Eventos y Estado Reactivo)
// ==========================================================================

// --------------------------------------------------------------------------
// 1. SELECTORES DEL DOM
// --------------------------------------------------------------------------
const subjectSelect = document.getElementById('subject');
const problemInput = document.getElementById('problemInput');
const problemLabel = document.getElementById('problemLabel');
const resolveBtn = document.getElementById('resolveBtn');
const solutionContainer = document.getElementById('solutionContainer');
const downloadStudentPdfBtn = document.getElementById('downloadStudentPdfBtn');
const downloadTeacherPdfBtn = document.getElementById('downloadTeacherPdfBtn');
const newExerciseBtn = document.getElementById('newExerciseBtn');

// Selectores del Modal de Licencia
const licenseModal = document.getElementById('licenseModal');
const licenseInput = document.getElementById('licenseInput');
const activateLicenseBtn = document.getElementById('activateLicenseBtn');
const licenseError = document.getElementById('licenseError');
const licenseBadge = document.getElementById('licenseBadge');

// Modo de resolución (Flash / Pro)
const modeRadios = document.querySelectorAll('input[name="engineMode"]');
const modeHelperText = document.getElementById('modeHelperText');

// Archivos adjuntos
const imageInput = document.getElementById('imageInput');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const fileCountBadge = document.getElementById('fileCountBadge');

// Logo academia
const academyLogoInput = document.getElementById('academyLogoInput');
const logoPreviewContainer = document.getElementById('logoPreviewContainer');
const logoPreviewImg = document.getElementById('logoPreviewImg');
const removeLogoBtn = document.getElementById('removeLogoBtn');

// Portada / Datos de academia
const academyNameInput = document.getElementById('academyName');
const academySloganInput = document.getElementById('academySlogan');
const academyCourseInput = document.getElementById('academyCourse');
const coverTitleInput = document.getElementById('coverTitle');
const includeCoverCheckbox = document.getElementById('includeCover');

const educationLevelSelect = document.getElementById('educationLevel');

const LEVEL_COURSE_SUGGESTIONS = {
  primaria: 'Educación Primaria',
  eso: 'Secundaria (ESO)',
  bachillerato: '2º Bachillerato · Ciencias',
  universidad: 'Grado Universitario'
};

// --------------------------------------------------------------------------
// 2. ESTADO LOCAL
// --------------------------------------------------------------------------
let uploadedFiles = [];          // [{ name, mimeType, base64, previewUrl }]
let lastResolvedMarkdown = sessionStorage.getItem('myaulastudio_last_solution') || null;

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
 * Comprime y reescala imágenes en el navegador mediante Canvas antes de enviar.
 * Reduce fotos de móvil (8-15 MB) a ~300 KB manteniendo nitidez matemática.
 * Si el archivo es un PDF, se lee directamente sin alteración.
 */
function processUploadedFile(file) {
  return new Promise((resolve, reject) => {
    // Si es PDF, lectura directa a Base64
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          base64: reader.result.split(',')[1],
          mimeType: 'application/pdf',
          previewUrl: null
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    // Si es imagen, redimensionar y comprimir en memoria con Canvas
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600; // Resolución óptima para OCR y lectura de fórmulas
        let { width, height } = img;

        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Fondo blanco protector para evitar fondos negros en capturas con transparencia
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG al 82% de calidad (equilibrio perfecto nitidez/peso)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const base64 = dataUrl.split(',')[1];

        resolve({
          base64,
          mimeType: 'image/jpeg',
          previewUrl: dataUrl
        });
      };
      img.onerror = () => reject(new Error('No se pudo procesar la imagen para compresión.'));
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Renderiza la lista visual de archivos cargados y actualiza el contador.
 */
function updateFileListUI() {
  const count = uploadedFiles.length;
  const max = APP_CONFIG.MAX_FILES;

  // Adaptación reactiva de la etiqueta y placeholder según haya fotos o no
  if (problemLabel && problemInput) {
    if (count > 0) {
      problemLabel.textContent = 'Instrucciones o aclaraciones sobre los archivos (opcional)';
      problemInput.placeholder = 'Ej: «Resuelve solo el ejercicio 3b», «Usa el método de Gauss», o déjalo vacío para resolver todo...';
    } else {
      problemLabel.textContent = 'Enunciado o transcripción';
      problemInput.placeholder = 'Pega aquí el problema o transcribe el texto a resolver...';
    }
  }

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
// 3. PERSISTENCIA EN LOCALSTORAGE Y MODAL DE LICENCIA
// --------------------------------------------------------------------------
function loadSavedPreferences() {
  if (academyNameInput) academyNameInput.value = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.academyName) || '';
  if (academySloganInput) academySloganInput.value = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.academySlogan) || '';
  if (academyCourseInput) academyCourseInput.value = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.academyCourse) || '';
  if (coverTitleInput) coverTitleInput.value = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.coverTitle) || '';

  // Carga de logo persistente
  const logoKey = APP_CONFIG.STORAGE_KEYS?.academyLogo || 'edtech_academy_logo';
  const savedLogo = localStorage.getItem(logoKey);
  updateLogoUI(savedLogo);
}

function updateLogoUI(logoBase64) {
  if (!logoPreviewContainer || !logoPreviewImg || !removeLogoBtn) return;
  if (logoBase64) {
    logoPreviewImg.src = logoBase64;
    logoPreviewContainer.classList.remove('hidden');
    removeLogoBtn.classList.remove('hidden');
  } else {
    logoPreviewImg.src = '';
    logoPreviewContainer.classList.add('hidden');
    removeLogoBtn.classList.add('hidden');
    if (academyLogoInput) academyLogoInput.value = '';
  }
}

function saveAcademyPreferences() {
  if (academyNameInput) localStorage.setItem(APP_CONFIG.STORAGE_KEYS.academyName, academyNameInput.value.trim());
  if (academySloganInput) localStorage.setItem(APP_CONFIG.STORAGE_KEYS.academySlogan, academySloganInput.value.trim());
  if (academyCourseInput) localStorage.setItem(APP_CONFIG.STORAGE_KEYS.academyCourse, academyCourseInput.value.trim());
  if (coverTitleInput) localStorage.setItem(APP_CONFIG.STORAGE_KEYS.coverTitle, coverTitleInput.value.trim());
}

/**
 * Control visual seguro del Modal (inmune a conflictos CSS)
 */
function openLicenseModal() {
  if (!licenseModal) return;
  licenseModal.classList.remove('hidden');
  licenseModal.style.display = 'flex';
}

function closeLicenseModal() {
  if (!licenseModal) return;
  licenseModal.classList.add('hidden');
  licenseModal.style.display = 'none';
}

/**
 * Comprueba el estado de la licencia o periodo de prueba.
 * @returns {boolean} true si tiene permiso para resolver, false si está bloqueado.
 */
function checkLicenseStatus(showAlert = false) {
  const licenseKey = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.licenseKey);

  // Caso 1: No hay clave introducida -> Abrir modal
  if (!licenseKey) {
    if (licenseBadge) licenseBadge.classList.add('hidden');
    openLicenseModal();
    return false;
  }

  // Caso 2: Es una clave de prueba (prefijos DEMO- o TRIAL-)
  const isDemo = licenseKey.startsWith('DEMO-') || licenseKey.startsWith('TRIAL-');

  if (isDemo) {
    const usageCount = parseInt(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.trialUsageCount) || '0', 10);
    const maxUsage = APP_CONFIG.TRIAL_MAX_USAGE || 15;
    const usageLeft = Math.max(0, maxUsage - usageCount);

    if (usageCount >= maxUsage) {
      if (licenseBadge) {
        licenseBadge.classList.remove('hidden');
        licenseBadge.className = 'text-[10px] bg-red-500/80 border border-red-300 px-2 py-1 rounded-md text-white font-semibold cursor-pointer';
        licenseBadge.textContent = 'Prueba Agotada (0/15)';
      }
      openLicenseModal();
      if (showAlert) {
        alert(`Has alcanzado el límite de ${maxUsage} resoluciones de prueba de esta clave. Contacta para suscribirte.`);
      }
      return false;
    }

    closeLicenseModal();
    if (licenseBadge) {
      licenseBadge.classList.remove('hidden');
      licenseBadge.className = 'text-[10px] bg-emerald-500/80 hover:bg-emerald-600 border border-emerald-300 px-2.5 py-1 rounded-md text-white font-medium cursor-pointer transition-colors';
      licenseBadge.textContent = `Prueba: ${usageLeft}/${maxUsage} usos`;
      licenseBadge.title = 'Haz clic para cambiar o ver la clave';
    }
    return true;
  }

  // Caso 3: Licencia de centro completa / vitalicia -> Ilimitada
  closeLicenseModal();
  if (licenseBadge) {
    licenseBadge.classList.remove('hidden');
    licenseBadge.className = 'text-[10px] bg-indigo-500/60 hover:bg-indigo-500 border border-indigo-300/40 px-2.5 py-1 rounded-md text-white font-medium cursor-pointer transition-colors';
    licenseBadge.textContent = '✓ Licencia Activa';
    licenseBadge.title = 'Haz clic para ver o cambiar la clave';
  }
  return true;
}

// --------------------------------------------------------------------------
// 4. PREVISUALIZACIÓN REACTIVA EN TIEMPO REAL
// --------------------------------------------------------------------------
function renderCurrentView() {
  if (!solutionContainer) return;

  const includeCover = includeCoverCheckbox ? includeCoverCheckbox.checked : true;
  const subjectName = subjectSelect ? subjectSelect.options[subjectSelect.selectedIndex].text : '';

  const logoKey = APP_CONFIG.STORAGE_KEYS?.academyLogo || 'edtech_academy_logo';
  const savedLogo = localStorage.getItem(logoKey) || '';

  const coverHtml = PdfExporter.generateCoverHtml({
    includeCover: includeCover,
    academyName: academyNameInput?.value.trim(),
    academySlogan: academySloganInput?.value.trim(),
    academyCourse: academyCourseInput?.value.trim(),
    subjectName: subjectName,
    academyLogo: savedLogo,
    coverTitle: coverTitleInput?.value.trim()
  });

  // Caso A: Ya hay una solución resuelta
  if (lastResolvedMarkdown) {
    MarkdownMathRenderer.renderDocument(solutionContainer, lastResolvedMarkdown, coverHtml);
    if (newExerciseBtn) newExerciseBtn.classList.remove('hidden');
    if (downloadStudentPdfBtn) downloadStudentPdfBtn.classList.remove('hidden');
    if (downloadTeacherPdfBtn) downloadTeacherPdfBtn.classList.remove('hidden');
    return;
  }

  // Caso B: Estado inicial (antes de pulsar "Resolver")
  if (newExerciseBtn) newExerciseBtn.classList.add('hidden');
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
[academyNameInput, academySloganInput, academyCourseInput, coverTitleInput].forEach(el => {
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

// Reacción al cambiar la materia
if (subjectSelect) {
  subjectSelect.addEventListener('change', () => {
    renderCurrentView();
  });
}

// Reacción al cambiar el nivel educativo (auto-rellenado con edición libre)
if (educationLevelSelect && academyCourseInput) {
  educationLevelSelect.addEventListener('change', (e) => {
    const suggested = LEVEL_COURSE_SUGGESTIONS[e.target.value];
    if (suggested) {
      academyCourseInput.value = suggested;
      saveAcademyPreferences();
      renderCurrentView();
    }
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
        const processed = await processUploadedFile(file);
        uploadedFiles.push({
          name: file.name,
          mimeType: processed.mimeType,
          base64: processed.base64,
          previewUrl: processed.previewUrl
        });
      } catch (err) {
        console.error('Error al procesar el archivo:', err);
      }
    }

    imageInput.value = '';
    updateFileListUI();
  });
}

// Captura global de imágenes pegadas desde el portapapeles (Ctrl + V / Cmd + V)
window.addEventListener('paste', async (e) => {
  if (!e.clipboardData || !e.clipboardData.items) return;

  const items = Array.from(e.clipboardData.items);
  const imageItems = items.filter(item => item.type && item.type.startsWith('image/'));

  // Si no se está pegando ninguna imagen (ej: es texto para el problema), dejamos actuar al navegador
  if (imageItems.length === 0) return;

  const availableSlots = APP_CONFIG.MAX_FILES - uploadedFiles.length;

  if (availableSlots <= 0) {
    alert(`Has alcanzado el límite máximo de ${APP_CONFIG.MAX_FILES} archivos.`);
    e.preventDefault();
    return;
  }

  // Prevenimos comportamiento por defecto para no volcar datos binarios en inputs de texto
  e.preventDefault();

  if (imageItems.length > availableSlots) {
    alert(`Solo puedes añadir ${availableSlots} imagen(es) más. Límite: ${APP_CONFIG.MAX_FILES}.`);
  }

  const itemsToProcess = imageItems.slice(0, availableSlots);

  for (const item of itemsToProcess) {
    const file = item.getAsFile();
    if (!file) continue;

    const timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false }).replace(/:/g, '');
    const filename = `Captura_${timestamp}.png`;

    try {
      const base64 = await fileToBase64(file);
      uploadedFiles.push({
        name: filename,
        mimeType: file.type || 'image/png',
        base64: base64,
        previewUrl: `data:${file.type || 'image/png'};base64,${base64}`
      });
    } catch (err) {
      console.error('Error al procesar imagen del portapapeles:', err);
    }
  }

  updateFileListUI();
});

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

// Manejador para reiniciar el lienzo y preparar un nuevo ejercicio
if (newExerciseBtn) {
  newExerciseBtn.addEventListener('click', () => {
    // 1. Limpiar estado de la solución en memoria y en sessionStorage
    lastResolvedMarkdown = null;
    sessionStorage.removeItem('myaulastudio_last_solution');

    // 2. Limpiar texto de entrada y archivos adjuntos
    if (problemInput) problemInput.value = '';
    uploadedFiles = [];
    updateFileListUI();

    // 3. Restaurar la vista previa limpia de la portada y actualizar botón Resolver
    renderCurrentView();
    updateResolveButtonState();
  });
}

// Manejadores de Impresión Dual (Versión Alumno vs Versión Profesor)
if (downloadStudentPdfBtn) {
  downloadStudentPdfBtn.addEventListener('click', (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const subjectName = subjectSelect ? subjectSelect.options[subjectSelect.selectedIndex].text : '';
    const academyName = academyNameInput ? academyNameInput.value.trim() : '';
    const academyCourse = academyCourseInput ? academyCourseInput.value.trim() : '';
    const logoKey = APP_CONFIG.STORAGE_KEYS?.academyLogo || 'edtech_academy_logo';
    const academyLogo = localStorage.getItem(logoKey) || '';
    const coverTitle = coverTitleInput ? coverTitleInput.value.trim() : '';
    PdfExporter.triggerPrint('student', { subjectName, academyName, academyCourse, academyLogo, coverTitle });
  });
}

if (downloadTeacherPdfBtn) {
  downloadTeacherPdfBtn.addEventListener('click', (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const subjectName = subjectSelect ? subjectSelect.options[subjectSelect.selectedIndex].text : '';
    const academyName = academyNameInput ? academyNameInput.value.trim() : '';
    const academyCourse = academyCourseInput ? academyCourseInput.value.trim() : '';
    const logoKey = APP_CONFIG.STORAGE_KEYS?.academyLogo || 'edtech_academy_logo';
    const academyLogo = localStorage.getItem(logoKey) || '';
    const coverTitle = coverTitleInput ? coverTitleInput.value.trim() : '';
    PdfExporter.triggerPrint('teacher', { subjectName, academyName, academyCourse, academyLogo, coverTitle });
  });
}

// Abrir modal al pulsar en el badge del header
if (licenseBadge) {
  licenseBadge.addEventListener('click', () => {
    openLicenseModal();
    if (licenseInput) {
      const current = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.licenseKey);
      licenseInput.value = current || '';
    }
  });
}

// Botón Activar Licencia
if (activateLicenseBtn) {
  activateLicenseBtn.addEventListener('click', () => {
    const key = licenseInput ? licenseInput.value.trim() : '';
    if (!key) {
      if (licenseError) licenseError.classList.remove('hidden');
      return;
    }
    if (licenseError) licenseError.classList.add('hidden');

    const previousKey = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.licenseKey);
    // Si cambia de clave demo, reinicia el contador local para consultar al Worker de cero
    if (previousKey !== key) {
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.trialUsageCount, '0');
    }

    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.licenseKey, key);
    closeLicenseModal();
    checkLicenseStatus();
  });
}

// Manejador para cargar logotipo en Base64
if (academyLogoInput) {
  academyLogoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('El logotipo no debe superar los 2 MB.');
      academyLogoInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      const logoKey = APP_CONFIG.STORAGE_KEYS?.academyLogo || 'edtech_academy_logo';
      localStorage.setItem(logoKey, base64);
      updateLogoUI(base64);
      renderCurrentView();
    };
    reader.readAsDataURL(file);
  });
}

// Botón para eliminar logotipo y restaurar el icono escolar por defecto
if (removeLogoBtn) {
  removeLogoBtn.addEventListener('click', () => {
    const logoKey = APP_CONFIG.STORAGE_KEYS?.academyLogo || 'edtech_academy_logo';
    localStorage.removeItem(logoKey);
    updateLogoUI(null);
    renderCurrentView();
  });
}

// --------------------------------------------------------------------------
// 6. FLUJO PRINCIPAL: RESOLVER EJERCICIO
// --------------------------------------------------------------------------
if (resolveBtn) {
  resolveBtn.addEventListener('click', async () => {
    if (!checkLicenseStatus(true)) return;

    const subject = subjectSelect ? subjectSelect.value : 'math';
    const problem = problemInput ? problemInput.value.trim() : '';
    const engineMode = document.querySelector('input[name="engineMode"]:checked')?.value || 'flash';

    if (!problem && uploadedFiles.length === 0) {
      alert('Debes escribir un problema o adjuntar al menos un archivo.');
      return;
    }

    // Feedback visual de carga con cronómetro en tiempo real
    resolveBtn.disabled = true;
    if (downloadStudentPdfBtn) downloadStudentPdfBtn.classList.add('hidden');
    if (downloadTeacherPdfBtn) downloadTeacherPdfBtn.classList.add('hidden');

    const loaderSubtext = APP_CONFIG.MOCK_MODE
      ? '🔧 Modo Simulación (Coste 0) activado...'
      : engineMode === 'pro'
        ? 'Razonando paso a paso con rigor analítico profundo...'
        : 'Resolviendo ejercicio y maquetando gráficos paso a paso...';

    solutionContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center h-80 gap-3 text-indigo-600">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p class="text-sm font-semibold text-center">${loaderSubtext}</p>
        <div class="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
          <span class="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span id="loadingTimer" class="text-xs font-mono font-bold text-indigo-700">Tiempo: 0 s</span>
        </div>
        <p class="text-xs text-slate-400">Procesando ${uploadedFiles.length > 0 ? uploadedFiles.length + ' archivo(s)' : 'texto'}</p>
      </div>
    `;

    // Cronómetro en vivo
    let elapsedSeconds = 0;
    const intervalTimer = setInterval(() => {
      elapsedSeconds++;
      const timerDisplay = document.getElementById('loadingTimer');
      if (timerDisplay) {
        timerDisplay.textContent = `Tiempo: ${elapsedSeconds} s`;
      }
    }, 1000);

    try {
      const level = educationLevelSelect ? educationLevelSelect.value : 'bachillerato';
      const systemPrompt = getSystemPrompt(subject, level);

      // Petición a la API (o Mock según MOCK_MODE)
      const rawMarkdown = await ApiClient.resolveExercise({
        provider: 'gemini',
        apiKey: '',
        systemPrompt,
        userMessage: problem,
        files: uploadedFiles,
        engineMode,
        subject
      });

      // Guardamos en memoria y sessionStorage para sobrevivir a descargas de PDF
      lastResolvedMarkdown = rawMarkdown;
      sessionStorage.setItem('myaulastudio_last_solution', rawMarkdown);

      // Renderizamos la vista combinada
      renderCurrentView();

      // Si está en MOCK_MODE, simula el descuento localmente para desarrollo
      if (APP_CONFIG.MOCK_MODE) {
        const currentKey = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.licenseKey);
        const isDemo = currentKey && (currentKey.startsWith('DEMO-') || currentKey.startsWith('TRIAL-'));
        if (isDemo) {
          const count = parseInt(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.trialUsageCount) || '0', 10);
          localStorage.setItem(APP_CONFIG.STORAGE_KEYS.trialUsageCount, (count + 1).toString());
        }
      }

      // Refresca el estado de la licencia y el contador (sincronizado con KV desde api.js)
      checkLicenseStatus();

      // Limpieza automática de fotos/PDFs adjuntos tras resolver
      uploadedFiles = [];
      updateFileListUI();

    } catch (error) {
      console.error('Error al resolver ejercicio:', error);
      solutionContainer.innerHTML = `
        <div class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <strong>Error al generar la resolución:</strong>
          <p class="mt-1">${error.message}</p>
        </div>
      `;
    } finally {
      clearInterval(intervalTimer);
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
  checkLicenseStatus();
  setupContactLinks();
});

/**
 * Configura los enlaces de WhatsApp y Email leyendo los datos de APP_CONFIG.CONTACT
 */
function setupContactLinks() {
  const whatsappBtn = document.getElementById('whatsappContactBtn');
  const emailBtn = document.getElementById('emailContactBtn');
  const contact = APP_CONFIG.CONTACT;

  if (!contact) return;

  if (whatsappBtn && contact.whatsappPhone) {
    const text = encodeURIComponent(contact.whatsappMessage || '');
    whatsappBtn.href = `https://wa.me/${contact.whatsappPhone}?text=${text}`;
  }

  if (emailBtn && contact.email) {
    const subject = encodeURIComponent(contact.emailSubject || '');
    const body = encodeURIComponent(contact.emailBody || '');
    emailBtn.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
  }
}

// Llamada inmediata de sincronización
updateResolveButtonState();