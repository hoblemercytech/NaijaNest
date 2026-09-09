import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSupabaseQuery, unwrap } from './useSupabaseQuery';

/**
 * Live unread badge. Realtime keeps it honest without polling.
 *
 * The count query lives inside the effect so nothing sets state synchronously
 * during the effect body — the first statement is an await, and the signed-out
 * case is derived on the way out instead of being pushed through setState.
 */
export function useUnreadCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return undefined;

    let alive = true;

    const load = async () => {
      const { count: n } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null);
      if (alive) setCount(n || 0);
    };

    load();

    const channel = supabase
      .channel(`notif:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        load
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return user ? count : 0;
}

export function useNotifications() {
  const { user } = useAuth();

  const query = useSupabaseQuery(
    () => unwrap(
      supabase
        .from('notifications')
        .select('id, type, title, body, entity_type, entity_id, read_at, created_at')
        .order('created_at', { ascending: false })
        .limit(60)
    ),
    [user?.id],
    { enabled: !!user }
  );

  const { setData } = query;

  const markRead = useCallback(async (id) => {
    await supabase.rpc('nn_mark_notification_read', { p_id: id });
    setData((rows) =>
      rows?.map((r) => (r.id === id ? { ...r, read_at: new Date().toISOString() } : r))
    );
  }, [setData]);

  const markAllRead = useCallback(async () => {
    await supabase.rpc('nn_mark_all_notifications_read');
    const now = new Date().toISOString();
    setData((rows) => rows?.map((r) => (r.read_at ? r : { ...r, read_at: now })));
  }, [setData]);

  return { ...query, markRead, markAllRead };
}