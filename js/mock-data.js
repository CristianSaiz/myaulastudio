// ==========================================================================
// Datos Simulados (Mock Data) para Desarrollo a Coste Cero
// Estructura: 2. Enunciados Completos ➔ 3. Ejercicios Resueltos
// ==========================================================================

const MOCK_RESPONSES = {
  // ------------------------------------------------------------------------
  // Caso de Prueba: Matemáticas y Ciencias (Test de Estrés de KaTeX)
  // ------------------------------------------------------------------------
  math: `## 📋 Cuaderno de Enunciados

> **Instrucciones:** Lee detenidamente los ejercicios antes de comenzar. Desarrolla todos los pasos y justifica tus respuestas analíticamente.

### Ejercicio 1
Dada la función racional definida por:
$$f(x) = \\frac{2x^2 - 3x + 1}{x - 2}$$

Se pide:
1. Determinar el dominio de definición, así como sus asíntotas verticales y oblicuas.
2. Calcular la primitiva o integral indefinida de la función:
$$I = \\int \\frac{2x^2 - 3x + 1}{x - 2} \\, dx$$

### Ejercicio 2
Calcula el valor del parámetro $k \\in \\mathbb{R}$ para que la matriz $A$ no tenga inversa:
$$A = \\begin{pmatrix} 1 & k & 0 \\\\ 2 & 1 & 1 \\\\ 0 & 3 & -1 \\end{pmatrix}$$

<div class="page-break"></div>

## ✍️ Ejercicios Resueltos Paso a Paso

---

### Resolución del Ejercicio 1

#### 1. Dominio y Cálculo de Asíntotas
El denominador se anula en la raíz de la ecuación $x - 2 = 0 \\implies x = 2$.
Por tanto, el dominio de definición es:
$$\\text{Dom}(f) = \\mathbb{R} \\setminus \\{2\\}$$

* **Asíntota Vertical:**
Evaluamos los límites laterales en el punto de discontinuidad $x = 2$:
$$\\lim_{x \\to 2^+} \\frac{2x^2 - 3x + 1}{x - 2} = +\\infty, \\quad \\lim_{x \\to 2^-} \\frac{2x^2 - 3x + 1}{x - 2} = -\\infty$$
Existe una asíntota vertical en la recta $x = 2$.

* **Asíntota Oblicua ($y = mx + n$):**
Realizamos la división polinómica del numerador entre el denominador:
$$\\frac{2x^2 - 3x + 1}{x - 2} = (2x + 1) + \\frac{3}{x - 2}$$
El cociente lineal determina directamente la asíntota oblicua:
$$y = 2x + 1$$

#### 2. Cálculo de la Integral Indefinida
Aprovechando la descomposición obtenida en la división, separamos la integral en sumandos directos:
$$I = \\int \\left( 2x + 1 + \\frac{3}{x - 2} \\right) dx$$

Aplicando la linealidad de la integral:
$$I = 2\\int x \\, dx + \\int 1 \\, dx + 3\\int \\frac{1}{x - 2} \\, dx = x^2 + x + 3 \\ln |x - 2| + C$$

> **Solución Final Ejercicio 1:**
> * Asíntotas: Vertical en $x = 2$, Oblicua en $y = 2x + 1$.
> * Integral: $I = x^2 + x + 3 \\ln |x - 2| + C, \\quad C \\in \\mathbb{R}$

---

### Resolución del Ejercicio 2

Para que una matriz cuadrada no admita matriz inversa, su determinante debe ser nulo ($|A| = 0$).
Calculamos el determinante de $A$ por la regla de Sarrus o desarrollo por la primera fila:
$$|A| = \\begin{vmatrix} 1 & k & 0 \\\\ 2 & 1 & 1 \\\\ 0 & 3 & -1 \\end{vmatrix} = 1 \\cdot (1 \\cdot (-1) - 3 \\cdot 1) - k \\cdot (2 \\cdot (-1) - 0 \\cdot 1) + 0$$

$$|A| = 1 \\cdot (-1 - 3) - k \\cdot (-2) = -4 + 2k$$

Igualamos a cero para encontrar el valor crítico:
$$-4 + 2k = 0 \\implies 2k = 4 \\implies k = 2$$

> **Solución Final Ejercicio 2:**
> La matriz $A$ **no tiene inversa** si y solo si $k = 2$.`,

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