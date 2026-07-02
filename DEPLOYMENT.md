# Deploying AI Resume Match — Step by Step

You'll deploy two pieces:
1. **Backend** (FastAPI + AI logic) → Hugging Face Spaces (free)
2. **Frontend** (React) → Vercel (free)

Total time: ~20-25 minutes. No credit card needed anywhere.

---

## Part 1 — Get a free Groq API key (2 min, optional but recommended)

This powers the LLM-generated explanations. Without it, the app still works fully
using a template-based explanation — so you can skip this and add it later.

1. Go to https://console.groq.com
2. Sign up (free, no card required)
3. Go to **API Keys** → **Create API Key**
4. Copy the key (starts with `gsk_...`) — you'll paste it into Hugging Face in Part 2

---

## Part 2 — Deploy the backend to Hugging Face Spaces

1. Go to https://huggingface.co and sign up / log in (free)
2. Click your profile icon → **New Space**
3. Fill in:
   - **Space name**: `ai-resume-match` (or anything you like)
   - **License**: MIT (or your choice)
   - **Select the Space SDK**: choose **Docker** → **Blank**
   - **Space hardware**: CPU basic (free) is enough
   - Visibility: Public
4. Click **Create Space**
5. On the new Space page, click **Files** → **Add file** → **Upload files**
6. Upload everything inside the `backend/` folder (keeping the `app/` subfolder structure):
   - `Dockerfile`
   - `requirements.txt`
   - `README.md`
   - `app/main.py`

   Easier alternative: use `git` instead of the web UI —
   ```bash
   git clone https://huggingface.co/spaces/YOUR_USERNAME/ai-resume-match
   cp -r backend/* ai-resume-match/
   cd ai-resume-match
   git add .
   git commit -m "Initial backend deploy"
   git push
   ```
   (Hugging Face will ask you to log in with a token — get one from
   Settings → Access Tokens, use it as the password.)

7. **Add your Groq key as a secret** (if you got one in Part 1):
   - On your Space page → **Settings** → **Variables and secrets** → **New secret**
   - Name: `GROQ_API_KEY`, Value: your `gsk_...` key
8. The Space will automatically build and start. Watch the **Logs** tab —
   first build takes ~3-5 minutes (it needs to download the embedding model).
9. Once it says "Running", your backend is live at:
   ```
   https://YOUR_USERNAME-ai-resume-match.hf.space
   ```
10. Test it: visit `https://YOUR_USERNAME-ai-resume-match.hf.space/api/jobs`
    in your browser — you should see JSON with 4 sample jobs.

---

## Part 3 — Deploy the frontend to Vercel

1. Go to https://vercel.com and sign up / log in (free, can use GitHub login)
2. First, push the `frontend/` folder to a **GitHub repo** (see Part 4 below —
   do that first, then come back here), or use the Vercel CLI directly:
   ```bash
   cd frontend
   npm install -g vercel
   vercel login
   vercel
   ```
3. If deploying via the Vercel dashboard instead:
   - Click **Add New** → **Project**
   - Import your GitHub repo
   - **Root Directory**: set to `frontend`
   - Framework Preset: Vite (auto-detected)
   - **Environment Variables** → add:
     - `VITE_API_URL` = `https://YOUR_USERNAME-ai-resume-match.hf.space`
       (your Hugging Face Space URL from Part 2, no trailing slash)
   - Click **Deploy**
4. In ~1 minute you'll get a live URL like:
   ```
   https://ai-resume-match.vercel.app
   ```

That's it — this is now a real, live, clickable link. Anyone can open it,
upload a resume, and get a real AI-generated match score.

---

## Part 4 — Push everything to GitHub (do this alongside Part 3)

```bash
cd ai-resume-match
git init
git add .
git commit -m "AI Resume Match — full stack app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-resume-match.git
git push -u origin main
```

If you don't have a repo yet: go to github.com → **New repository** →
name it `ai-resume-match` → don't initialize with a README (you already have one) →
create, then run the commands above.

---

## Troubleshooting

**"Failed to load jobs" on the frontend** → Check `VITE_API_URL` in Vercel's
environment variables exactly matches your HF Space URL, then redeploy
(Vercel → Deployments → ⋯ → Redeploy) — env var changes need a redeploy to take effect.

**Hugging Face Space stuck on "Building"** → First build downloads the
~80MB embedding model, this is normal and can take a few minutes. Check the
Logs tab for actual errors.

**CORS errors in browser console** → The backend already allows all origins
(`allow_origins=["*"]`) so this shouldn't happen. If it does, double check
you're hitting the right HF Space URL (not localhost).

**Free tier sleeping** → Hugging Face Spaces on the free tier may sleep after
inactivity and take ~30-60 seconds to wake on the next request. This is
normal and worth mentioning if a recruiter is testing it live.
