import { useState, useEffect } from "react";
import { Users, TrendingUp, Briefcase, Loader2 } from "lucide-react";
import { getDashboard } from "../api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => setError("Could not load dashboard — is the backend running?"));
  }, []);

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-14 text-center text-red-600 text-sm">{error}</div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-24 flex justify-center">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <h1 className="font-display text-3xl font-semibold mb-2">Screening dashboard</h1>
      <p className="text-ink/60 mb-10">Live stats pulled directly from the backend database.</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <StatCard icon={<Users size={18} />} label="Total Resumes Screened" value={data.total_screened} />
        <StatCard icon={<TrendingUp size={18} />} label="Average Match Score" value={data.average_match_score} suffix="/100" />
        <StatCard icon={<Briefcase size={18} />} label="Active Job Postings" value={data.active_jobs} />
      </div>

      <h2 className="font-display text-xl font-semibold mb-4">Recent screenings</h2>
      <div className="border border-ink/10 rounded-xl overflow-hidden bg-white">
        {data.recent_screenings.length === 0 ? (
          <p className="text-sm text-ink/40 text-center py-12">
            No screenings yet — head to the Screen page to analyze your first resume.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink/5 text-left text-xs text-ink/50">
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Job</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Matched Skills</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_screenings.map((r) => (
                <tr key={r.screening_id} className="border-t border-ink/5">
                  <td className="px-4 py-3 font-medium">{r.candidate_name}</td>
                  <td className="px-4 py-3 text-ink/60 font-mono text-xs">{r.job_id}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${r.match_score >= 70 ? "text-green-600" : r.match_score >= 50 ? "text-amber-600" : "text-red-500"}`}>
                      {r.match_score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/50 text-xs truncate max-w-xs">{r.matched_skills}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, suffix = "" }) {
  return (
    <div className="border border-ink/10 rounded-xl p-5 bg-white">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-xs text-ink/40 mb-1">{label}</p>
      <p className="font-display text-2xl font-semibold">
        {value}
        <span className="text-sm text-ink/30 font-body">{suffix}</span>
      </p>
    </div>
  );
}
