require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static frontend files from the current directory
app.use(express.static(path.join(__dirname)));

// Validate environment variables on startup
const REQUIRED_ENV = ['AIRTABLE_BASE_ID', 'AIRTABLE_TABLE_ID', 'AIRTABLE_PAT', 'N8N_WEBHOOK_URL'];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
    console.warn(`\x1b[33m[ADVERTENCIA] Faltan las siguientes variables de entorno: ${missingEnv.join(', ')}`);
    console.warn(`Las funciones de proxy a Airtable/n8n fallarán hasta que se configuren.\x1b[0m`);
} else {
    console.log('\x1b[32m[OK] Todas las variables de entorno necesarias están configuradas correctamente.\x1b[0m');
}

/**
 * GET /api/responses
 * Proxies Airtable GET request to fetch all survey records
 */
app.get('/api/responses', async (req, res) => {
    try {
        const { AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID, AIRTABLE_PAT } = process.env;
        
        if (!AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID || !AIRTABLE_PAT) {
            return res.status(500).json({ error: 'Credenciales del servidor no configuradas.' });
        }

        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;
        console.log(`[Proxy GET] Consultando Airtable Base: ${AIRTABLE_BASE_ID}...`);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_PAT}`
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Proxy GET Error] Airtable respondió: ${response.status} - ${errText}`);
            return res.status(response.status).send(errText);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('[Proxy GET Exception]', error);
        res.status(500).json({ error: 'Error interno del servidor al consultar Airtable.', details: error.message });
    }
});

/**
 * POST /api/responses
 * Proxies Airtable POST request to insert a new survey record
 */
app.post('/api/responses', async (req, res) => {
    try {
        const { AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID, AIRTABLE_PAT } = process.env;
        
        if (!AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID || !AIRTABLE_PAT) {
            return res.status(500).json({ error: 'Credenciales del servidor no configuradas.' });
        }

        const recordData = req.body;
        
        // Construct Airtable payload structure
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

        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;
        console.log(`[Proxy POST] Insertando respuesta en Airtable para estudiante: ${recordData.id_estudiante}...`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_PAT}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Proxy POST Error] Airtable respondió: ${response.status} - ${errText}`);
            return res.status(response.status).send(errText);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('[Proxy POST Exception]', error);
        res.status(500).json({ error: 'Error interno del servidor al guardar en Airtable.', details: error.message });
    }
});

/**
 * POST /api/n8n
 * Proxies POST request to trigger n8n automated email webhook
 */
app.post('/api/n8n', async (req, res) => {
    try {
        const { N8N_WEBHOOK_URL } = process.env;
        
        if (!N8N_WEBHOOK_URL) {
            return res.status(500).json({ error: 'Webhook de n8n no configurado en el servidor.' });
        }

        console.log(`[Proxy n8n] Enviando webhook de notificación a n8n...`);

        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Proxy n8n Error] n8n respondió: ${response.status} - ${errText}`);
            return res.status(response.status).send(errText);
        }

        res.status(response.status).send('Webhook enviado exitosamente.');
    } catch (error) {
        console.error('[Proxy n8n Exception]', error);
        res.status(500).json({ error: 'Error interno del servidor al disparar webhook n8n.', details: error.message });
    }
});

// Fallback: Send index.html for any other requests to support Single Page Routing behavior
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`\n========================================================`);
    console.log(`🚀 SERVIDOR ACTIVO Y LISTO PARA CLOUD / RENDER`);
    console.log(`📍 URL Local: http://localhost:${PORT}`);
    console.log(`========================================================\n`);
});
