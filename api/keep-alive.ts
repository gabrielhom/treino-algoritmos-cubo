// Vercel Cron (vercel.json → crons) chama esta rota 1x/dia para o projeto Supabase
// (plano gratuito) não pausar por inatividade. Faz uma consulta real e leve ao banco:
// SELECT id FROM attempts LIMIT 1 via REST. Com RLS e a chave anon, o resultado
// vem vazio, mas a requisição chega ao Postgres, que é o que importa.

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return json({ ok: false, status: 401, error: 'unauthorized' }, 401);
  }

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return json({ ok: false, status: 500, error: 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes' }, 500);
  }

  const started = Date.now();
  try {
    const res = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/attempts?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const ms = Date.now() - started;
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      return json({ ok: false, status: res.status, ms, error: detail }, 502);
    }
    const rows = (await res.json()) as unknown[];
    return json({ ok: true, status: res.status, ms, rows: rows.length, at: new Date().toISOString() });
  } catch (err) {
    return json({ ok: false, status: 0, error: String(err) }, 502);
  }
}
