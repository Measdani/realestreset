"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { site } from "@/lib/content";
export function Header() {
  const [open, setOpen] = useState(false);
  return <header className="header"><div className="shell nav-wrap"><Logo/><nav className={open ? "nav open" : "nav"} aria-label="Main navigation">{site.nav.map((item)=><a key={item} onClick={()=>setOpen(false)} href={`#${item.toLowerCase()}`}>{item}</a>)}<a className="button nav-quote" href="#quote">Request a quote</a></nav><a className="button desktop-quote" href="#quote">Request a quote</a><button className="menu-button" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">{open?<X/>:<Menu/>}</button></div></header>;
}
