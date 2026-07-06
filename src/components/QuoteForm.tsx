"use client";
import { FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
export function QuoteForm() {
  const [state, setState] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("loading"); setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try { const response = await fetch("/api/quotes", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) }); const result = await response.json(); if(!response.ok) throw new Error(result.error); setState("success"); event.currentTarget.reset(); }
    catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "Please try again."); }
  }
  return <form className="quote-form" onSubmit={submit}><div className="form-grid"><label>Full name<input name="name" required autoComplete="name"/></label><label>Email<input name="email" type="email" required autoComplete="email"/></label><label>Phone<input name="phone" type="tel" required autoComplete="tel"/></label><label>Company <span>(optional)</span><input name="company" autoComplete="organization"/></label><label>Pickup location<input name="pickup" required/></label><label>Delivery location<input name="delivery" required/></label><label>Service<select name="serviceType" required defaultValue=""><option value="" disabled>Select a service</option><option>Same-Day Delivery</option><option>Medical Courier</option><option>Automotive Delivery</option><option>Freight & LTL</option><option>Legal Documents</option><option>Final-Mile Delivery</option></select></label><label>Requested date<input name="requestedDate" type="date"/></label><label className="span-2">Shipment details <span>(optional)</span><textarea name="notes" rows={4} placeholder="Tell us what is moving, approximate size, and timing."/></label></div><button className="button submit" disabled={state==="loading"}>{state==="loading"?<><LoaderCircle className="spin"/> Sending…</>:"Request my quote"}</button>{state==="success"&&<p className="form-success"><CheckCircle2/> Request received. Our dispatch team will be in touch.</p>}{state==="error"&&<p className="form-error" role="alert">{message}</p>}</form>;
}
