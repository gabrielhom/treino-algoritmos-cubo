import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Attempt } from '../progress/model';
import type { AttemptStore } from '../progress/store';
import { supabase } from './supabase';
import { syncOnce, type RemoteRow, type SyncClient } from './sync';

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
  };
}
const client: SyncClient | null = supabase ? makeClient(supabase) : null;

export function useSync(
  storeRef: React.RefObject<AttemptStore | null>,
  attemptsRef: React.RefObject<Attempt[]>,
  setAttempts: (a: Attempt[]) => void,
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
      const r = await syncOnce(client, storeRef.current, attemptsRef.current, userId, cursor);
      if (r.cursor) localStorage.setItem(cursorKey(userId), r.cursor);
      const now = new Date().toISOString();
      localStorage.setItem('cube-trainer:last-sync', now);
      setAttempts(r.attempts);
      setStatus((s) => ({ ...s, syncing: false, lastSyncAt: now }));
    } catch (e) {
      setStatus((s) => ({ ...s, syncing: false, error: (e as Error).message ?? 'erro ao sincronizar' }));
    } finally {
      busy.current = false;
    }
  }, [status.session, storeRef, attemptsRef, setAttempts]);

  // Sync on login and whenever the device comes back online.
  useEffect(() => {
    if (!status.session) return;
    void sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [status.session, sync]);

  const signIn = useCallback(async (email: string) => {
    if (!supabase) return 'Sincronização não configurada.';
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  return { status, sync, signIn, signOut };
}
