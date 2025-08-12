
// n8n Keep Alive & System Monitor
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const LOG_FILE = path.join(__dirname, 'status.log');

// Função para salvar status no log
function logStatus(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

// Rota principal
app.get('/', (req, res) => {
    res.json({ ok: true, service: "n8n3_keepalive", time: new Date().toISOString() });
});

// Rota de status
app.get('/status', (req, res) => {
    try {
        const log = fs.readFileSync(LOG_FILE, 'utf8');
        res.type('text/plain').send(log);
    } catch (e) {
        res.status(500).send("Erro ao ler log");
    }
});

// Função de ping automático
setInterval(async () => {
    try {
        await axios.get(`http://localhost:${PORT}`);
        logStatus("Ping interno OK");
    } catch (err) {
        logStatus("Falha no ping interno");
    }
}, 5 * 60 * 1000); // a cada 5 min

// Iniciar servidor
app.listen(PORT, () => {
    logStatus(`Servidor iniciado na porta ${PORT}`);
    console.log(`n8n Keep Alive rodando na porta ${PORT}`);
});
