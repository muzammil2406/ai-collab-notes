# AI-Powered Knowledge Base

A smart notes app with AI-powered summarization, auto-tagging, and Q&A. Built with NestJS, Next.js 14, and Groq AI.

## Links

- **Frontend**: https://frontend-xi-ochre-68.vercel.app
- **Backend API**: https://kb-api-qru1.onrender.com
- **GitHub**: https://github.com/muzammil2406/ai-collab-notes

## Features

- Create and edit notes with Markdown editor
- AI-powered summaries (one-click)
- Auto-suggested tags based on content
- Ask questions about your notes (AI Q&A)
- Search and filter by tags
- Dashboard with stats and tag cloud
- JWT authentication (register/login)

## Tech Stack

| Tier | Technology |
|---|---|
| Backend | NestJS 10, TypeScript |
| Frontend | Next.js 14, Tailwind CSS, TypeScript |
| Database | PostgreSQL (Neon.tech) via Prisma ORM |
| AI | Groq API (llama-3.3-70b-versatile) |
| Auth | JWT + bcrypt |
| Hosting | Render (backend) + Vercel (frontend) |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Neon.tech account)
- Groq API key (free at https://console.groq.com/keys)

### Backend Setup

```bash
cd backend
npm install
npx prisma db push
npm run start:dev
```

Create `backend/.env`:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-random-secret"
GROQ_API_KEY="gsk-..."
FRONTEND_URL="http://localhost:3000"
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

Open http://localhost:3000, register an account, and start creating notes.

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Register user |
| POST | /api/auth/login | No | Login, returns JWT |
| GET | /api/notes | Yes | List notes (query: search, tag) |
| POST | /api/notes | Yes | Create note |
| GET | /api/notes/:id | Yes | Get note |
| PUT | /api/notes/:id | Yes | Update note |
| DELETE | /api/notes/:id | Yes | Delete note |
| GET | /api/notes/stats | Yes | Dashboard stats + tag cloud |
| POST | /api/ai/summarize | Yes | Generate summary |
| POST | /api/ai/tags | Yes | Suggest tags |
| POST | /api/ai/ask | Yes | Ask about your notes |

## Deployment

Push to `main` branch → Render and Vercel auto-deploy.

### Render (backend)

Set environment variables in Render dashboard:
- `DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`, `FRONTEND_URL`

### Vercel (frontend)

Set environment variable in Vercel dashboard:
- `NEXT_PUBLIC_API_URL` = your Render backend URL

## License

MIT
