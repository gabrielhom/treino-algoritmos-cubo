import { useState } from 'react';
import type { SyncStatus } from '../sync/useSync';

export function Account({ status, pending, onSignIn, onSignUp, onSignOut, onSync }: {
  status: SyncStatus;
  pending: number;
  onSignIn: (email: string, password: string) => Promise<string | null>;
  onSignUp: (email: string, password: string) => Promise<string | { needsConfirmation: boolean }>;
  onSignOut: () => void;
  onSync: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
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
    const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSending(true);
      setMsg(null);
      const addr = email.trim();
      if (creating) {
        const r = await onSignUp(addr, password);
        if (typeof r === 'string') setMsg(r);
        else if (r.needsConfirmation) {
          setMsg(`Conta criada. Enviamos um link de confirmação para ${addr}: abra, confirme e depois volte aqui no app e toque em "entrar".`);
          setCreating(false);
        }
      } else {
        const err = await onSignIn(addr, password);
        if (err) setMsg(err);
      }
      setSending(false);
    };
    return (
      <div className="card">
        <h2>Conta</h2>
        <p className="mini">Entre com e-mail e senha para sincronizar o progresso entre celular e PC.</p>
        <form onSubmit={submit}>
          <div className="row">
            <input className="input" type="email" name="email" autoComplete="email" required placeholder="seu@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="row">
            <input className="input" type="password" name="password" autoComplete={creating ? 'new-password' : 'current-password'}
              required minLength={6} placeholder={creating ? 'crie uma senha (mín. 6)' : 'senha'}
              value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="chip" type="submit" disabled={sending || !email || password.length < 6}>
              {sending ? 'aguarde…' : creating ? 'criar conta' : 'entrar'}
            </button>
          </div>
        </form>
        <button className="chip" type="button" onClick={() => { setCreating(!creating); setMsg(null); }}>
          {creating ? 'já tenho conta: entrar' : 'não tenho conta: criar conta'}
        </button>
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
