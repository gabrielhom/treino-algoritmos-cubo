import { useState } from 'react';
import type { SyncStatus } from '../sync/useSync';

export function Account({ status, pending, onSignIn, onVerify, onSignOut, onSync }: {
  status: SyncStatus;
  pending: number;
  onSignIn: (email: string) => Promise<string | null>;
  onVerify: (email: string, code: string) => Promise<string | null>;
  onSignOut: () => void;
  onSync: () => void;
}) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');

  if (!status.configured) {
    return (
      <div className="card">
        <h2>Conta</h2>
        <p className="mini">Sincronização não configurada neste deploy. O progresso fica só neste navegador.</p>
      </div>
    );
  }

  if (!status.session && sentTo) {
    const verify = async (e: React.FormEvent) => {
      e.preventDefault();
      setSending(true);
      const err = await onVerify(sentTo, code.trim());
      setSending(false);
      setMsg(err ?? null);
    };
    return (
      <div className="card">
        <h2>Conta</h2>
        <p className="mini">Enviamos um código para <b>{sentTo}</b>. Digite-o aqui (não precisa abrir o link).</p>
        <form className="row" onSubmit={verify}>
          <input className="input" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10}
            required placeholder="código" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          <button className="chip" type="submit" disabled={sending || code.length < 6}>{sending ? 'verificando…' : 'entrar'}</button>
        </form>
        <button className="chip" type="button" onClick={() => { setSentTo(null); setCode(''); setMsg(null); }}>trocar e-mail / reenviar</button>
        {msg && <div className="note">{msg}</div>}
      </div>
    );
  }

  if (!status.session) {
    const send = async (e: React.FormEvent) => {
      e.preventDefault();
      setSending(true);
      const addr = email.trim();
      const err = await onSignIn(addr);
      setSending(false);
      if (err) setMsg(err);
      else { setMsg(null); setCode(''); setSentTo(addr); }
    };
    return (
      <div className="card">
        <h2>Conta</h2>
        <p className="mini">Entre com seu e-mail para sincronizar o progresso entre celular e PC. Sem senha: você recebe um código.</p>
        <form className="row" onSubmit={send}>
          <input className="input" type="email" required placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="chip" type="submit" disabled={sending || !email}>{sending ? 'enviando…' : 'enviar código'}</button>
        </form>
        {msg && <div className="note">{msg}</div>}
      </div>
    );
  }

  const last = status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'nunca';
  return (
    <div className="card">
      <h2>Conta</h2>
      <div className="row">
        <div><div className="t">{status.session.user.email}</div>
          <div className="d">{status.syncing ? 'sincronizando…' : pending ? `${pending} tentativas a enviar · última sync ${last}` : `tudo sincronizado · ${last}`}</div>
          {status.error && <div className="d" style={{ color: 'var(--bad)' }}>{status.error}</div>}
        </div>
        <span>
          <button className="chip" onClick={onSync} disabled={status.syncing}>sincronizar</button>{' '}
          <button className="chip" onClick={onSignOut}>sair</button>
        </span>
      </div>
    </div>
  );
}
