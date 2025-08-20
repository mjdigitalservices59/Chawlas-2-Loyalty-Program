'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home(){
  const [dest, setDest] = useState<'login'|'admin'|'outlet'>('login');
  const [email, setEmail] = useState(''); const [msg, setMsg] = useState('');

  useEffect(()=>{
    supabase.auth.getSession().then(async ({data})=>{
      const s = data.session; if (!s) return;
      const { data: prof } = await supabase.from('profiles').select('role').eq('user_id', s.user.id).maybeSingle();
      setDest(prof?.role === 'admin' ? 'admin' : 'outlet');
    });
  },[]);

  if (dest === 'admin'){ window.location.href = '/admin';  return null; }
  if (dest === 'outlet'){ window.location.href = '/outlet'; return null; }

  async function login(){
    setMsg('');
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin }});
    setMsg(error ? error.message : 'Magic link sent to email');
  }

  return (
    <main className="max-w-md mx-auto mt-16 font-[system-ui]">
      <h1 className="text-2xl font-bold mb-4">Chawlas2 – Outlet/Admin Login</h1>
      <input className="w-full border rounded px-3 py-2 mb-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <button className="w-full border rounded px-3 py-2" onClick={login}>Send Magic Link</button>
      <p className="mt-2 text-sm text-gray-600">{msg}</p>
    </main>
  );
}
