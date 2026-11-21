import { NavLink, Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
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
          MarketLens <span className="brand-sub">Regulator</span>
        </Link>
        <div className="topbar-right">
          <Link to="/" className="outline-link outline-link--light">Back to business view</Link>
        </div>
      </header>
    );
  }

  return (
    <header className="topbar">
      <Link to="/" className="brand">MarketLens</Link>
      <nav className={`main-nav ${open ? "open" : ""}`} aria-label="Main">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            {l.label}
          </NavLink>
        ))}
        <NavLink to="/regulator" className="outline-link">Regulator</NavLink>
      </nav>
      <button type="button" className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}