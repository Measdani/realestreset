"use client";

import { FormEvent, useEffect, useState } from "react";

type Quote = { id:string; name:string; email:string; phone:string; company?:string; pickup:string; delivery:string; service_type:string; requested_date?:string; notes?:string; status:string; created_at:string };

export function AdminDashboard() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [ready, setReady] = useState(false);
  const [loginError, setLoginError] = useState("");

  async function load() {
    const response = await fetch("/api/admin/quotes");
    if (response.ok) {
      setQuotes((await response.json()).quotes);
      setReady(true);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/admin/quotes").then(async (response) => {
      if (response.ok && active) {
        setQuotes((await response.json()).quotes);
        setReady(true);
      }
    });
    return () => { active = false; };
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password"));
    const response = await fetch("/api/admin/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({password}) });
    if (response.ok) load(); else setLoginError("That password didn’t work.");
  }

  async function update(id: string, status: string) {
    await fetch(`/api/admin/quotes/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({status}) });
    load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method:"POST" });
    setReady(false); setQuotes([]);
  }

  if (!ready) return <main className="admin-login"><form onSubmit={login}><p className="eyebrow">Realest Reset</p><h1>Dispatch admin</h1><label>Password<input type="password" name="password" autoFocus required/></label><button className="button">Sign in</button>{loginError&&<p className="form-error">{loginError}</p>}</form></main>;

  return <main className="admin"><header><div><p className="eyebrow">Dispatch center</p><h1>Quote requests</h1></div><button onClick={logout}>Log out</button></header><div className="admin-list">{quotes.length===0?<p>No quote requests yet.</p>:quotes.map(q=><article key={q.id}><div className="admin-card-head"><div><b>{q.name}</b><span>{q.company||"Individual"} · {new Date(q.created_at).toLocaleString()}</span></div><select value={q.status} onChange={event=>update(q.id,event.target.value)} aria-label={`Status for ${q.name}`}>{["new","contacted","scheduled","completed","archived"].map(status=><option key={status}>{status}</option>)}</select></div><h2>{q.service_type}</h2><p><strong>Route:</strong> {q.pickup} → {q.delivery}</p><p><strong>Contact:</strong> <a href={`mailto:${q.email}`}>{q.email}</a> · <a href={`tel:${q.phone}`}>{q.phone}</a></p>{q.requested_date&&<p><strong>Requested:</strong> {q.requested_date}</p>}{q.notes&&<p className="notes">{q.notes}</p>}</article>)}</div></main>;
}
