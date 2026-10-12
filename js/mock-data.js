// ==========================================================================
// Datos Simulados (Mock Data) para Desarrollo a Coste Cero
// Estructura: 2. Enunciados Completos ➔ 3. Ejercicios Resueltos con SVG
// ==========================================================================

const MOCK_RESPONSES = {
  // ------------------------------------------------------------------------
  // Caso de Prueba: Matemáticas y Ciencias (Test de KaTeX + Gráfica SVG)
  // Ejercicio oficial U.I.B. 2019: Estudio y Representación de Funciones
  // ------------------------------------------------------------------------
  math: `## 📋 Cuaderno de Enunciados

> **Instrucciones:** Lee con atención el enunciado. Desarrolla analíticamente cada apartado justificando la teoría aplicada y realiza el boceto gráfico en el intervalo indicado.

### Ejercicio 1 (U.I.B. 2019)
Dada la función polinómica real definida por:
$$f(x) = x^3 - 3x - 2$$

Se pide:
1. Calcular los máximos y mínimos relativos de la función.
2. Determinar los intervalos de crecimiento y de decrecimiento (monotonía).
3. Elaborar una tabla de valores notables y hacer un boceto detallado de su gráfica para $x \\in [-3, 3]$.

<div class="page-break"></div>

## ✍️ Ejercicios Resueltos Paso a Paso

---

### Resolución del Ejercicio 1 (U.I.B. 2019)

#### 1. Cálculo de Máximos y Mínimos Relativos
La función $f(x)$ es polinómica de grado 3, por lo que es continua y derivable en todo $\\mathbb{R}$.

Calculamos su primera derivada para hallar los puntos singulares (críticos):
$$f'(x) = 3x^2 - 3$$

Igualamos a cero la primera derivada:
$$3x^2 - 3 = 0 \\implies 3x^2 = 3 \\implies x^2 = 1 \\implies x = \\pm 1$$

Para clasificar los extremos relativos, empleamos el criterio de la **segunda derivada**:
$$f''(x) = 6x$$

* **En $x = -1$:**
  $$f''(-1) = 6(-1) = -6 < 0 \\implies \\text{Existe un Máximo Relativo}$$
  Calculamos su ordenada sustituyendo en la función original:
  $$f(-1) = (-1)^3 - 3(-1) - 2 = -1 + 3 - 2 = 0$$
  Punto del máximo: **$M(-1, 0)$**.

* **En $x = 1$:**
  $$f''(1) = 6(1) = 6 > 0 \\implies \\text{Existe un Mínimo Relativo}$$
  Calculamos su ordenada:
  $$f(1) = 1^3 - 3(1) - 2 = 1 - 3 - 2 = -4$$
  Punto del mínimo: **$m(1, -4)$**.

---

#### 2. Intervalos de Monotonía (Crecimiento y Decrecimiento)
Los puntos críticos $x = -1$ y $x = 1$ dividen el dominio en tres intervalos. Evaluamos el signo de $f'(x)$ en cada uno:

* Para $x \\in (-\\infty, -1)$: Tomamos $x = -2 \\implies f'(-2) = 3(-2)^2 - 3 = 9 > 0 \\implies$ **Estrictamente Creciente**.
* Para $x \\in (-1, 1)$: Tomamos $x = 0 \\implies f'(0) = 3(0)^2 - 3 = -3 < 0 \\implies$ **Estrictamente Decreciente**.
* Para $x \\in (1, +\\infty)$: Tomamos $x = 2 \\implies f'(2) = 3(2)^2 - 3 = 9 > 0 \\implies$ **Estrictamente Creciente**.

Acotando al intervalo solicitado $[-3, 3]$:
* **Crecimiento:** $[-3, -1) \\cup (1, 3]$
* **Decrecimiento:** $(-1, 1)$

---

#### 3. Tabla de Puntos Notables y Representación Gráfica (SVG)

| $x$ | $f(x) = x^3 - 3x - 2$ | Significado Geométrico |
| :---: | :---: | :--- |
| **$-3$** | $-20$ | Extremo izquierdo del intervalo |
| **$-1$** | $0$ | **Máximo relativo** y corte eje X |
| **$0$** | $-2$ | Corte con el eje Y $(0, -2)$ |
| **$1$** | $-4$ | **Mínimo relativo** |
| **$2$** | $0$ | Raíz / Corte con el eje X $(2, 0)$ |
| **$3$** | $16$ | Extremo derecho del intervalo |

<div class="my-6 flex flex-col items-center not-prose">
<svg viewBox="0 0 500 340" class="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-sm p-2" xmlns="http://www.w3.org/2000/svg">
<defs>
<pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
<path d="M 25 0 L 0 0 0 25" fill="none" stroke="#f1f5f9" stroke-width="1" />
</pattern>
</defs>
<rect width="100%" height="100%" fill="url(#grid)" />
<line x1="30" y1="170" x2="470" y2="170" stroke="#64748b" stroke-width="1.8" />
<polygon points="475,170 467,166 467,174" fill="#64748b" />
<text x="475" y="162" font-size="12" fill="#475569" font-family="sans-serif" font-weight="bold">X</text>
<line x1="250" y1="320" x2="250" y2="25" stroke="#64748b" stroke-width="1.8" />
<polygon points="250,20 246,28 254,28" fill="#64748b" />
<text x="258" y="24" font-size="12" fill="#475569" font-family="sans-serif" font-weight="bold">Y</text>
<text x="100" y="186" font-size="10" fill="#94a3b8" text-anchor="middle">-3</text>
<text x="150" y="186" font-size="10" fill="#94a3b8" text-anchor="middle">-2</text>
<text x="200" y="186" font-size="10" fill="#94a3b8" text-anchor="middle">-1</text>
<text x="300" y="186" font-size="10" fill="#94a3b8" text-anchor="middle">1</text>
<text x="350" y="186" font-size="10" fill="#94a3b8" text-anchor="middle">2</text>
<text x="400" y="186" font-size="10" fill="#94a3b8" text-anchor="middle">3</text>
<path d="M 100,290 C 140,240 175,170 200,170 C 225,170 275,195 300,195 C 325,195 365,170 400,60" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" />
<circle cx="200" cy="170" r="5" fill="#dc2626" />
<text x="195" y="156" font-size="11" fill="#b91c1c" font-family="sans-serif" font-weight="bold" text-anchor="end">Máx (-1, 0)</text>
<circle cx="250" cy="182" r="4" fill="#64748b" />
<text x="262" y="186" font-size="10" fill="#64748b" font-family="sans-serif">(0, -2)</text>
<circle cx="300" cy="195" r="5" fill="#dc2626" />
<text x="308" y="212" font-size="11" fill="#b91c1c" font-family="sans-serif" font-weight="bold">Mín (1, -4)</text>
<circle cx="350" cy="170" r="4" fill="#059669" />
<text x="350" y="160" font-size="10" fill="#047857" font-family="sans-serif" text-anchor="middle">(2, 0)</text>
<text x="405" y="55" font-size="11" fill="#1d4ed8" font-family="sans-serif" font-style="italic">f(x) = x³ - 3x - 2</text>
</svg>
<span class="text-[11px] text-slate-400 mt-1 italic">Boceto gráfico vectorial de la función cúbica en el intervalo [-3, 3]</span>
</div>

> **Solución Final Ejercicio 1:**
> * **Máximo Relativo:** $(-1, 0)$
> * **Mínimo Relativo:** $(1, -4)$
> * **Monotonía en $[-3, 3]$:** Creciente en $[-3, -1) \\cup (1, 3]$ y decreciente en $(-1, 1)$.`,

  // ------------------------------------------------------------------------
  // Caso de Prueba: Lengua Castellana
  // ------------------------------------------------------------------------
  spanish: `## 📋 Cuaderno de Enunciados

### Oración para Análisis
Analiza sintáctica y morfológicamente la siguiente oración compuesta:
*«Los alumnos que prepararon el examen de acceso con dedicación obtuvieron una calificación sobresaliente.»*

<div class="page-break"></div>

## ✍️ Ejercicios Resueltos Paso a Paso

### 1. Esquema y Desglose Sintáctico
* **Tipo de Oración:** Oración compleja por subordinación adjetiva (de relativo explicativa/especificativa).
* **Sujeto:** *Los alumnos que prepararon el examen de acceso con dedicación* (Sintagma Nominal).
  * **Actualizador:** *Los* (artículo determinado).
  * **Núcleo:** *alumnos* (sustantivo común).
  * **Complemento del Nombre (Adyacente):** Proposición Subordinada Adjetiva (*que prepararon el examen de acceso con dedicación*).
    * **Nexo / Sujeto subordinado:** *que* (pronombre relativo).
    * **Núcleo verbal:** *prepararon*.
    * **Complemento Directo (CD):** *el examen de acceso* (SN).
    * **Complemento Circunstancial de Modo (CCM):** *con dedicación* (S. Prep).
* **Predicado:** *obtuvieron una calificación sobresaliente* (Sintagma Verbal, Predicado Verbal).
  * **Núcleo verbal:** *obtuvieron*.
  * **Complemento Directo (CD):** *una calificación sobresaliente* (SN).

> **Solución Final:** Oración bimembre, compleja, enunciativa afirmativa y transitiva.`,

  // ------------------------------------------------------------------------
  // Caso de Prueba: Inglés
  // ------------------------------------------------------------------------
  english: `## 📋 Cuaderno de Enunciados

### Exercises
Complete the sentences with the correct grammatical form:
1. *If they (study) harder last term, they (pass) the official Cambridge exam.*
2. *By the time the teacher arrived, the students already (finish) the assignment.*

<div class="page-break"></div>

## ✍️ Ejercicios Resueltos Paso a Paso

### Exercise 1: Third Conditional
* **Solución:** *If they **had studied** harder last term, they **would have passed** the official Cambridge exam.*
* **Explicación:** Se emplea el tercer condicional para expresar hipótesis imposibles sobre el pasado:
  $$\\text{If} + \\text{Past Perfect}, \\quad \\text{Subject} + \\text{would have} + \\text{Past Participle}$$

### Exercise 2: Past Perfect vs. Past Simple
* **Solución:** *By the time the teacher arrived, the students already **had finished** the assignment.*
* **Explicación:** La acción de terminar la tarea ocurrió con anterioridad a la llegada del profesor, por lo que exige Past Perfect.`
};

/**
 * Devuelve la respuesta simulada según la asignatura seleccionada.
 */
function getMockResponse(subject) {
  return MOCK_RESPONSES[subject] || MOCK_RESPONSES.math;
}