'use client';

import {createClient} from '@supabase/supabase-js';
import {useEffect} from 'react';
import {readSitesPublicEnv} from '@/lib/env';

export default function useDesignLibraryLive(onChange: () => void): void {
  useEffect(() => {
    const env = readSitesPublicEnv().supabase;
    if (env === undefined) {
      return;
    }
    const client = createClient(env.url, env.anonKey, {auth: {persistSession: false, autoRefreshToken: false}});
    const channel = client
      .channel('design-library')
      .on('postgres_changes', {event: '*', schema: 'public', table: 'design_atom'}, () => onChange())
      .on('postgres_changes', {event: '*', schema: 'public', table: 'design_colour_scheme'}, () => onChange())
      .on('postgres_changes', {event: '*', schema: 'public', table: 'design_molecule'}, () => onChange())
      .on('postgres_changes', {event: '*', schema: 'public', table: 'design_organism'}, () => onChange())
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [onChange]);
}
