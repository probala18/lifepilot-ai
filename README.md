# LifePilot AI — Autonomous Multi-Agent Personal Intelligence

LifePilot AI is an autonomous personal intelligence platform designed to eliminate cognitive overload. Rather than relying on generic, hallucination-prone chatbots, LifePilot operates a deterministic triage pipeline across three specialized domain agents, persists all schedules locally in SQLite, and dispatches automated reminder emails via a background cron worker.

Designed with an ultra-clean **Slate Minimal** design language, zero gradients, pure solid surfaces, and fluid micro-animations powered by Framer Motion.

---

## Key Capabilities

### 1. Tri-Agent Architecture

- **Personal Assistant Agent (`/assistant`)**:
  - Parses natural language inquiries (e.g., *"Remind me to submit Q3 budget this Friday at 4pm"*).
  - Deterministically extracts task descriptions, compute target dates, and recommends follow-up actions.
  - Persists scheduled reminders synchronously into local SQLite storage.
- **Shopping Decision Engine (`/shopping`)**:
  - Delivers objective, unbiased product evaluations and specification breakdowns.
  - Formulates structured pros/cons and highlights high-value alternatives.
- **Symptom Analyzer Agent (`/health`)**:
  - Clinical-grade triage protocol designed to cross-reference symptom severity.
  - Surfaces emergency red flags, self-care suggestions, and mandatory medical disclaimers.

### 2. Dual-Theme Design System
- **Dark Mode (Obsidian Minimal)**: Deep obsidian canvas (`#090b0e`), slate cards (`#10141a`), hairline borders (`#1e2430`), and soft cobalt accents.
- **Light Mode (Crisp Porcelain)**: Architectural slate canvas (`#f8fafc`), stark white cards (`#ffffff`), rich obsidian ink typography (`#0f172a`), and crisp slate borders (`#e2e8f0`).
- Seamless toggle with automatic system preference detection and `localStorage` persistence.

### 3. OpenRouter Free Tier & Resilient LLM Engine
- Fully integrated with OpenRouter free models (`meta-llama/llama-3.3-70b-instruct:free`, `deepseek/deepseek-r1:free`, `google/gemini-2.0-flash-exp:free`).
- Transparent Chain-of-Thought reasoning logs displayed in expandable UI cards.
- **Zero-Failure Architecture**: Includes automatic fallback to AWS Bedrock and a built-in deterministic local agent parser so task scheduling and inquiry parsing never fail.

### 4. Local SQLite Persistence & Automated Cron Dispatch
- **Storage**: Fast, local WAL-mode SQLite database (`lifepilot.db`).
- **Cron Poller**: Background worker (`node-cron`) checks every 60 seconds for due tasks.
- **Email Delivery**: Automated SMTP dispatch via Nodemailer when tasks become due, automatically flagging `reminder_sent = 1` in SQLite to prevent duplicate emails.
- **Interactive Task Drawer**: Slide-out task management tray to review, filter (pending/completed), toggle, or delete tasks in real time.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Framer Motion, Lucide Icons
- **Backend**: Node.js (v20+ / v26 compatible), Express
- **Database**: SQLite (`better-sqlite3` in WAL mode)
- **Task Scheduling & Email**: `node-cron`, `nodemailer`
- **LLM Services**: OpenRouter API with AWS Bedrock fallback

---

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- `npm` package manager

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/proBala03/lifepilot-ai.git
cd lifepilot-ai
npm install
```

### 3. Configuration
Copy the example environment configuration:
```bash
cp .env.example .env
```

Configure the following variables in `.env`:
```env
# Server Port (Default is 3005 to prevent conflicts with other localhost apps)
PORT=3005
APP_URL="http://localhost:3005"

# OpenRouter Configuration (Free models)
# Get a free key at https://openrouter.ai/keys
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="meta-llama/llama-3.3-70b-instruct:free"

# Email Notifications (Optional for Cron Reminders)
# Generate a Google App Password at: https://myaccount.google.com/apppasswords
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"
```

### 4. Running the Development Server
Launch the unified server and frontend:
```bash
npm run dev
```

Open your browser at:
👉 **[http://localhost:3005](http://localhost:3005)**

---

## Verifying the Task & Reminder Cron Engine

LifePilot includes an automated test script to verify that SQLite candidate detection, cron evaluation, and SMTP email dispatch are functioning properly:

```bash
npm run test:cron
```

**Expected output:**
```
───────────────────────────────────────────────────────
 LifePilot AI · Task & Reminder Cronjob Verification
───────────────────────────────────────────────────────
[1/4] SQLite database initialized.
[2/4] Created test task #20:
      Task: "CRON VERIFICATION: Review quarterly cloud budget allocation"
      Due At: 2026-10-18T17:24:22.393Z
      Recipient: your-email@gmail.com
      reminder_sent initial value: 0
[3/4] Candidate detection check: PASS (Found in due list)
[4/4] Executing checkAndDispatchDueReminders()...
[email] SMTP transporter verified
[email] Reminder sent to your-email@gmail.com for task "CRON VERIFICATION"
>>> SUCCESS: Task #20 reminder_sent was successfully flagged as 1 in SQLite.
[Clean-up] Removed test task #20 from database.
───────────────────────────────────────────────────────
 Cronjob verification completed successfully!
───────────────────────────────────────────────────────
```

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/agent` | Unified agent gateway (`{ agent: 'assistant' \| 'shopping' \| 'health', message: string }`) |
| `GET` | `/api/tasks` | Fetches all stored tasks from SQLite |
| `PATCH` | `/api/tasks/:id/complete` | Toggles completion status of a task |
| `DELETE` | `/api/tasks/:id` | Permanently deletes a task from SQLite |
| `POST` | `/api/test/trigger-cron` | Manually triggers the due-reminder dispatch routine |

---

## Project Structure

```
lifepilot-ai/
├── server/
│   ├── agents/
│   │   ├── personalAssistantAgent.ts   # Task extraction & SQLite scheduling
│   │   ├── shoppingDecisionAgent.ts    # Comparative product trade-off engine
│   │   └── symptomAnalyzerAgent.ts     # Health triage assessment & disclaimers
│   ├── cron/
│   │   └── reminderCron.ts             # 60-second automated poller & dispatcher
│   ├── db/
│   │   ├── database.ts                 # SQLite schema initialization (WAL mode)
│   │   └── taskRepository.ts           # Task queries, inserts, status updates
│   ├── routes/
│   │   ├── api.ts                      # Agent and task REST endpoints
│   │   └── auth.ts                     # Backward-compatible auth route stubs
│   ├── services/
│   │   ├── openRouterService.ts        # OpenRouter free tier client & reasoning parser
│   │   ├── novaService.ts              # Unified LLM gateway with offline fallback
│   │   └── emailService.ts             # Nodemailer transporter & HTML templates
│   └── testCronJob.ts                  # Cron verification script (`npm run test:cron`)
├── src/
│   ├── components/
│   │   ├── AgentCard.tsx               # Interactive agent capability cards
│   │   ├── ChatInterface.tsx           # Full landing page, workspace & chat stream
│   │   ├── ChatMessage.tsx             # Solid card message view with reasoning trace
│   │   ├── Hero.tsx                    # Minimalist architectural landing hero
│   │   └── TaskTray.tsx                # Slide-out SQLite task drawer
│   ├── App.tsx
│   └── index.css                       # Curated Dark & White theme design tokens
├── server.ts                           # Express server & Vite development middleware
└── package.json
```

---

## License

MIT License. Designed and built for seamless local autonomy.
