# AI Resume Match

A full-stack AI Resume Screening & Job Recommendation System — built as a real,
deployable RAG (Retrieval-Augmented Generation) application.

**Live demo:** _add your Vercel URL here once deployed_
**Backend API:** _add your Hugging Face Space URL here once deployed_

## How it works

1. **Retrieve** — resume + job description are embedded with `sentence-transformers`
   (`all-MiniLM-L6-v2`, free, runs on CPU). Cosine similarity gives a real semantic
   match score. Skill keywords are extracted and diffed between resume and job.
2. **Generate** — the retrieved match context (score, matched/missing skills) is
   passed to a free LLM (Llama 3 via Groq) which writes a plain-English explanation.
   Falls back to a template explanation if no API key is configured — the app
   always works.

## Stack

- **Backend:** FastAPI, sentence-transformers, scikit-learn, pdfplumber, python-docx — deployed on Hugging Face Spaces (Docker)
- **Frontend:** React + Vite + Tailwind CSS + React Router — deployed on Vercel

## Project structure

```
ai-resume-match/
├── backend/
│   ├── app/main.py       ← FastAPI app (all API logic)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md          ← HF Spaces config + docs
├── frontend/
│   ├── src/
│   │   ├── pages/          (Home, Screen, Dashboard)
│   │   ├── components/     (Layout)
│   │   └── api.js           (backend API client)
│   ├── vercel.json
│   └── .env.example
└── DEPLOYMENT.md          ← full step-by-step deploy guide
```

## Quick start (local development)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# runs on http://localhost:8000
```

**Frontend:**
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
# runs on http://localhost:5173
```

## Deploying it live

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full step-by-step guide
(Hugging Face Spaces + Vercel + GitHub, ~20 minutes, completely free).

## Why this project

Built to demonstrate an end-to-end AI product: real embedding-based semantic
search, LLM-generated explanations grounded in retrieved context (RAG), a
working REST API, and a production frontend — not just a notebook.
