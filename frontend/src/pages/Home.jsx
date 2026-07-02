import { Link } from "react-router-dom";
import { ArrowRight, Zap, Search, Sparkles, FileText, Check } from "lucide-react";

const skillTags = ["Python", "React", "SQL", "AWS", "Docker", "Machine Learning"];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium mb-6">
            <Sparkles size={12} />
            Real embeddings + LLM explanations, not mock data
          </div>
          <h1 className="font-display text-5xl leading-[1.05] font-semibold tracking-tight text-ink mb-6">
            Screen resumes like the
            <span className="text-indigo-600"> match actually means something.</span>
          </h1>
          <p className="text-lg text-ink/60 leading-relaxed mb-8 max-w-lg">
            Upload a resume, pick a job. A sentence-embedding model finds the real semantic
            overlap, then an LLM explains the score in plain English — matched skills,
            missing skills, and why it matters.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/screen"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Screen a resume now <ArrowRight size={16} />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-ink/10 text-ink font-medium hover:border-ink/30 transition-colors"
            >
              View dashboard
            </Link>
          </div>
        </div>

        {/* Signature visual: live "scanning" resume card */}
        <div className="relative">
          <div className="relative bg-white rounded-2xl border border-ink/10 shadow-xl shadow-indigo-900/5 p-6 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="scan-line absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-indigo-100/60 to-transparent" />
            </div>
            <div className="relative flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                <span className="font-mono text-xs text-ink/50">jane_doe_resume.pdf</span>
              </div>
              <span className="text-xs font-mono text-acid bg-ink px-2 py-0.5 rounded">ANALYZING</span>
            </div>
            <div className="relative space-y-2 mb-6">
              {[100, 88, 95, 70, 82].map((w, i) => (
                <div key={i} className="h-2.5 rounded bg-ink/5" style={{ width: `${w}%` }} />
              ))}
            </div>
            <div className="relative flex flex-wrap gap-2 mb-6">
              {skillTags.map((s) => (
                <span
                  key={s}
                  className="text-xs font-mono px-2 py-1 rounded bg-indigo-50 text-indigo-700 flex items-center gap-1"
                >
                  <Check size={10} /> {s}
                </span>
              ))}
            </div>
            <div className="relative flex items-center justify-between pt-4 border-t border-ink/5">
              <span className="text-sm text-ink/50">Match Score</span>
              <span className="font-display text-3xl font-semibold text-indigo-600">87.4</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-ink text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl font-semibold mb-2">How the matching actually works</h2>
          <p className="text-white/50 mb-12 max-w-lg">
            A real retrieval-augmented pipeline — not a keyword regex pretending to be AI.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Step
              icon={<Search size={20} />}
              title="1. Retrieve"
              text="Resume and job description are embedded with sentence-transformers. Cosine similarity finds true semantic overlap — not just exact word matches."
            />
            <Step
              icon={<Zap size={20} />}
              title="2. Score"
              text="Skill keywords are extracted from both texts and diffed to surface exactly which skills matched and which are missing."
            />
            <Step
              icon={<Sparkles size={20} />}
              title="3. Generate"
              text="The retrieved match context is passed to a free LLM (Llama 3 via Groq), which writes a plain-English explanation of the score."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="font-display text-3xl font-semibold mb-4">Try it on your own resume</h2>
        <p className="text-ink/60 mb-8 max-w-md mx-auto">
          Upload a PDF or DOCX, pick a sample job posting, and see the real match score in seconds.
        </p>
        <Link
          to="/screen"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          Get started <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}

function Step({ icon, title, text }) {
  return (
    <div>
      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4 text-acid">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{text}</p>
    </div>
  );
}
