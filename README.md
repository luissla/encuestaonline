# Sistema de Encuestas Antigravity (Student Feedback Hub)

¡Bienvenido al **Sistema de Encuestas de Antigravity**! Esta es una aplicación web moderna, interactiva y premium desarrollada en HTML5, CSS3 (Vanilla) y JavaScript puro (ES6). Su objetivo principal es recopilar la opinión y valoraciones de los estudiantes sobre el curso de Antigravity mediante un diseño tecnológico futurista inspirado en la estética cyberpunk (rojo, negro y amarillo) y un potente panel de administración para visualizar métricas en tiempo real.

---

## 🚀 Funcionalidades Principales

### 1. Formulario de Encuesta Interactivo
Una interfaz de usuario limpia y adaptada a dispositivos móviles con transiciones fluidas para responder a las siguientes preguntas:
*   **Identificador de Estudiante (`id_estudiante`):** Campo de texto libre para introducir la matrícula única del alumno, protegido contra inyecciones XSS.
*   **Nivel de Satisfacción General (`nivel_satisfaccion`):** Escala del 1 al 5 (desde *Muy insatisfecho* hasta *Muy satisfecho*) mediante selectores circulares interactivos de alta fidelidad que cambian de color y brillan según la selección.
*   **Claridad del Contenido (`claridad_contenido`):** Escala de valoración del 1 al 5 (desde *Muy poco claro* hasta *Muy claro*).
*   **Aplicabilidad Práctica (`aplicabilidad_practica`):** Escala de valoración del 1 al 5 (desde *Nada aplicable* hasta *Muy aplicable*).
*   **Comentarios Adicionales (`comentarios_adicionales`):** Área de texto libre con contador de caracteres dinámico en tiempo real (límite de 500 caracteres).

### 2. Panel de Control del Profesor (Dashboard)
Una pestaña independiente y de fácil acceso donde el profesor puede consultar en tiempo real el rendimiento y la opinión general del curso:
*   **Contadores de Resumen:** Visualización directa del número total de respuestas y las medias aritméticas para cada métrica del curso.
*   **Gráficos Visuales CSS:** Barras de progreso dinámicas con gradientes rojo y amarillo que muestran el promedio de las valoraciones de manera visual e interactiva.
*   **Tabla Detallada:** Un registro tabular que lista cada una de las encuestas enviadas, incluyendo el ID del estudiante, las valoraciones con iconos de estrella, el comentario completo y la marca de tiempo (fecha y hora exacta).
*   **Datos Mock/Semilla:** Para que el panel no luzca vacío en el primer inicio, se autogeneran 4 respuestas realistas y detalladas en el almacenamiento local.

### 3. Integración con Base de Datos Airtable y Persistencia
*   **Base de Datos Airtable Remota:** Integración directa por API (mediante peticiones asíncronas `fetch` en JavaScript y tokens de acceso personal PAT). Al enviar la encuesta, los datos se guardan instantáneamente en tiempo real en la tabla `tblR2zgLDitg4ny6k` de la base `appJZVrvXqvmHGogp` de Airtable.
*   **Notificación por Email Automatizada (n8n Webhook):** Al procesar con éxito el guardado en base de datos, la aplicación realiza una llamada HTTP `POST` adicional al webhook de n8n (`https://n8n.srv1130039.hstgr.cloud/webhook/bf901bcb-f3e4-4469-ab82-3f5b11325b29`). Este trigger inicia una automatización en la nube para enviar correos de notificación inmediatos con el resumen detallado del alumno.
*   **Sincronización y Consulta en Vivo:** Al iniciar la aplicación o al cambiar a la pestaña de **Panel de Control**, la aplicación descarga todas las valoraciones acumuladas en Airtable para computar las estadísticas y rellenar la tabla de respuestas en tiempo real.
*   **Respaldo Local (LocalStorage):** Las respuestas se respaldan en el almacenamiento local del navegador como caché de alto rendimiento, evitando retrasos innecesarios en cargas consecutivas y actuando como fallback en escenarios sin conectividad.
*   **Exportación a JSON:** Un botón de acción rápida permite al docente descargar el conjunto completo de encuestas recuperadas de Airtable en formato estructurado `.json`.
*   **Registro y Diagnóstico de Errores (Error Log):** Sistema premium que captura en caliente cualquier error de red, fallo del servidor, CORS o desconexión en las llamadas a Airtable/n8n. Almacena de forma persistente los últimos 50 eventos en LocalStorage e incluye un botón **"Descargar Log"** en el Panel de Control para descargar el archivo estructurado `error_log_antigravity.txt`.
*   **Recibo de Éxito:** Al completar el guardado en Airtable, un modal elegante con efecto cristal (glassmorphism) presenta al alumno un resumen/recibo detallado de su participación.

---

## 🎨 Paleta de Colores y Diseño Estético

Siguiendo el flujo del diseño tecnológico y moderno, la interfaz cuenta con:
*   **Negro Profundo (`#08080b` / `#121217`):** Fondo principal ultra oscuro que mejora la legibilidad, reduce la fatiga visual y confiere un aire premium.
*   **Rojo Neón (`#ff2e63`):** Usado para los acentos principales, elementos activos seleccionados, botones primarios y decoraciones flotantes.
*   **Amarillo Ciberpunk (`#ffc93c`):** Usado para resaltar valoraciones positivas (4 y 5 estrellas), títulos del panel de control y estados de hover interactivos.
*   **Efectos Visuales:** Glassmorphism en las tarjetas principales con bordes translúcidos y sombras de luz difusa en rojo y amarillo.

---

## 📂 Estructura del Proyecto

El proyecto está diseñado de forma modular y minimalista en una sola carpeta, sin dependencias complejas de compilación:

```text
GA_S8_ProyectoEncuesta/
├── index.html       # Estructura semántica de la página web (SPA).
├── style.css        # Sistema de diseño, layouts responsivos, variables CSS y animaciones.
├── app.js           # Lógica interactiva, control de estados, cálculo de métricas y almacenamiento.
└── README.md        # Documentación oficial del proyecto (este archivo).
```

---

## 🛠️ Requisitos Técnicos

1.  **Navegador Web:** Funciona en cualquier navegador de última generación compatible con HTML5, CSS Grid/Flexbox y ES6 (Chrome, Edge, Firefox, Safari, Opera).
2.  **Conexión a Internet:** Requerida únicamente para cargar las tipografías modernas de **Google Fonts** (`Outfit` e `Inter`) y la librería de iconos de **FontAwesome** desde sus respectivos CDNs.

---

## 💻 Instrucciones de Instalación y Ejecución

Al ser una aplicación web de front-end puro, no requiere de una base de datos de servidor ni instalaciones complejas de `npm`:

### Opción A (La más sencilla)
1.  Descarga o clona la carpeta `GA_S8_ProyectoEncuesta`.
2.  Haz doble clic en el archivo `index.html` para abrirlo directamente en tu navegador web favorito.

### Opción B (Uso con un Servidor Local)
Para disfrutar de la mejor experiencia y evitar restricciones de directivas CORS locales de algunos navegadores antiguos:
1.  Abre la terminal en la carpeta del proyecto.
2.  Ejecuta un servidor estático rápido:
    ```bash
    # Si tienes Node.js instalado:
    npx http-server .
    
    # O si utilizas Python:
    python -m http.server 8000
    ```
3.  Abre en tu navegador la dirección `http://localhost:8080` (Node) o `http://localhost:8000` (Python).

---

## 📊 Ejemplo de Estructura de Datos (JSON Exportado)

Cuando exportas los datos desde el Panel de Control, obtendrás un archivo estructurado de la siguiente forma:

```json
[
    {
        "id_estudiante": "EST-2026-08",
        "nivel_satisfaccion": 5,
        "claridad_contenido": 5,
        "aplicabilidad_practica": 4,
        "comentarios_adicionales": "El curso de Antigravity superó mis expectativas. La metodología práctica y los ejemplos paso a paso son excelentes.",
        "timestamp": "17/05/2026 10:30"
    }
]
```

---

*Desarrollado para la **Academia Antigravity**, garantizando una interfaz interactiva de alta gama para estudiantes y docentes.*
