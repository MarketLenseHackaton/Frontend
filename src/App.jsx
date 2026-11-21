import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Header from "./components/Header";
import { ToastProvider } from "./components/Toast";
import MarketFinder from "./pages/MarketFinder";
import HealthData from "./pages/HealthData";
import Discover from "./pages/Discover";
import Regulator from "./pages/Regulator";
import Evidence from "./pages/Evidence";

function NotFound() {
  return (
    <div className="empty-state big">
      <h2>Page not found</h2>
      <Link to="/" className="primary-btn">Go to Market Finder</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <div className="app-shell">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<MarketFinder />} />
              <Route path="/health" element={<HealthData />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/discover/:id" element={<Discover />} />
              <Route path="/regulator" element={<Regulator />} />
              <Route path="/evidence" element={<Evidence />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="footer">
            <span>MarketLens · Hack the Fork Nigeria 2026</span>
            <Link to="/evidence">Sources and limits</Link>
          </footer>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}