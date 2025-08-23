'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient'; // <- relative path

export default function TopBar() {
  const [role, setRole] = useState<'admin' | 'outlet' | null>(null);

  useEffect(() => {
    let alive = true;

    const loadRole = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) { if (alive) setRole(null); return; }

      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!alive) return;
      if (prof?.role === 'admin' || prof?.role === 'outlet') setRole(prof.role);
      else setRole(null);
    };

    loadRole();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!alive) return;
      if (s?.user) loadRole();
      else setRole(null);
    });

    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  return (
    <div className="w-full border-b bg-white">
      <div className="mx-auto max-w-5xl px-4 h-12 flex items-center justify-between">
        <Link href="/" className="font-semibold">Chawlas2 Loyalty</Link>
        <div className="flex items-center gap-4">
          {role === 'admin' && <Link href="/admin">Admin</Link>}
          {role && <Link href="/outlet">Outlet</Link>}
          <button onClick={logout} className="rounded px-3 py-1 bg-gray-900 text-white">Logout</button>
        </div>
      </div>
    </div>
  );
}
