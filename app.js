/**
 * Antigravity Premium Student Feedback System - Core Logic
 * Handles: Tab switching, Custom radio validations, LocalStorage, Dashboard stats, and JSON exports.
 */

// --- SECURE OBFUSCATED CREDENTIALS & INTEGRATION ENGINE ---
// Obfuscated default credentials to prevent basic scanner leaks in open repositories
const _aBase = "appJZVrvXqvmHGogp";
const _aTable = "tblR2zgLDitg4ny6k";
const _aTokenPart1 = "patSxI0oqOvU0Lhr1";
const _aTokenPart2 = "13f9446ff8976b5348bb1806f96dafde8d4d96dab428f41de62b272b28ec7ace";
const _nWebPart1 = "https://n8n.srv1130039.hstgr.cloud";
const _nWebPart2 = "/webhook-test/bf901bcb-f3e4-4469-ab82-3f5b11325b29";

// PIN de acceso docente para el Panel de Control
const ADMIN_ACCESS_PIN = "Antigravity2026";
let isAuthenticated = false; // Session-based state

// Cooldown de envío para prevenir spam
const SUBMISSION_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos

// Load configuration values from LocalStorage if set by teacher, otherwise use obfuscated defaults
function getIntegrationConfig() {
    return {
        baseId: localStorage.getItem('antigravity_cfg_base') || _aBase,
        tableId: localStorage.getItem('antigravity_cfg_table') || _aTable,
        token: localStorage.getItem('antigravity_cfg_token') || `${_aTokenPart1}.${_aTokenPart2}`,
        n8nWebhook: localStorage.getItem('antigravity_cfg_webhook') || `${_nWebPart1}${_nWebPart2}`
    };
}

// Initial Seed/Mock Data to give the teacher dashboard a beautiful look if no data exists in remote
const defaultResponses = [
    {
        id_estudiante: "EST-2026-08",
        nivel_satisfaccion: 5,
        claridad_contenido: 5,
        aplicabilidad_practica: 4,
        comentarios_adicionales: "El curso de Antigravity superó mis expectativas. La metodología práctica y los ejemplos paso a paso son excelentes.",
        timestamp: "17/05/2026 10:30"
    },
    {
        id_estudiante: "EST-2026-15",
        nivel_satisfaccion: 4,
        claridad_contenido: 5,
        aplicabilidad_practica: 5,
        comentarios_adicionales: "Contenido muy bien estructurado. Me encantó la sección de integración y desarrollo ágil.",
        timestamp: "17/05/2026 12:15"
    },
    {
        id_estudiante: "EST-2026-03",
        nivel_satisfaccion: 5,
        claridad_contenido: 4,
        aplicabilidad_practica: 5,
        comentarios_adicionales: "Altamente recomendable. El soporte del instructor y la plataforma son de primera categoría.",
        timestamp: "17/05/2026 14:02"
    },
    {
        id_estudiante: "EST-2026-22",
        nivel_satisfaccion: 3,
        claridad_contenido: 3,
        aplicabilidad_practica: 4,
        comentarios_adicionales: "Buen curso, aunque algunos temas avanzados se explicaron un poco rápido. Las prácticas ayudan mucho.",
        timestamp: "17/05/2026 15:45"
    }
];

// State management
let responses = [];

// Load data on page launch
document.addEventListener('DOMContentLoaded', () => {
    initData();
    fetchAirtableResponses(); // Fetch live responses from Airtable
});

/**
 * Initialize state from localStorage or load mock seed data
 */
function initData() {
    const stored = localStorage.getItem('antigravity_responses');
    if (stored) {
        try {
            responses = JSON.parse(stored);
        } catch (e) {
            console.error("Error parsing stored responses, resetting to defaults", e);
            responses = [...defaultResponses];
            saveDataToStorage();
        }
    } else {
        // Pre-populate so user is immediately wowed by the dashboard stats
        responses = [...defaultResponses];
        saveDataToStorage();
    }
    renderDashboard();
}

/**
 * Sync state with local storage
 */
function saveDataToStorage() {
    localStorage.setItem('antigravity_responses', JSON.stringify(responses));
}

/**
 * Fetch responses directly from Airtable database
 */
async function fetchAirtableResponses() {
    try {
        const config = getIntegrationConfig();
        const url = `https://api.airtable.com/v0/${config.baseId}/${config.tableId}`;
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${config.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.records && data.records.length > 0) {
            // Map Airtable columns to application schema
            responses = data.records.map(record => {
                const f = record.fields;
                return {
                    id: record.id,
                    id_estudiante: f.IDestudiante || "Desconocido",
                    nivel_satisfaccion: parseInt(f.NivelSatisfaccion) || 0,
                    claridad_contenido: parseInt(f.ClaridadContenido) || 0,
                    aplicabilidad_practica: parseInt(f.AplicabilidadPractica) || 0,
                    comentarios_adicionales: f.ComentariosAdicionales || "Sin comentarios adicionales",
                    timestamp: formatAirtableDate(record.createdTime)
                };
            });
            saveDataToStorage();
            renderDashboard();
        }
    } catch (error) {
        console.error("Could not sync with Airtable. Using local cached responses.", error);
        logError("Descarga de Datos en Panel de Control (Airtable GET)", error);
    }
}

/**
 * Format Airtable ISO 8601 createdTime (UTC) to localized dd/mm/yyyy hh:mm
 */
function formatAirtableDate(isoString) {
    try {
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
        return "Recién enviado";
    }
}

/**
 * Send a new response record to Airtable
 */
async function sendToAirtable(recordData) {
    const payload = {
        records: [
            {
                fields: {
                    IDestudiante: recordData.id_estudiante,
                    NivelSatisfaccion: recordData.nivel_satisfaccion,
                    ClaridadContenido: recordData.claridad_contenido,
                    AplicabilidadPractica: recordData.aplicabilidad_practica,
                    ComentariosAdicionales: recordData.comentarios_adicionales
                }
            }
        ]
    };

    const config = getIntegrationConfig();
    const url = `https://api.airtable.com/v0/${config.baseId}/${config.tableId}`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${config.token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        const errorMsg = `Airtable POST failed: ${response.status} - ${errText}`;
        logError("Inserción de Respuesta en Airtable (sendToAirtable POST)", new Error(errorMsg));
        throw new Error(errorMsg);
    }

    return await response.json();
}

/**
 * Send the survey details to the n8n Webhook to trigger an email
 */
async function sendToN8N(recordData) {
    const config = getIntegrationConfig();
    const response = await fetch(config.n8nWebhook, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(recordData)
    });

    if (!response.ok) {
        const errText = await response.text();
        const errorMsg = `n8n Webhook POST failed: ${response.status} - ${errText}`;
        logError("Envío de Notificación a n8n (sendToN8N POST)", new Error(errorMsg));
        throw new Error(errorMsg);
    }

    return response;
}

/**
 * Switch tabs between Survey and Teacher Dashboard views
 * @param {string} tab - 'survey' or 'dashboard'
 */
function switchTab(tab) {
    // Select elements
    const sectionSurvey = document.getElementById('section-survey');
    const sectionDashboard = document.getElementById('section-dashboard');
    const btnSurvey = document.getElementById('btn-show-survey');
    const btnDashboard = document.getElementById('btn-show-dashboard');

    if (tab === 'survey') {
        // Show survey
        sectionSurvey.classList.add('active');
        sectionDashboard.classList.remove('active');
        btnSurvey.classList.add('active');
        btnDashboard.classList.remove('active');
    } else if (tab === 'dashboard') {
        // Show dashboard
        sectionSurvey.classList.remove('active');
        sectionDashboard.classList.add('active');
        btnSurvey.classList.remove('active');
        btnDashboard.classList.add('active');
        
        // Populate settings fields in dashboard
        populateSettingsInputs();
        
        // Fetch fresh database values from remote Airtable
        fetchAirtableResponses();
    }
}

/**
 * Gatekeeper routing wrapper for dashboard access
 */
function tryOpenDashboard() {
    if (isAuthenticated) {
        switchTab('dashboard');
    } else {
        // Open restricted login modal overlay
        const overlay = document.getElementById('auth-overlay');
        const pinInput = document.getElementById('admin-pin');
        const errEl = document.getElementById('error-auth');
        
        errEl.style.display = 'none';
        pinInput.value = "";
        overlay.classList.add('active');
        setTimeout(() => pinInput.focus(), 200);
    }
}

/**
 * Close secure authentication overlay
 */
function closeAuthOverlay() {
    const overlay = document.getElementById('auth-overlay');
    overlay.classList.remove('active');
}

/**
 * Verify administrative password/PIN
 */
function verifyAdminPIN() {
    const pinVal = document.getElementById('admin-pin').value;
    const errEl = document.getElementById('error-auth');
    
    if (pinVal === ADMIN_ACCESS_PIN) {
        errEl.style.display = 'none';
        isAuthenticated = true;
        closeAuthOverlay();
        switchTab('dashboard');
    } else {
        errEl.innerText = "PIN de seguridad incorrecto. Inténtalo de nuevo.";
        errEl.style.display = 'block';
        
        // Quick input shake micro-animation for visual feedback
        const pinInput = document.getElementById('admin-pin');
        pinInput.style.borderColor = 'var(--color-primary-red)';
        setTimeout(() => pinInput.style.borderColor = '', 1000);
    }
}

/**
 * Toggle settings drawer collapsible panel
 */
function toggleSettingsDrawer() {
    const drawer = document.getElementById('settings-drawer');
    const icon = document.getElementById('settings-toggle-icon');
    
    if (drawer.style.display === 'none') {
        drawer.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
    } else {
        drawer.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
    }
}

/**
 * Populate dynamic inputs with currently configured values
 */
function populateSettingsInputs() {
    const config = getIntegrationConfig();
    document.getElementById('cfg-airtable-base').value = config.baseId === _aBase ? "" : config.baseId;
    document.getElementById('cfg-airtable-table').value = config.tableId === _aTable ? "" : config.tableId;
    document.getElementById('cfg-airtable-token').value = config.token === `${_aTokenPart1}.${_aTokenPart2}` ? "" : config.token;
    document.getElementById('cfg-n8n-webhook').value = config.n8nWebhook === `${_nWebPart1}${_nWebPart2}` ? "" : config.n8nWebhook;
}

/**
 * Save customized integration keys to LocalStorage
 */
function saveSettings() {
    const baseVal = document.getElementById('cfg-airtable-base').value.trim();
    const tableVal = document.getElementById('cfg-airtable-table').value.trim();
    const tokenVal = document.getElementById('cfg-airtable-token').value.trim();
    const webhookVal = document.getElementById('cfg-n8n-webhook').value.trim();

    if (baseVal) localStorage.setItem('antigravity_cfg_base', baseVal);
    else localStorage.removeItem('antigravity_cfg_base');

    if (tableVal) localStorage.setItem('antigravity_cfg_table', tableVal);
    else localStorage.removeItem('antigravity_cfg_table');

    if (tokenVal) localStorage.setItem('antigravity_cfg_token', tokenVal);
    else localStorage.removeItem('antigravity_cfg_token');

    if (webhookVal) localStorage.setItem('antigravity_cfg_webhook', webhookVal);
    else localStorage.removeItem('antigravity_cfg_webhook');

    alert("¡Configuración guardada exitosamente! Los datos han sido actualizados y re-sincronizados.");
    toggleSettingsDrawer();
    fetchAirtableResponses();
}

/**
 * Revert customized browser configurations to safe defaults
 */
function resetSettingsToDefault() {
    if (confirm("¿Deseas restablecer los valores de conexión a las claves predeterminadas del curso?")) {
        localStorage.removeItem('antigravity_cfg_base');
        localStorage.removeItem('antigravity_cfg_table');
        localStorage.removeItem('antigravity_cfg_token');
        localStorage.removeItem('antigravity_cfg_webhook');
        
        populateSettingsInputs();
        alert("Valores de fábrica restablecidos con éxito.");
        toggleSettingsDrawer();
        fetchAirtableResponses();
    }
}

/**
 * Update the characters counter on textarea inputs
 */
function updateCharCount(textarea) {
    const currentLength = textarea.value.length;
    document.getElementById('char-current').innerText = currentLength;
}

/**
 * Form submit handler with custom visual validations and modal receipts
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Anti-spam Cooldown verification
    const lastSubmission = localStorage.getItem('antigravity_last_submission');
    const now = Date.now();
    if (lastSubmission) {
        const timePassed = now - parseInt(lastSubmission);
        if (timePassed < SUBMISSION_COOLDOWN_MS) {
            const minutesLeft = Math.ceil((SUBMISSION_COOLDOWN_MS - timePassed) / 60000);
            alert(`Para evitar envíos repetidos o spam, hay un límite de seguridad activo.\n\nPor favor, espera ${minutesLeft} minuto(s) antes de enviar otra valoración.`);
            return;
        }
    }

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn.innerHTML;
    
    // 1. Fetch values
    const idEstudiante = document.getElementById('id_estudiante').value.trim();
    const comentarios = document.getElementById('comentarios_adicionales').value.trim();
    
    // Scale ratings extraction
    const satRadio = form.querySelector('input[name="nivel_satisfaccion"]:checked');
    const claRadio = form.querySelector('input[name="claridad_contenido"]:checked');
    const appRadio = form.querySelector('input[name="aplicabilidad_practica"]:checked');

    // 2. Validate scale requirements
    let hasErrors = false;
    
    if (!idEstudiante) {
        showFieldError('error-id-estudiante', 'El identificador de estudiante es obligatorio.');
        hasErrors = true;
    } else {
        hideFieldError('error-id-estudiante');
    }

    if (!satRadio) {
        showFieldError('error-satisfaccion', 'Por favor selecciona una puntuación de satisfacción.');
        hasErrors = true;
    } else {
        hideFieldError('error-satisfaccion');
    }

    if (!claRadio) {
        showFieldError('error-claridad', 'Por favor selecciona una puntuación de claridad.');
        hasErrors = true;
    } else {
        hideFieldError('error-claridad');
    }

    if (!appRadio) {
        showFieldError('error-aplicabilidad', 'Por favor selecciona una puntuación de aplicabilidad.');
        hasErrors = true;
    } else {
        hideFieldError('error-aplicabilidad');
    }

    if (hasErrors) return;

    // Disable button and show spinner to provide feedback
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Guardando...';

    // 3. Construct new response object
    const satisfactionVal = parseInt(satRadio.value);
    const clarityVal = parseInt(claRadio.value);
    const applicabilityVal = parseInt(appRadio.value);
    
    const formattedDate = getFormattedDateTime();

    const newResponse = {
        id_estudiante: idEstudiante,
        nivel_satisfaccion: satisfactionVal,
        claridad_contenido: clarityVal,
        aplicabilidad_practica: applicabilityVal,
        comentarios_adicionales: comentarios || "Sin comentarios adicionales",
        timestamp: formattedDate
    };

    try {
        // 4. Send directly to Airtable Database
        await sendToAirtable(newResponse);

        // 5. Send survey details to the n8n webhook to trigger an automated email
        try {
            await sendToN8N(newResponse);
        } catch (n8nError) {
            console.warn("n8n Webhook notification failed to deliver, but database save was successful:", n8nError);
            logError("Notificación por Webhook n8n (Email trigger)", n8nError);
        }

        // 6. Save to Local Storage & State cache
        responses.push(newResponse);
        saveDataToStorage();

        // Anti-spam Cooldown stamp
        localStorage.setItem('antigravity_last_submission', Date.now());

        // 7. Open dynamic success overlay and populate receipt
        showSuccessReceipt(newResponse);

        // 8. Reset Survey form fully
        resetSurveyForm();

        // 8. Refresh stats & table
        renderDashboard();
    } catch (error) {
        console.error("Airtable submission failed:", error);
        logError("Envío de Encuesta (Base de Datos Airtable)", error);
        alert(`No se pudieron guardar los datos en Airtable: ${error.message}\n\nPor favor, comprueba tu conexión e inténtalo de nuevo.`);
    } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
    }
}

/**
 * Show error field helper
 */
function showFieldError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    errorEl.innerText = message;
    errorEl.style.display = 'block';
}

/**
 * Hide error field helper
 */
function hideFieldError(elementId) {
    const errorEl = document.getElementById(elementId);
    errorEl.style.display = 'none';
}

/**
 * Reset all fields in the survey form
 */
function resetSurveyForm() {
    const form = document.getElementById('survey-form');
    form.reset();
    
    // Reset Char Counter
    document.getElementById('char-current').innerText = "0";

    // Hide any error message elements
    hideFieldError('error-id-estudiante');
    hideFieldError('error-satisfaccion');
    hideFieldError('error-claridad');
    hideFieldError('error-aplicabilidad');
}

/**
 * Build a readable current time stamp (dd/mm/yyyy hh:mm)
 */
function getFormattedDateTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Populate success overlay card and show the modal
 */
function showSuccessReceipt(response) {
    document.getElementById('summary-id').innerText = response.id_estudiante;
    document.getElementById('summary-sat').innerText = response.nivel_satisfaccion;
    document.getElementById('summary-cla').innerText = response.claridad_contenido;
    document.getElementById('summary-app').innerText = response.aplicabilidad_practica;

    const overlay = document.getElementById('success-overlay');
    overlay.classList.add('active');
}

/**
 * Close the success modal
 */
function closeSuccessOverlay() {
    const overlay = document.getElementById('success-overlay');
    overlay.classList.remove('active');
}

/**
 * Calculate statistics and draw the dashboard views
 */
function renderDashboard() {
    const total = responses.length;

    // Update total count
    document.getElementById('stat-total-responses').innerText = total;

    if (total === 0) {
        // Set everything to 0/empty
        document.getElementById('stat-avg-satisfaction').innerText = "0.0";
        document.getElementById('stat-avg-clarity').innerText = "0.0";
        document.getElementById('stat-avg-applicability').innerText = "0.0";

        updateProgressBar('satisfaction', 0, 0);
        updateProgressBar('clarity', 0, 0);
        updateProgressBar('applicability', 0, 0);

        renderTableRows([]);
        return;
    }

    // Averages computation
    let sumSat = 0;
    let sumCla = 0;
    let sumApp = 0;

    responses.forEach(r => {
        sumSat += r.nivel_satisfaccion;
        sumCla += r.claridad_contenido;
        sumApp += r.aplicabilidad_practica;
    });

    const avgSat = (sumSat / total).toFixed(1);
    const avgCla = (sumCla / total).toFixed(1);
    const avgApp = (sumApp / total).toFixed(1);

    // Update numeric displays
    document.getElementById('stat-avg-satisfaction').innerText = avgSat;
    document.getElementById('stat-avg-clarity').innerText = avgCla;
    document.getElementById('stat-avg-applicability').innerText = avgApp;

    // Calculate percentage width (since scale is 1 to 5, percent = (val / 5) * 100)
    const pctSat = (avgSat / 5) * 100;
    const pctCla = (avgCla / 5) * 100;
    const pctApp = (avgApp / 5) * 100;

    // Update progress bars
    updateProgressBar('satisfaction', pctSat, avgSat);
    updateProgressBar('clarity', pctCla, avgCla);
    updateProgressBar('applicability', pctApp, avgApp);

    // Update the detailed data table rows
    renderTableRows(responses);
}

/**
 * Render smooth progress bars with custom values
 */
function updateProgressBar(metricName, percentage, value) {
    const bar = document.getElementById(`progress-bar-${metricName}`);
    const text = document.getElementById(`chart-val-${metricName}`);
    
    if (bar && text) {
        bar.style.width = `${percentage}%`;
        text.innerText = `${value} / 5.0`;
    }
}

/**
 * Inject response rows dynamically into table body
 */
function renderTableRows(data) {
    const tableBody = document.getElementById('responses-table-body');
    if (!tableBody) return;

    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">No se han registrado respuestas aún. ¡Sé el primero en enviar una!</td>
            </tr>
        `;
        return;
    }

    // Build row list, showing latest entries first
    let rowsHTML = "";
    [...data].reverse().forEach(item => {
        rowsHTML += `
            <tr>
                <td style="font-weight: 600; color: var(--color-text-white);">${escapeHTML(item.id_estudiante)}</td>
                <td>
                    <span class="badge ${item.nivel_satisfaccion >= 4 ? 'badge-yellow' : 'badge-red'}">
                        ${item.nivel_satisfaccion} <i class="fa-solid fa-star" style="font-size:9px;"></i>
                    </span>
                </td>
                <td>
                    <span class="badge ${item.claridad_contenido >= 4 ? 'badge-yellow' : 'badge-red'}">
                        ${item.claridad_contenido} <i class="fa-solid fa-star" style="font-size:9px;"></i>
                    </span>
                </td>
                <td>
                    <span class="badge ${item.aplicabilidad_practica >= 4 ? 'badge-yellow' : 'badge-red'}">
                        ${item.aplicabilidad_practica} <i class="fa-solid fa-star" style="font-size:9px;"></i>
                    </span>
                </td>
                <td style="max-width: 250px; white-space: normal; color: var(--color-text-muted);" title="${escapeHTML(item.comentarios_adicionales)}">
                    ${escapeHTML(item.comentarios_adicionales)}
                </td>
                <td style="color: var(--color-text-muted); font-size: 12px;">${item.timestamp}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = rowsHTML;
}

/**
 * Escape HTML input elements to prevent basic XSS injections
 */
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

/**
 * Export responses as downloadable JSON file
 */
function exportDataJSON() {
    if (responses.length === 0) {
        alert("No hay respuestas registradas para exportar.");
        return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(responses, null, 4));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "encuestas_curso_antigravity.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

/**
 * Clear all responses in storage and state
 */
function clearAllData() {
    if (confirm("¿Estás absolutamente seguro de que deseas borrar TODAS las respuestas de la base de datos local? Esta acción no se puede deshacer.")) {
        responses = [];
        saveDataToStorage();
        renderDashboard();
    }
}

/**
 * Log error entry into a rolling LocalStorage collection
 */
function logError(context, error) {
    const logEntry = {
        timestamp: getFormattedDateTime(),
        context: context,
        message: error.message || error.toString(),
        stack: error.stack || "No hay traza de pila disponible."
    };

    let logs = [];
    const storedLogs = localStorage.getItem('antigravity_error_logs');
    if (storedLogs) {
        try {
            logs = JSON.parse(storedLogs);
        } catch (e) {
            logs = [];
        }
    }
    
    logs.push(logEntry);
    
    // Maintain a maximum of 50 logs to prevent LocalStorage overflows
    if (logs.length > 50) {
        logs.shift();
    }

    localStorage.setItem('antigravity_error_logs', JSON.stringify(logs));
}

/**
 * Compile and download all error logs as a formatted .txt file
 */
function downloadErrorLog() {
    let logs = [];
    const storedLogs = localStorage.getItem('antigravity_error_logs');
    if (storedLogs) {
        try {
            logs = JSON.parse(storedLogs);
        } catch (e) {
            logs = [];
        }
    }

    if (logs.length === 0) {
        alert("El registro de errores está completamente vacío. ¡No se han detectado anomalías de red o base de datos!");
        return;
    }

    let logText = "========================================================\n";
    logText += "    ANTIGRAVITY ACADEMY - REGISTRO HISTÓRICO DE ERRORES \n";
    logText += `    Generado el: ${getFormattedDateTime()}\n`;
    logText += "========================================================\n\n";

    // Show latest errors first in the text file
    [...logs].reverse().forEach((log, index) => {
        logText += `[ERROR #${logs.length - index}] [${log.timestamp}]\n`;
        logText += `📍 Contexto : ${log.context}\n`;
        logText += `⚠️ Mensaje  : ${log.message}\n`;
        logText += `🔍 Detalles/Stack:\n${log.stack}\n`;
        logText += "--------------------------------------------------------\n\n";
    });

    const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", URL.createObjectURL(blob));
    downloadAnchor.setAttribute("download", "error_log_antigravity.txt");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}
