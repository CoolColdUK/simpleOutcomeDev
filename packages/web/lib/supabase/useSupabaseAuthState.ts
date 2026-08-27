'use client';

import {useEffect, useState} from 'react';
import type {User} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';

export interface UseSupabaseAuthStateResult {
  authReady: boolean;
  user: User | undefined;
}

export default function useSupabaseAuthState(): UseSupabaseAuthStateResult {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getSession().then(({data: {session}}) => {
      setUser(session?.user ?? undefined);
      setAuthReady(true);
    });
    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? undefined);
    });
    return () => subscription.unsubscribe();
  }, []);

  return {authReady, user};
}
