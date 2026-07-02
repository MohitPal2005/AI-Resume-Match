"""
AI Resume Match — Backend API
FastAPI + sentence-transformers (semantic matching) + Groq LLM (explanation generation)

RAG-style pipeline:
  1. RETRIEVE: embed resume text + job description, compute semantic similarity,
     extract overlapping / missing skill keywords (the retrieval step).
  2. AUGMENT + GENERATE: feed the retrieved match context into a free LLM (Groq / Llama 3)
     to generate a natural-language explanation of the score. Falls back to a
     template-based explanation if no LLM API key is configured, so the app
     always works even with zero cost / zero setup.
"""

import os
import re
import io
import sqlite3
import uuid
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import pdfplumber
import docx as docx_lib
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(title="AI Resume Match API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your Vercel domain after deploying
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.environ.get("DB_PATH", "ai_resume_match.db")

# Embedding model — small, fast, free, runs fine on HF Spaces free CPU tier
_model = None
def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model

# Optional free LLM (Groq) for generating the human-readable explanation.
# If GROQ_API_KEY is not set, we fall back to a template explanation.
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")

SKILL_VOCAB = [
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "php",
    "react", "react.js", "vue", "vue.js", "angular", "node.js", "next.js",
    "flask", "django", "fastapi", "spring boot", "express",
    "sql", "mysql", "postgresql", "mongodb", "sqlite", "redis",
    "aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "terraform",
    "machine learning", "deep learning", "nlp", "tensorflow", "pytorch",
    "pandas", "numpy", "scikit-learn", "data analysis", "data visualization",
    "html", "css", "tailwind", "figma", "rest api", "graphql", "microservices",
    "git", "github", "agile", "scrum", "linux", "excel", "power bi", "tableau",
]

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.executescript("""
    CREATE TABLE IF NOT EXISTS job_postings (
        job_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        required_skills TEXT,
        location TEXT,
        work_mode TEXT,
        posted_date TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS screening_results (
        screening_id TEXT PRIMARY KEY,
        candidate_name TEXT,
        job_id TEXT,
        match_score REAL,
        matched_skills TEXT,
        missing_skills TEXT,
        ai_explanation TEXT,
        screened_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    """)
    # Seed a few sample jobs if empty
    cur.execute("SELECT COUNT(*) FROM job_postings")
    if cur.fetchone()[0] == 0:
        sample_jobs = [
            ("J001", "Senior Python Developer",
             "Build scalable backend systems using Python, Flask/FastAPI, and PostgreSQL. Experience with AWS and Docker preferred.",
             "python, flask, fastapi, postgresql, aws, docker", "Bangalore", "hybrid"),
            ("J002", "Frontend Engineer",
             "Develop responsive user interfaces using React, TypeScript and Tailwind CSS. Familiarity with REST APIs required.",
             "react, typescript, tailwind, html, css, rest api", "Remote", "remote"),
            ("J003", "Data Analyst",
             "Analyze business data using SQL, Excel, and Python. Build dashboards with Power BI or Tableau.",
             "sql, python, excel, power bi, tableau, data analysis", "Pune", "onsite"),
            ("J004", "Machine Learning Engineer",
             "Design and train ML models using PyTorch or TensorFlow. Deploy models with Docker and cloud infrastructure.",
             "python, machine learning, pytorch, tensorflow, docker, aws", "Hyderabad", "hybrid"),
        ]
        cur.executemany(
            "INSERT INTO job_postings (job_id, title, description, required_skills, location, work_mode) VALUES (?,?,?,?,?,?)",
            sample_jobs,
        )
    conn.commit()
    conn.close()

init_db()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = docx_lib.Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in doc.paragraphs)

def extract_skills(text: str) -> List[str]:
    text_lower = text.lower()
    found = []
    for skill in SKILL_VOCAB:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_lower):
            found.append(skill)
    return sorted(set(found))

def semantic_score(resume_text: str, job_text: str) -> float:
    model = get_model()
    embeddings = model.encode([resume_text, job_text])
    sim = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    LOWER, UPPER = 0.25, 0.68
    score = max(0, min(100, (sim - LOWER) / (UPPER - LOWER) * 100))
    return round(float(score), 1)

def blended_score(semantic: float, matched: list, missing: list) -> float:
    total_required = len(matched) + len(missing)
    skill_ratio = (len(matched) / total_required * 100) if total_required else semantic
    final = 0.55 * semantic + 0.45 * skill_ratio
    return round(max(0, min(100, final)), 1)

def generate_explanation(candidate_name: str, matched: List[str], missing: List[str], score: float) -> str:
    """RAG generation step — uses Groq LLM if configured, else a template fallback."""
    if GROQ_API_KEY:
        try:
            import requests
            prompt = (
                f"A candidate named {candidate_name} was screened against a job posting with a "
                f"match score of {score}/100. Matched skills: {', '.join(matched) or 'none'}. "
                f"Missing skills: {', '.join(missing) or 'none'}. "
                f"In 2-3 sentences, explain in plain English why this candidate received this score, "
                f"referencing the specific matched and missing skills. Be concise and professional."
            )
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                json={
                    "model": GROQ_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 200,
                    "temperature": 0.4,
                },
                timeout=15,
            )
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"].strip()
        except Exception:
            pass  # fall through to template

    # Template fallback (always works, zero cost, zero setup)
    if score >= 75:
        tier = "a strong match"
    elif score >= 50:
        tier = "a moderate match"
    else:
        tier = "a weak match"
    matched_str = ", ".join(matched[:5]) if matched else "no directly matched skills"
    missing_str = ", ".join(missing[:5]) if missing else "no major gaps"
    return (
        f"{candidate_name} is {tier} for this role with a score of {score}/100. "
        f"The resume shows strong overlap in {matched_str}. "
        f"Key gaps compared to the job requirements: {missing_str}."
    )

# ---------------------------------------------------------------------------
# API Models
# ---------------------------------------------------------------------------
class JobOut(BaseModel):
    job_id: str
    title: str
    description: str
    required_skills: str
    location: str
    work_mode: str

class ScreenResult(BaseModel):
    screening_id: str
    candidate_name: str
    match_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    ai_explanation: str

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    return {"status": "ok", "service": "AI Resume Match API"}

@app.get("/api/jobs", response_model=List[JobOut])
def list_jobs():
    conn = get_db()
    rows = conn.execute("SELECT * FROM job_postings ORDER BY posted_date DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/jobs", response_model=JobOut)
def create_job(title: str = Form(...), description: str = Form(...),
                location: str = Form("Remote"), work_mode: str = Form("remote")):
    job_id = "J" + str(uuid.uuid4())[:6].upper()
    skills = extract_skills(description)
    conn = get_db()
    conn.execute(
        "INSERT INTO job_postings (job_id, title, description, required_skills, location, work_mode) VALUES (?,?,?,?,?,?)",
        (job_id, title, description, ", ".join(skills), location, work_mode),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM job_postings WHERE job_id=?", (job_id,)).fetchone()
    conn.close()
    return dict(row)

@app.post("/api/screen", response_model=ScreenResult)
async def screen_resume(
    resume: UploadFile = File(...),
    job_id: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
    candidate_name: Optional[str] = Form("Candidate"),
):
    if not job_id and not job_description:
        raise HTTPException(400, "Provide either job_id or job_description")

    # Resolve job description text
    if job_id:
        conn = get_db()
        job_row = conn.execute("SELECT * FROM job_postings WHERE job_id=?", (job_id,)).fetchone()
        conn.close()
        if not job_row:
            raise HTTPException(404, f"Job {job_id} not found")
        jd_text = job_row["description"]
    else:
        jd_text = job_description

    # Extract resume text
    file_bytes = await resume.read()
    filename = resume.filename.lower()
    if filename.endswith(".pdf"):
        resume_text = extract_text_from_pdf(file_bytes)
    elif filename.endswith(".docx"):
        resume_text = extract_text_from_docx(file_bytes)
    else:
        raise HTTPException(400, "Only PDF and DOCX resumes are supported")

    if not resume_text.strip():
        raise HTTPException(422, "Could not extract text from resume — file may be a scanned image")

    # RETRIEVAL: semantic similarity + skill extraction
    raw_semantic = semantic_score(resume_text, jd_text)
    resume_skills = set(extract_skills(resume_text))
    jd_skills = set(extract_skills(jd_text))
    matched = sorted(resume_skills & jd_skills)
    missing = sorted(jd_skills - resume_skills)
    score = blended_score(raw_semantic, matched, missing)

    # GENERATION: LLM (or template) explanation
    explanation = generate_explanation(candidate_name, matched, missing, score)

    screening_id = "S" + str(uuid.uuid4())[:6].upper()
    conn = get_db()
    conn.execute(
        "INSERT INTO screening_results (screening_id, candidate_name, job_id, match_score, matched_skills, missing_skills, ai_explanation) VALUES (?,?,?,?,?,?,?)",
        (screening_id, candidate_name, job_id or "custom", score, ", ".join(matched), ", ".join(missing), explanation),
    )
    conn.commit()
    conn.close()

    return {
        "screening_id": screening_id,
        "candidate_name": candidate_name,
        "match_score": score,
        "matched_skills": matched,
        "missing_skills": missing,
        "ai_explanation": explanation,
    }

@app.get("/api/dashboard")
def dashboard():
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) c FROM screening_results").fetchone()["c"]
    avg_score = conn.execute("SELECT AVG(match_score) a FROM screening_results").fetchone()["a"] or 0
    active_jobs = conn.execute("SELECT COUNT(*) c FROM job_postings").fetchone()["c"]
    recent = conn.execute(
        "SELECT * FROM screening_results ORDER BY screened_at DESC LIMIT 20"
    ).fetchall()
    conn.close()
    return {
        "total_screened": total,
        "average_match_score": round(avg_score, 1),
        "active_jobs": active_jobs,
        "recent_screenings": [dict(r) for r in recent],
    }
