'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type KPIs = {
  total_customers: number;
  total_revenue: number;
  points_earned: number;
  points_redeemed: number;
  points_expired: number;
};

type Txn = {
  created_at: string;
  txn_date: string;
  invoice_id: string;
  phone: string;
  name: string | null;
  bill_value: number;
  coins_earned: number;
  outlet: string;
};

type Red = {
  created_at: string;
  phone: string;
  name: string | null;
  coins_used: number;
  bill_value: number;
  outlet: string;
};

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [ready, setReady] = useState(false);

  const [role, setRole] = useState<'admin' | 'outlet' | null>(null);
  const [kpi, setKpi] = useState<KPIs | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [reds, setReds] = useState<Red[]>([]);
  const [msg, setMsg] = useState('');

  // Bootstrap auth session (declare hooks first; no early returns yet)
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return;
      setSession(s);
      setReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load role + dashboard data once we have a session
  useEffect(() => {
    (async () => {
      if (!session) return;

      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const r = (prof?.role as 'admin' | 'outlet' | null) ?? 'outlet';
      setRole(r);
      if (r !== 'admin') {
        setMsg('You are not an admin.');
        return;
      }

      const today = new Date().toISOString().slice(0, 10);

      const { data: k } = await supabase.rpc('get_admin_kpis', {
        p_from: '1900-01-01',
        p_to: today,
      });
      setKpi(k?.[0] ?? null);

      const { data: t } = await supabase
        .from('v_txn_detail')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
      setTxns(t || []);

      const { data: r2 } = await supabase
        .from('v_redemption_detail')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
      setReds(r2 || []);
    })();
  }, [session]);

  // ✅ Early-return guard AFTER hooks are declared
  if (!ready) return null;
  if (!session) {
    if (typeof window !== 'undefined') window.location.href = '/';
    return null;
  }
  if (role !== 'admin') {
    return <main className="max-w-6xl mx-auto p-6">{msg}</main>;
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="rounded-2xl p-6 bg-gradient-to-r from-purple-600 to-pink-500 text-white">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="opacity-90">Overview of customers, revenue, and points</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi">
          <span className="label">Total Customers</span>
          <span className="value">{kpi?.total_customers ?? 0}</span>
        </div>
        <div className="kpi">
          <span className="label">Total Revenue</span>
          <span className="value">₹{kpi?.total_revenue ?? 0}</span>
        </div>
        <div className="kpi">
          <span className="label">Net Points</span>
          <span className="value">
            {(kpi?.points_earned ?? 0) -
              (kpi?.points_redeemed ?? 0) -
              (kpi?.points_expired ?? 0)}
          </span>
          <span className="text-xs text-gray-500">
            Earned {kpi?.points_earned ?? 0} · Redeemed {kpi?.points_redeemed ?? 0} ·
            Expired {kpi?.points_expired ?? 0}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Recent Transactions</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left">Date</th>
                <th className="text-left">Phone</th>
                <th className="text-left">Outlet</th>
                <th className="text-right">Bill</th>
                <th className="text-right">Coins</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t, i) => (
                <tr key={i} className="border-t">
                  <td>{t.txn_date}</td>
                  <td>{t.phone}</td>
                  <td>{t.outlet}</td>
                  <td className="text-right">₹{t.bill_value}</td>
                  <td className="text-right">{t.coins_earned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Recent Redemptions</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left">Date</th>
                <th className="text-left">Phone</th>
                <th className="text-left">Outlet</th>
                <th className="text-right">Bill</th>
                <th className="text-right">Coins</th>
              </tr>
            </thead>
            <tbody>
              {reds.map((r, i) => (
                <tr key={i} className="border-t">
                  <td>{new Date(r.created_at).toISOString().slice(0, 10)}</td>
                  <td>{r.phone}</td>
                  <td>{r.outlet}</td>
                  <td className="text-right">₹{r.bill_value}</td>
                  <td className="text-right">{r.coins_used}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
