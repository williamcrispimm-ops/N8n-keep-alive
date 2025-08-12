// --- CRUD simples de segredos na tabela config ---

// upsert: grava ou atualiza um valor
app.post('/db/secret', express.json(), async (req, res) => {
  try {
    const { key, value } = req.body || {};
    if (!key || typeof value === 'undefined') {
      return res.status(400).json({ ok: false, error: 'Informe key e value' });
    }
    await pool.query(`
      create table if not exists config (
        id serial primary key,
        key text unique not null,
        value text not null
      )
    `);
    await pool.query(
      `insert into config(key, value) values ($1, $2)
       on conflict(key) do update set value = excluded.value`,
      [key, String(value)]
    );
    res.json({ ok: true, saved: { key } });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// read: lê um valor pelo key
app.get('/db/secret/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const r = await pool.query(`select value from config where key = $1`, [key]);
    if (!r.rowCount) return res.status(404).json({ ok: false, error: 'Não encontrado' });
    res.json({ ok: true, key, value: r.rows[0].value });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

