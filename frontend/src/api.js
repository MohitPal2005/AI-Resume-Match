// Backend base URL — set VITE_API_URL in Vercel env vars once deployed to your HF Space
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getJobs() {
  const res = await fetch(`${API_URL}/api/jobs`);
  if (!res.ok) throw new Error("Failed to load jobs");
  return res.json();
}

export async function createJob({ title, description, location, work_mode }) {
  const form = new FormData();
  form.append("title", title);
  form.append("description", description);
  form.append("location", location);
  form.append("work_mode", work_mode);
  const res = await fetch(`${API_URL}/api/jobs`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to create job");
  return res.json();
}

export async function screenResume({ file, jobId, jobDescription, candidateName }) {
  const form = new FormData();
  form.append("resume", file);
  if (jobId) form.append("job_id", jobId);
  if (jobDescription) form.append("job_description", jobDescription);
  form.append("candidate_name", candidateName || "Candidate");

  const res = await fetch(`${API_URL}/api/screen`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Screening failed" }));
    throw new Error(err.detail || "Screening failed");
  }
  return res.json();
}

export async function getDashboard() {
  const res = await fetch(`${API_URL}/api/dashboard`);
  if (!res.ok) throw new Error("Failed to load dashboard");
  return res.json();
}

export { API_URL };
