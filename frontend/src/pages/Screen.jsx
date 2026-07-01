import { useState, useEffect, useRef } from "react";
import { Upload, FileText, Loader2, Check, X, AlertCircle } from "lucide-react";
import { getJobs, screenResume } from "../api";

export default function Screen() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [customJD, setCustomJD] = useState("");
  const [useCustomJD, setUseCustomJD] = useState(false);
  const [file, setFile] = useState(null);
  const [candidateName, setCandidateName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getJobs()
      .then((data) => {
        setJobs(data);
        if (data.length) setSelectedJob(data[0].job_id);
      })
      .catch(() => setError("Could not load job postings — is the backend running?"));
  }, []);

  function handleFile(f) {
    if (!f) return;
    const ext = f.name.toLowerCase();
    if (!ext.endsWith(".pdf") && !ext.endsWith(".docx")) {
      setError("Only PDF and DOCX files are supported.");
      return;
    }
    setError("");
    setFile(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) { setError("Please upload a resume file."); return; }
    if (!useCustomJD && !selectedJob) { setError("Please select a job posting."); return; }
    if (useCustomJD && !customJD.trim()) { setError("Please paste a job description."); return; }

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await screenResume({
        file,
        jobId: useCustomJD ? null : selectedJob,
        jobDescription: useCustomJD ? customJD : null,
        candidateName: candidateName || "Candidate",
      });
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong during screening.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <h1 className="font-display text-3xl font-semibold mb-2">Screen a resume</h1>
      <p className="text-ink/60 mb-10">Upload a resume and match it against a job posting using real semantic AI.</p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Candidate name</label>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full px-4 py-2.5 rounded-lg border border-ink/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Resume file (PDF or DOCX)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files[0]);
              }}
              className={`dropzone cursor-pointer border-2 border-dashed rounded-xl p-8 text-center ${
                dragOver ? "dragover border-indigo-500 bg-indigo-50" : "border-ink/15"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-indigo-700">
                  <FileText size={18} />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
              ) : (
                <>
                  <Upload size={22} className="mx-auto mb-2 text-ink/30" />
                  <p className="text-sm text-ink/50">Drag & drop your resume, or click to browse</p>
                  <p className="text-xs text-ink/30 mt-1">PDF or DOCX only</p>
                </>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Job to match against</label>
              <button
                type="button"
                onClick={() => setUseCustomJD(!useCustomJD)}
                className="text-xs text-indigo-600 font-medium hover:underline"
              >
                {useCustomJD ? "Choose from sample jobs" : "Paste custom job description"}
              </button>
            </div>

            {useCustomJD ? (
              <textarea
                value={customJD}
                onChange={(e) => setCustomJD(e.target.value)}
                rows={5}
                placeholder="Paste a job description here..."
                className="w-full px-4 py-2.5 rounded-lg border border-ink/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
              />
            ) : (
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-ink/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm bg-white"
              >
                {jobs.map((j) => (
                  <option key={j.job_id} value={j.job_id}>
                    {j.title} — {j.location} ({j.work_mode})
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Analyzing resume...
              </>
            ) : (
              "Analyze resume"
            )}
          </button>
        </form>

        {/* Right: results */}
        <div>
          {!result && !loading && (
            <div className="h-full flex items-center justify-center border border-dashed border-ink/10 rounded-xl p-10 text-center text-ink/30 text-sm">
              Results will appear here once you analyze a resume.
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center border border-ink/10 rounded-xl p-10 text-center gap-3">
              <Loader2 size={28} className="animate-spin text-indigo-600" />
              <p className="text-sm text-ink/50">Embedding resume, computing similarity, generating explanation...</p>
            </div>
          )}

          {result && (
            <div className="border border-ink/10 rounded-xl p-6 bg-white space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-ink/40 mb-1">Candidate</p>
                  <p className="font-medium">{result.candidate_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink/40 mb-1">Match Score</p>
                  <p className="font-display text-4xl font-semibold text-indigo-600">
                    {result.match_score}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-ink/50 mb-2 flex items-center gap-1">
                  <Check size={12} className="text-green-600" /> Matched Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matched_skills.length ? result.matched_skills.map((s) => (
                    <span key={s} className="text-xs font-mono px-2 py-1 rounded bg-green-50 text-green-700">{s}</span>
                  )) : <span className="text-xs text-ink/30">None found</span>}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-ink/50 mb-2 flex items-center gap-1">
                  <X size={12} className="text-red-500" /> Missing Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missing_skills.length ? result.missing_skills.map((s) => (
                    <span key={s} className="text-xs font-mono px-2 py-1 rounded bg-red-50 text-red-600">{s}</span>
                  )) : <span className="text-xs text-ink/30">None — full skill coverage</span>}
                </div>
              </div>

              <div className="pt-4 border-t border-ink/5">
                <p className="text-xs font-medium text-ink/50 mb-2">AI Explanation</p>
                <p className="text-sm text-ink/70 leading-relaxed">{result.ai_explanation}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
