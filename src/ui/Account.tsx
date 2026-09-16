import { useState } from 'react';
import type { SyncStatus } from '../sync/useSync';

export function Account({ status, pending, onSignIn, onSignOut, onSync }: {
  status: SyncStatus;
  pending: number;
  onSignIn: (email: string) => Promise<string | null>;
  onSignOut: () => void;
  onSync: () => void;
}) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  if (!status.configured) {
    return (
      <div className="card">
        <h2>Conta</h2>
        <p className="mini">Sincronização não configurada neste deploy. O progresso fica só neste navegador.</p>
      </div>
    );
  }

  if (!status.session) {
    const send = async (e: React.FormEvent) => {
      e.preventDefault();
      setSending(true);
      const err = await onSignIn(email.trim());
      setSending(false);
      setMsg(err ?? 'Link enviado. Abra o e-mail neste aparelho para entrar.');
    };
    return (
      <div className="card">
        <h2>Conta</h2>
        <p className="mini">Entre com seu e-mail para sincronizar o progresso entre celular e PC. Sem senha: você recebe um link.</p>
        <form className="row" onSubmit={send}>
          <input className="input" type="email" required placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="chip" type="submit" disabled={sending || !email}>{sending ? 'enviando…' : 'enviar link'}</button>
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
