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

// Selectores del Modal de Licencia y Trial
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
  if (academyNameInput) academyNameInput.value = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.academyName) || '';
  if (academySloganInput) academySloganInput.value = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.academySlogan) || '';
  if (academyCourseInput) academyCourseInput.value = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.academyCourse) || '';

  // Carga de logo persistente
  const logoKey = APP_CONFIG.STORAGE_KEYS?.academyLogo || 'myaulastudio_academy_logo';
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
}

/**
 * Control visual seguro del Modal (evita conflictos entre .flex y .hidden de Tailwind)
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

  // Caso 2: Es la licencia de prueba (Trial por 15 usos)
  if (licenseKey === APP_CONFIG.DEMO_LICENSE_KEY) {
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
        alert('Has alcanzado el límite de 15 resoluciones de prueba. Introduce una clave de centro para continuar.');
      }
      return false;
    }

    // Trial activo dentro de límites -> Cerrar modal y mostrar badge
    closeLicenseModal();
    if (licenseBadge) {
      licenseBadge.classList.remove('hidden');
      licenseBadge.className = 'text-[10px] bg-emerald-500/80 hover:bg-emerald-600 border border-emerald-300 px-2.5 py-1 rounded-md text-white font-medium cursor-pointer transition-colors';
      licenseBadge.textContent = `Prueba: ${usageLeft}/${maxUsage} usos`;
      licenseBadge.title = 'Haz clic para cambiar o introducir clave de centro';
    }
    return true;
  }

  // Caso 3: Licencia de centro completa / vitalicia -> Cerrar modal y mostrar badge
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
/**
 * Renderiza el visor derecho (#solutionContainer).
 * Si hay solución previa, refresca la portada y mantiene el markdown resuelto.
 * Si no hay solución previa, muestra la portada en vivo o el placeholder vacío.
 */
function renderCurrentView() {
  if (!solutionContainer) return;

  const includeCover = includeCoverCheckbox ? includeCoverCheckbox.checked : true;
  const subjectName = subjectSelect ? subjectSelect.options[subjectSelect.selectedIndex].text : '';

  const logoKey = APP_CONFIG.STORAGE_KEYS?.academyLogo || 'myaulastudio_academy_logo';
  const savedLogo = localStorage.getItem(logoKey) || '';

  const coverHtml = PdfExporter.generateCoverHtml({
    includeCover: includeCover,
    academyName: academyNameInput?.value.trim(),
    academySlogan: academySloganInput?.value.trim(),
    academyCourse: academyCourseInput?.value.trim(),
    subjectName: subjectName,
    academyLogo: savedLogo
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

// Reacción al cambiar el nivel educativo (auto-rellena la portada pero deja editarlo libremente)
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
  downloadStudentPdfBtn.addEventListener('click', (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const subjectName = subjectSelect ? subjectSelect.options[subjectSelect.selectedIndex].text : '';
    const academyName = academyNameInput ? academyNameInput.value.trim() : '';
    const academyCourse = academyCourseInput ? academyCourseInput.value.trim() : '';
    const logoKey = APP_CONFIG.STORAGE_KEYS?.academyLogo || 'myaulastudio_academy_logo';
    const academyLogo = localStorage.getItem(logoKey) || '';
    PdfExporter.triggerPrint('student', { subjectName, academyName, academyCourse, academyLogo });
  });
}

if (downloadTeacherPdfBtn) {
  downloadTeacherPdfBtn.addEventListener('click', (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const subjectName = subjectSelect ? subjectSelect.options[subjectSelect.selectedIndex].text : '';
    const academyName = academyNameInput ? academyNameInput.value.trim() : '';
    const academyCourse = academyCourseInput ? academyCourseInput.value.trim() : '';
    const logoKey = APP_CONFIG.STORAGE_KEYS?.academyLogo || 'myaulastudio_academy_logo';
    const academyLogo = localStorage.getItem(logoKey) || '';
    PdfExporter.triggerPrint('teacher', { subjectName, academyName, academyCourse, academyLogo });
  });
}

// Abrir modal al pulsar en el badge del header
if (licenseBadge) {
  licenseBadge.addEventListener('click', () => {
    openLicenseModal();
    if (licenseInput) {
      const current = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.licenseKey);
      licenseInput.value = current === APP_CONFIG.DEMO_LICENSE_KEY ? '' : (current || '');
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
      const logoKey = APP_CONFIG.STORAGE_KEYS?.academyLogo || 'myaulastudio_academy_logo';
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
    const logoKey = APP_CONFIG.STORAGE_KEYS?.academyLogo || 'myaulastudio_academy_logo';
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

    // Mensaje descriptivo según el modo
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

    // ⏱️ Cronómetro en vivo: avanza cada segundo
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
      sessionStorage.setItem('myaulastudio_last_solution', rawMarkdown);

      // Renderizamos la vista combinada
      renderCurrentView();

      // Si está en modo prueba, descontar 1 uso
      const currentKey = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.licenseKey);
      if (currentKey === APP_CONFIG.DEMO_LICENSE_KEY) {
        const count = parseInt(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.trialUsageCount) || '0', 10);
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.trialUsageCount, (count + 1).toString());
        checkLicenseStatus();
      }

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