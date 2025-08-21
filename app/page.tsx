'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) routeByRole(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) routeByRole(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function routeByRole(s: any) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', s.user.id)
      .maybeSingle();
    if (error) { setMsg(error.message); return; }
    const role = data?.role || 'outlet';
    window.location.href = role === 'admin' ? '/admin' : '/outlet';
  }

  async function login() {
    setMsg('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    setMsg(error ? error.message : 'Magic link sent to email');
  }

  return (
    <main style={{maxWidth:420, margin:'60px auto', fontFamily:'system-ui'}}>
      <h1>Chawlas2 – Login</h1>
      <p style={{opacity:.7, margin:'8px 0 12px'}}>Enter an outlet/admin email.</p>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" style={{width:'100%',padding:12,margin:'8px 0'}} />
      <button onClick={login} style={{padding:12,width:'100%'}}>Send Magic Link</button>
      <p style={{marginTop:8}}>{msg}</p>
    </main>
  );
}
