'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Snapshot = {
  phone:string; name:string|null; tier:string|null;
  balance:number|null; last_visit:string|null; expiry_date:string|null;
  coupon:number|null; min_bill:number|null
};

export default function Page(){
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bill, setBill] = useState('');
  const [amount, setAmount] = useState('');
  const [snap, setSnap] = useState<Snapshot|null>(null);
  const [msg, setMsg] = useState('');

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=>{ sub.subscription.unsubscribe(); };
  },[]);

  async function login(){
    setMsg('');
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin }});
    setMsg(error ? error.message : 'Magic link sent to email');
  }

  async function lookup(){
    setMsg('');
    const { data, error } = await supabase.rpc('get_customer_snapshot', { p_phone: phone });
    if (error) return setMsg(error.message);
    setSnap(data?.[0] || null);
  }

  async function redeem(){
    setMsg('');
    const vAmt = Number(amount), vBill = Number(bill);
    if (!vAmt || vAmt<=0) return setMsg('Enter a valid redeem amount');
    if (!vBill || vBill<=0) return setMsg('Enter current bill amount');
    const { error } = await supabase.rpc('redeem_coins', { p_phone: phone, p_amount: vAmt, p_bill: vBill, p_note: 'web' });
    if (error) return setMsg(error.message);
    setMsg('Redeemed successfully'); await lookup(); setAmount('');
  }

  if (!session){
    return (<main style={{maxWidth:420,margin:'60px auto',fontFamily:'system-ui'}}>
      <h1>Chawlas2 – Outlet Login</h1>
      <input placeholder="Outlet email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%',padding:12,margin:'12px 0'}}/>
      <button onClick={login} style={{padding:12,width:'100%'}}>Send Magic Link</button>
      <p>{msg}</p>
    </main>);
  }

  return (<main style={{maxWidth:560,margin:'40px auto',fontFamily:'system-ui'}}>
    <h2>Redemption</h2>
    <div style={{display:'grid',gap:12}}>
      <input placeholder="Customer Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
      <button onClick={lookup}>Lookup</button>
    </div>

    {snap && (<div style={{marginTop:16,padding:12,border:'1px solid #ddd',borderRadius:8}}>
      <div><b>Name:</b> {snap.name ?? '—'}</div>
      <div><b>Tier:</b> {snap.tier ?? '—'}</div>
      <div><b>Balance:</b> ₹{snap.balance ?? 0}</div>
      <div><b>Last Visit:</b> {snap.last_visit ?? '—'}</div>
      <div><b>Expiry:</b> {snap.expiry_date ?? '—'}</div>
      <div><b>Coupon Value:</b> ₹{snap.coupon ?? 0} | <b>Min Bill:</b> ₹{snap.min_bill ?? 0}</div>
    </div>)}

    <div style={{display:'grid',gap:12, marginTop:16}}>
      <input placeholder="Current bill (₹)" value={bill} onChange={e=>setBill(e.target.value)} />
      <input placeholder="Coins to redeem (₹, in multiples of coupon)" value={amount} onChange={e=>setAmount(e.target.value)} />
      <button onClick={redeem} disabled={!snap}>Redeem</button>
      <p>{msg}</p>
    </div>

    <button style={{marginTop:24}} onClick={()=>supabase.auth.signOut()}>Logout</button>
  </main>);
}
