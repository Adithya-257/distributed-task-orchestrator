# distributed-task-orchestrator

"Production-grade distributed task queue with priority scheduling, parallel workers, fault tolerance, and real-time monitoring."

![Architecture](https://img.shields.io/badge/Architecture-Distributed%20System-6366f1?style=flat-square)
![Queue](https://img.shields.io/badge/Queue-Redis%20%7C%20BullMQ-dc2626?style=flat-square)
![Workers](https://img.shields.io/badge/Workers-Concurrent-22c55e?style=flat-square)
![Docker](https://img.shields.io/badge/Deployment-Docker-2496ED?style=flat-square&logo=docker)


![alt text](<Screenshot 2026-05-05 032611.png>)
<br>
![alt text](<Screenshot 2026-05-05 032919.png>)


---

## What This Is

Most AI applications call a model and wait. This system doesn't.

Instead, clients submit jobs and get an immediate response with a job ID. A distributed worker pool picks up jobs from a Redis priority queue, calls the Groq LLaMA 3.3 70B model, and writes results back to PostgreSQL. Clients poll for results or monitor live via the React dashboard.

This architecture mirrors how companies like OpenAI, Anthropic, and Scale AI handle high-throughput inference workloads in production.

---

## Architecture

```
┌─────────────┐     POST /jobs      ┌─────────────────┐
│   React     │ ─────────────────►  │   Express API   │
│  Dashboard  │ ◄─────────────────  │   (Producer)    │
└─────────────┘     job ID          └────────┬────────┘
                                             │ enqueue
                                             ▼
                                    ┌─────────────────┐
                                    │   Redis Queue   │
                                    │   (BullMQ)      │
                                    └────────┬────────┘
                                             │ dequeue
                                    ┌────────▼────────┐
                                    │  Worker Service │
                                    │  (Consumer)     │
                                    │  concurrency=5  │
                                    └────────┬────────┘
                                             │
                              ┌──────────────┴──────────────┐
                              ▼                             ▼
                     ┌─────────────────┐         ┌─────────────────┐
                     │   Groq API      │         │   PostgreSQL    │
                     │ LLaMA 3.3 70B   │         │  (job results)  │
                     └─────────────────┘         └─────────────────┘
```

---

## Features

- **5 AI task types** — Report generation, deep analysis, summarization, text classification, entity extraction
- **Priority queues** — Jobs assigned priority 0-2, higher priority processed first
- **Parallel processing** — Worker concurrency of 5, processes multiple jobs simultaneously
- **Automatic retries** — Failed jobs retry 3 times with exponential backoff (1s → 2s → 4s)
- **Dead letter queue** — Permanently failed jobs captured, logged, and marked in Postgres
- **Bull Board UI** — Real-time queue monitoring at `/admin/queues`
- **React dashboard** — Submit jobs, monitor status, view results, filter by type/status
- **Stress test** — One-click submission of 15 parallel jobs to demonstrate concurrency
- **Full Docker Compose** — Entire system starts with a single command
- **Graceful shutdown** — SIGTERM/SIGINT handling ensures no jobs lost on container stop

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API Framework | Express.js |
| Queue | BullMQ + Redis |
| Database | PostgreSQL |
| AI Model | LLaMA 3.3 70B via Groq |
| Frontend | React + Vite |
| Monitoring | Bull Board |
| Containerization | Docker + Docker Compose |
| Runtime | Node.js 22 |

---

## Project Structure

```bash
ai-orchestrator/
├── api-service/              # Express API — job submission & retrieval
│   └── src/
│       ├── routes/           # REST endpoints
│       ├── controllers/      # Business logic
│       ├── queues/           # BullMQ producer (job enqueue)
│       └── db/               # PostgreSQL pool & schema
│
├── worker-service/           # BullMQ worker — processes jobs
│   └── src/
│       ├── workers/          # Job consumers & processors
│       ├── services/         # Groq SDK wrapper & result handling
│       ├── queues/           # Queue connection & DLQ handler
│       └── db/               # PostgreSQL connection
│
├── dashboard/                # React + Vite frontend (UI)
└── docker-compose.yml        # Multi-service orchestration

```

---

## Getting Started

### Prerequisites
- Docker Desktop
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Run Locally

1. Clone the repository
```bash
git clone https://github.com/yourusername/ai-orchestrator.git
cd ai-orchestrator
```

2. Create root `.env` file
```bash
echo "GROQ_API_KEY=your_key_here" > .env
```

3. Start all services
```bash
docker compose up --build
```

4. Start the React dashboard
```bash
cd dashboard
npm install
npm run dev
```

5. Open in browser
- **Dashboard** → http://localhost:5173
- **API** → http://localhost:3000
- **Queue Monitor** → http://localhost:3000/admin/queues

---

## API Reference

### Submit a Job
```http
POST /jobs
Content-Type: application/json

{
  "type": "ai.report",
  "payload": { "topic": "Impact of AI on healthcare" },
  "priority": 1
}
```

**Response**
```json
{
  "jobId": "f17b3b6d-fc12-4c35-8c17-1f931f4149de",
  "status": "pending"
}
```

### Get Job Status
```http
GET /jobs/:id
```

**Response**
```json
{
  "id": "f17b3b6d-fc12-4c35-8c17-1f931f4149de",
  "type": "ai.report",
  "status": "done",
  "payload": { "topic": "Impact of AI on healthcare" },
  "result": { "output": "## Executive Summary..." },
  "created_at": "2026-04-22T20:07:05.444Z",
  "updated_at": "2026-04-22T20:07:12.231Z"
}
```

### Supported Task Types

| Type | Input | Description |
|------|-------|-------------|
| `ai.report` | `{ topic }` | Comprehensive structured report |
| `ai.analyze` | `{ topic }` | Deep analytical breakdown |
| `ai.summarize` | `{ text }` | Concise 3-5 sentence summary |
| `ai.classify` | `{ text, categories[] }` | Classify into provided categories |
| `ai.extract` | `{ text }` | Extract entities, facts, action items |

---

## Job Lifecycle

![alt text](<_- visual selection (2).png>)


---

## Key Design Decisions

**Why two separate services?**
The API and worker are intentionally decoupled. The API stays fast and stateless — its only job is to enqueue. The worker can scale independently. In production you could run 1 API instance and 10 worker instances.

**Why write to Postgres before enqueuing?**
If Redis goes down after enqueuing but before Postgres is written, the job is lost. Writing to Postgres first ensures there's always a paper trail, even if the queue fails.

**Why exponential backoff?**
Immediately retrying a failed job hammers a service that's already struggling. Waiting 1s → 2s → 4s gives external services time to recover.

**Why a dead letter queue?**
Without a DLQ, permanently failed jobs disappear silently. The DLQ captures them, logs the failure reason, and marks them in Postgres so you can investigate and replay.

---

---

## License

MIT