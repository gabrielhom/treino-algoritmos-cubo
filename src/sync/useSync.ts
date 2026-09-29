import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Attempt, CaseMark } from '../progress/model';
import type { AttemptStore } from '../progress/store';
import { supabase } from './supabase';
import { syncOnce, type RemoteMark, type RemoteRow, type SyncClient } from './sync';

export interface SyncStatus {
  configured: boolean;
  session: Session | null;
  syncing: boolean;
  lastSyncAt: string | null;
  error: string | null;
}

const cursorKey = (userId: string) => `cube-trainer:sync-cursor:${userId}`;

function makeClient(sb: NonNullable<typeof supabase>): SyncClient {
  return {
    async upsert(rows: RemoteRow[]) {
      const { error } = await sb.from('attempts').upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw error;
    },
    async fetchAfter(userId, cursor, limit) {
      let q = sb.from('attempts').select('*').eq('user_id', userId).order('synced_at', { ascending: true }).limit(limit);
      if (cursor) q = q.gt('synced_at', cursor);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as RemoteRow[];
    },
    async upsertMarks(rows: RemoteMark[]) {
      const { error } = await sb.from('case_marks').upsert(rows, { onConflict: 'user_id,set_id,case_id' });
      if (error) throw error;
    },
    async fetchMarks(userId) {
      const { data, error } = await sb.from('case_marks').select('*').eq('user_id', userId);
      if (error) throw error;
      return (data ?? []) as RemoteMark[];
    },
  };
}
const client: SyncClient | null = supabase ? makeClient(supabase) : null;

/** Supabase auth errors in Portuguese; falls back to the original message. */
export function authMessage(error: { code?: string; message: string }): string {
  switch (error.code) {
    case 'invalid_credentials': return 'E-mail ou senha incorretos.';
    case 'email_not_confirmed': return 'E-mail ainda não confirmado. Abra o link que enviamos e depois entre aqui no app.';
    case 'weak_password': return 'Senha fraca. Use pelo menos 6 caracteres.';
    case 'user_already_exists':
    case 'email_exists': return 'Já existe uma conta com este e-mail. Use "entrar".';
    case 'email_address_invalid': return 'E-mail inválido.';
    case 'signup_disabled': return 'Criação de contas desativada neste projeto.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit': return 'Muitas tentativas. Espere alguns minutos e tente de novo.';
  }
  if (/invalid login credentials/i.test(error.message)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(error.message)) return 'E-mail ainda não confirmado. Abra o link que enviamos e depois entre aqui no app.';
  if (/password should be/i.test(error.message)) return 'Senha fraca. Use pelo menos 6 caracteres.';
  return error.message;
}

export function useSync(
  storeRef: React.RefObject<AttemptStore | null>,
  attemptsRef: React.RefObject<Attempt[]>,
  setAttempts: (a: Attempt[]) => void,
  marksRef: React.RefObject<CaseMark[]>,
  setMarks: (m: CaseMark[]) => void,
) {
  const [status, setStatus] = useState<SyncStatus>({
    configured: !!supabase, session: null, syncing: false,
    lastSyncAt: localStorage.getItem('cube-trainer:last-sync'), error: null,
  });
  const busy = useRef(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setStatus((s) => ({ ...s, session: data.session })));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setStatus((s) => ({ ...s, session })));
    return () => sub.subscription.unsubscribe();
  }, []);

  const sync = useCallback(async () => {
    const userId = status.session?.user.id;
    if (!client || !userId || busy.current || !storeRef.current) return;
    busy.current = true;
    setStatus((s) => ({ ...s, syncing: true, error: null }));
    try {
      const cursor = localStorage.getItem(cursorKey(userId));
      const r = await syncOnce(client, storeRef.current, attemptsRef.current, marksRef.current, userId, cursor);
      if (r.cursor) localStorage.setItem(cursorKey(userId), r.cursor);
      const now = new Date().toISOString();
      localStorage.setItem('cube-trainer:last-sync', now);
      setAttempts(r.attempts);
      setMarks(r.marks);
      setStatus((s) => ({ ...s, syncing: false, lastSyncAt: now }));
    } catch (e) {
      setStatus((s) => ({ ...s, syncing: false, error: (e as Error).message ?? 'erro ao sincronizar' }));
    } finally {
      busy.current = false;
    }
  }, [status.session, storeRef, attemptsRef, setAttempts, marksRef, setMarks]);

  // Sync on login and whenever the device comes back online.
  useEffect(() => {
    if (!status.session) return;
    void sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [status.session, sync]);

  // E-mail + password. Magic links/OTP e-mails were dropped: on iOS the link opens in
  // Safari (storage separate from the installed PWA) and, without custom SMTP, the
  // free plan's e-mail template can't be edited to include a code.
  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return 'Sincronização não configurada.';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? authMessage(error) : null;
  }, []);

  /** Returns an error message, or `{ needsConfirmation }` when the account was created. */
  const signUp = useCallback(async (email: string, password: string): Promise<string | { needsConfirmation: boolean }> => {
    if (!supabase) return 'Sincronização não configurada.';
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    if (error) return authMessage(error);
    // With "Confirm email" on, an already-registered address comes back with no identities and no error.
    if (data.user && data.user.identities?.length === 0) return 'Já existe uma conta com este e-mail. Use "entrar".';
    return { needsConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  return { status, sync, signIn, signUp, signOut };
}
