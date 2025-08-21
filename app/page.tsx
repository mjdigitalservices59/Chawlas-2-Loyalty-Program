'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  // Always try to route by role once a session exists
  useEffect(() => {
    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) await routeByRole(data.session.user.id);
    };
    bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        routeByRole(session.user.id);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function routeByRole(userId: string) {
    // read your own profile (allowed by RLS)
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      setMsg(error.message);
      return;
    }

    const role = data?.role === 'admin' ? 'admin' : 'outlet';
    // hard redirect (drops the #access_token hash from the magic link)
    window.location.replace(`/${role}`);
  }

  async function login() {
    setMsg('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setMsg(error ? error.message : 'Magic link sent to email');
  }

  // Minimal login screen (you won’t see this once you’re already signed in)
  return (
    <main style={{ maxWidth: 420, margin: '60px auto', fontFamily: 'system-ui' }}>
      <h1>Chawlas2 – Outlet Login</h1>
      <input
        placeholder="Outlet email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: '100%', padding: 12, margin: '12px 0' }}
      />
      <button onClick={login} style={{ padding: 12, width: '100%' }}>
        Send Magic Link
      </button>
      <p>{msg}</p>
    </main>
  );
}
