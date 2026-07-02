---
title: AI Resume Match API
emoji: 🎯
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# AI Resume Match — Backend API

FastAPI backend for the AI Resume Screening & Job Recommendation System.

## How it works (RAG pipeline)

1. **Retrieval** — the uploaded resume and job description are embedded using
   `sentence-transformers` (`all-MiniLM-L6-v2`, free, CPU-only, no API key needed).
   Cosine similarity between the embeddings produces the match score. Skill
   keywords are extracted from both texts and diffed to find matched / missing skills.
2. **Generation** — the retrieved match context (score, matched skills, missing
   skills) is passed to a free LLM (Groq / Llama 3) to generate a natural-language
   explanation of the score. If no `GROQ_API_KEY` secret is set, a template-based
   explanation is used instead — the app is fully functional either way.

## Environment variables (set as Space secrets)

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | No | Free API key from console.groq.com — enables LLM-generated explanations |
| `GROQ_MODEL` | No | Defaults to `llama-3.1-8b-instant` |

## API Endpoints

- `GET /api/jobs` — list job postings
- `POST /api/jobs` — create a job posting
- `POST /api/screen` — upload a resume (PDF/DOCX) + job_id or job_description → returns match score, matched/missing skills, AI explanation
- `GET /api/dashboard` — summary stats + recent screenings

## Local development

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` for interactive Swagger API docs.
