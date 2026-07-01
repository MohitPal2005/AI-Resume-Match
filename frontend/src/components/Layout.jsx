import { Link, useLocation } from "react-router-dom";
import { Target } from "lucide-react";

export default function Layout({ children }) {
  const location = useLocation();

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors ${
        location.pathname === to
          ? "text-indigo-600"
          : "text-ink/60 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col font-body">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-ink/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Target size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight">
              ResumeMatch
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-8">
            {navLink("/", "Home")}
            {navLink("/screen", "Screen a Resume")}
            {navLink("/dashboard", "Dashboard")}
          </nav>
          <a
            href="/screen"
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-full bg-ink text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Try it live
          </a>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-ink/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink/40">
          <span>© 2026 ResumeMatch — Built with Generative AI (RAG: sentence-transformers + Groq LLM)</span>
          <span className="font-mono">v1.0 · MP2 Portfolio Project</span>
        </div>
      </footer>
    </div>
  );
}
