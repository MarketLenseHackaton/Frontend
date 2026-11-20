import { NavLink, Link, useLocation } from "react-router-dom";
import { Search, Menu, X, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

const LINKS = [
  { to: "/", label: "Market Finder", end: true },
  { to: "/health", label: "Health Data" },
  { to: "/discover", label: "Discover" },
  { to: "/evidence", label: "Evidence" },
];

export default function Header() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const isRegulator = pathname.startsWith("/regulator");

  useEffect(() => setOpen(false), [pathname]);

  if (isRegulator) {
    return (
      <header className="topbar topbar--regulator">
        <Link to="/regulator" className="brand brand--light">
          <span className="brand-mark brand-mark--light"><Search size={17} /></span>
          MarketLens <span className="brand-sub">· Regulator view</span>
        </Link>
        <div className="topbar-right">
          <span className="signed-in">Signed in: [Agency / association name]</span>
          <Link to="/" className="outline-link outline-link--light">Business app <ArrowUpRight size={15} /></Link>
        </div>
      </header>
    );
  }

  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark"><Search size={17} /></span>
        MarketLens
      </Link>
      <nav className={`main-nav ${open ? "open" : ""}`} aria-label="Main">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            {l.label}
          </NavLink>
        ))}
        <NavLink to="/regulator" className="outline-link">Regulator view <ArrowUpRight size={15} /></NavLink>
      </nav>
      <button type="button" className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}
