# PanelX — Setup & Run Guide

AI-powered interview platform. This guide gets it running on a Windows machine.

> This zip **includes** the frontend `node_modules` folder, so you do NOT need to
> run `npm install`. You only need to set up Python for the backend.

---

## 1. Prerequisites (install these first)

### a) Python 3.11 or newer
- Download: https://www.python.org/downloads/
- **IMPORTANT:** during install, tick **"Add Python to PATH"**.
- Verify in a terminal:
  ```
  python --version
  ```

### b) Node.js 18 or newer (for the frontend)
- Download: https://nodejs.org/ (LTS version)
- Verify:
  ```
  node --version
  ```

### c) MongoDB Community Server
- Download: https://www.mongodb.com/try/download/community
- During install, choose **"Install MongoDB as a Service"** (auto-starts on boot).
- It then runs in the background on `localhost:27017`.

### Browser
- Use **Google Chrome** or **Microsoft Edge**.
- Voice / speech-to-text does NOT work in Firefox.

### Internet
- Required — the AI runs on AWS Bedrock (cloud).

---

## 2. Get the code (clone from GitHub)

Open a terminal where you want the project, then:

```powershell
git clone https://github.com/Omicron6/panelX.git
cd panelX
```

> Note: `node_modules` is NOT in the repo (too large for GitHub), so you WILL run
> `npm install` for the frontend (see step 4).

### Create the .env files (required — they hold config + AWS keys)

The repo ships `.env.example` templates. Copy them to real `.env` files:

```powershell
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Then open `backend\.env` and paste the **AWS keys** (ask the project owner for these —
they are not in the repo for security). Replace:
```
AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID"
AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY"
```
with the real values provided to you. Without these, the AI will not work.

---

## 3. Run the BACKEND

Open PowerShell in the `backend` folder.
> Tip: open the `backend` folder in File Explorer, type `powershell` in the address bar, press Enter.

Run these one at a time:

```powershell
# 1. Create a Python virtual environment
python -m venv .venv

# 2. Activate it
.\.venv\Scripts\Activate.ps1

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Start the backend
python server.py
```

Success looks like:
```
Uvicorn running on http://0.0.0.0:8001
```
**Leave this terminal open.**

---

## 4. Run the FRONTEND

Open a **SECOND** PowerShell window in the `frontend` folder (keep the backend running).

```powershell
# 1. Install dependencies (required after a git clone).
#    The --legacy-peer-deps flag is REQUIRED or it fails with a peer-dependency error.
npm install --legacy-peer-deps

# 2. Start the frontend
npm start
```

The browser should open at **http://localhost:3000** automatically. If not, open Chrome/Edge and go there manually.

> First launch may take 30-60 seconds to compile. Wait for "Compiled successfully" / the page to load.

---

## 5. Demo flow

1. Go to `http://localhost:3000`.
2. Click **Login** → enter ANY email + ANY password (3+ chars). Toggle **Admin** / **Candidate**.
3. **As Admin** → **Create Session** → fill job description, skills, resume → create.
4. **Log out → log in as Candidate** → the session appears on **Dashboard** and **Interviews**.
5. Click **Start Interview** → **allow camera + microphone**.
   - The AI greets you and reads each question aloud.
   - Click **🎤 Speak Answer** and talk — your words appear in the answer box.
   - Stop talking for ~5 seconds and it auto-submits, or click **Submit Answer**.
6. **Proctoring:** looking away, covering the camera, or switching tabs = a warning.
   After **3 warnings** the interview ends automatically.
7. **As Admin → Results** → see each candidate's score, and a red **Disqualified** badge
   with the warning count if they were caught cheating.

---

## 6. Troubleshooting (common errors & fixes)

| Problem | Fix |
|---|---|
| `python is not recognized` | Python not on PATH. Reinstall Python, tick "Add to PATH", reopen terminal. |
| `Activate.ps1 cannot be loaded ... disabled` | Run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` then retry step 2. |
| Backend error: connection refused / MongoDB | MongoDB isn't running. Open Windows **Services**, find **MongoDB Server**, make sure it's **Running** (right-click → Start). |
| `pip install` fails | Make sure the venv is activated (you should see `(.venv)` in the prompt). Retry `pip install -r requirements.txt`. |
| Frontend: `'craco' is not recognized` OR white screen | node_modules may be incomplete. In `frontend`, run: `npm install --legacy-peer-deps` then `npm start`. |
| Frontend: `Cannot find module 'ajv'` | In `frontend`, run: `npm install ajv@8 --legacy-peer-deps` then `npm start`. |
| "Something is already running on port 3000" | Press `n`, or close the other app using port 3000, or restart the PC. |
| Frontend loads but interview shows no answer box / no voice | Use **Chrome or Edge** (not Firefox), and **allow microphone** when prompted. Then hard-refresh with **Ctrl + Shift + R**. |
| AI questions not generating / errors on start | Check internet connection (AI needs AWS). The AWS keys are already set in `backend/.env` — don't change them. |
| Old UI showing after an update | Hard-refresh the browser: **Ctrl + Shift + R** (clears cached page). |

---

## 7. Running it again later (after first setup)

**Terminal 1 — backend:**
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python server.py
```

**Terminal 2 — frontend:**
```powershell
cd frontend
npm start
```

Then open `http://localhost:3000` in Chrome/Edge.

---

## 8. Notes
- Keep BOTH terminals open during the demo (backend + frontend).
- The AWS credentials in `backend/.env` power the AI — already configured, leave them as-is.
- Requires an internet connection.
- Use Chrome or Edge for the voice features.
