import express from 'express';
import { Pool } from 'pg';

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Postgres (Neon) via ENVs ----
const {
  DB_POSTGRESDB_HOST,
  DB_POSTGRESDB_PORT = '5432',
  DB_POSTGRESDB_USER,
  DB_POSTGRESDB_PASSWORD,
  DB_POSTGRESDB_DATABASE,
  DB_POSTGRESDB_SSL_MODE = 'require',
  DB_POSTGRESDB_SSL_CA
} = process.env;

function buildSsl() {
  // Neon aceita sslmode=require sem CA. Se você colar o CA (PEM), usamos validação estrita.
  if (DB_POSTGRESDB_SSL_CA && DB_POSTGRESDB_SSL_CA.trim()) {
    return { rejectUnauthorized: true, ca: DB_POSTGRESDB_SSL_CA };
  }
  // Sem CA explícito, mantemos SSL ativo sem validar cadeia (Neon usa CA pública)
  return DB_POSTGRESDB_SSL_MODE === 'require' ? { rejectUnauthorized: false } : false;
}

const pool = new Pool({
  host: DB_POSTGRESDB_HOST,
  port: Number(DB_POSTGRESDB_PORT),
  user: DB_POSTGRESDB_USER,
  password: DB_POSTGRESDB_PASSWORD,
  database: DB_POSTGRESDB_DATABASE,
  ssl: buildSsl()
});

// ---- Rotas ----
app.get('/healthz', (_req, res) => {
  res.json({ ok: true, service: 'miguel-orchestrator', time: new Date().toISOString() });
});

app.get('/db/ping', async (_req, res) => {
  try {
    const r = await pool.query('select 1 as ok');
    res.json({ ok: true, db: r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Exemplo: salvar um segredo simples no Neon (tabela config)
app.get('/db/init-config', async (_req, res) => {
  try {
    await pool.query(`
      create table if not exists config (
        id serial primary key,
        key text unique not null,
        value text not null
      )
    `);
    res.json({ ok: true, message: 'Tabela config pronta' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Miguel Orchestrator on :${PORT}`);
});

