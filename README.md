# Quiz App - Real-Time Quiz Platform

A real-time quiz platform built with **FastAPI** (Python backend) and **Astro + React** (frontend). Perfect for demonstrating Python's capabilities to students!

## Project Overview

This is an interactive quiz application designed to close a 3-day Python tutorial for beginners. The goal is to give students a "glimpse" of what's possible with Python and modern web technologies.

**Key Features:**
- Real-time WebSocket updates
- Host presentation view + participant views
- Multiple choice & short-answer questions
- Timed questions with countdown
- Scoring with streak system
- Real-time leaderboard
- Mobile responsive

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **WebSockets** - Real-time communication
- **Pydantic** - Data validation
- **uvicorn** - ASGI server
- **uv** - Fast Python package manager

### Frontend
- **Astro 5.x** - SSR framework with Node.js adapter
- **Alpine.js** - Lightweight reactive framework (via @astrojs/alpinejs)
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety for Alpine logic modules

## Project Structure

```
python-quiz/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # Main application & WebSocket routes
│   ├── models.py               # Pydantic data models
│   ├── storage.py              # In-memory storage
│   ├── scoring.py              # Scoring algorithm
│   ├── validation.py           # Answer validation (fuzzy matching)
│   ├── game_state.py           # Room state management
│   ├── pyproject.toml          # Python dependencies (uv)
│   └── .env                    # Environment configuration
│
└── frontend/                   # Astro + Alpine.js frontend
    ├── src/
    │   ├── content/
    │   │   ├── config.ts       # Content collection schema
    │   │   └── test-quiz/      # Example quiz (one folder per quiz)
    │   │       ├── question-1.md   # Each question is a separate file
    │   │       ├── question-2.md   # Frontmatter: type, timeLimit, points, etc.
    │   │       └── ...             # (10 questions total)
    │   ├── components/
    │   │   ├── QuizHost.astro      # Host controls (Alpine markup)
    │   │   ├── QuizPlayer.astro    # Participant UI (Alpine markup)
    │   │   ├── Leaderboard.astro   # Real-time leaderboard (Alpine markup)
    │   │   └── Timer.astro         # Countdown timer (Alpine markup)
    │   ├── lib/
    │   │   ├── alpine/
    │   │   │   ├── quizHost.ts     # Alpine component logic
    │   │   │   ├── quizPlayer.ts   # Alpine component logic
    │   │   │   ├── leaderboard.ts  # Alpine component logic
    │   │   │   └── timer.ts        # Alpine component logic
    │   │   ├── alpineInit.ts       # Global Alpine initialization
    │   │   └── websocket.ts        # WebSocket client wrapper
    │   └── pages/
    │       ├── index.astro         # Homepage
    │       └── room/[roomId]/      # Dynamic room routes
    ├── astro.config.mjs            # Astro + Alpine.js integration
    └── .env                        # Frontend environment variables
```

## Setup Instructions

### Prerequisites

- **Python 3.12+**
- **Node.js 18+**
- **npm 9+**
- **uv** - Install with: `curl -LsSf https://astral.sh/uv/install.sh | sh`

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies with uv (automatically creates virtual environment):
   ```bash
   uv sync
   ```

3. Configure environment (optional - defaults are fine for development):
   ```bash
   # Edit .env file if needed
   nano .env
   ```

4. Run the development server:
   ```bash
   uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   The backend will be running at:
   - API: http://localhost:8000
   - Interactive Docs: http://localhost:8000/docs
   - WebSocket: ws://localhost:8000/ws/{room_id}

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Dependencies are already installed during project setup. If needed, reinstall with:
   ```bash
   npm install
   ```

3. Configure environment (optional - defaults work for local development):
   ```bash
   # Edit .env file if needed
   nano .env
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

   The frontend will be running at: http://localhost:4321

## Quick Start

### Running Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
uv run uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Creating Your First Quiz

Quizzes use Astro Content Collections with a specific structure:

**Quiz Structure:**
- One folder per quiz in `frontend/src/content/`
- Each question is a separate `.md` file
- Frontmatter is validated by schema in `config.ts`

**Example: Creating "my-quiz"**

1. Create folder: `frontend/src/content/my-quiz/`

2. Create `question-1.md`:

```markdown
---
type: "multiple-choice"
timeLimit: 30
points: 1000
correctAnswer: ["4"]
options: ["3", "4", "5", "22"]
---

What is the output of `print(2 + 2)`?
```

3. Create `question-2.md`:

```markdown
---
type: "short-answer"
timeLimit: 45
points: 1500
correctAnswer: ["Python", "python"]
---

What programming language are you learning?
```

4. The quiz `my-quiz` will be automatically available at `/room/{roomId}/host?quiz=my-quiz`

**Key Points:**
- **One file per question** (not all questions in one file)
- **Frontmatter structure** differs by question type
- **Multiple-choice** needs `options` array
- **Short-answer** can have multiple accepted answers for fuzzy matching

## Development Workflow

### Backend Development

- **Hot reload**: Uvicorn automatically reloads on file changes
- **API Documentation**: Visit http://localhost:8000/docs for interactive API docs
- **Testing endpoints**: Use the interactive docs or curl:
  ```bash
  curl -X POST "http://localhost:8000/api/rooms/create?quiz_id=test-quiz"
  ```

### Frontend Development

- **Hot reload**: Astro dev server auto-refreshes on changes
- **Type checking**: Run `npm run check` for TypeScript validation
- **Build**: Run `npm run build` to create production build

## Architecture Deep Dive

### System Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │◄───────►│   REST API   │◄───────►│   Storage   │
│  (Alpine.js)│         │  (FastAPI)   │         │ (In-Memory) │
└─────────────┘         └──────────────┘         └─────────────┘
       ▲                        │
       │                        │
       └────────WebSocket───────┘
              (Real-time)
```

### Alpine.js + Astro Integration

The frontend uses a **separation of concerns** pattern:

**Astro Components (`.astro` files):**
- Server-side rendering (SSR) for initial HTML
- Alpine.js directives embedded in markup (`x-data`, `x-show`, `x-if`, `x-on`)
- Pass data from Astro → Alpine via template literals

**Alpine Logic Modules (`src/lib/alpine/*.ts`):**
- TypeScript functions that return Alpine component definitions
- Contain reactive state, methods, and lifecycle hooks
- Imported and called in Astro components via `x-data`

**Example Pattern:**

```astro
<!-- Timer.astro (markup) -->
<div x-data={timer(timeLimit, currentQuestionIndex, totalQuestions)}>
  <span x-text="timeLeft"></span>
  <button @click="startTimer()">Start</button>
</div>

<script>
  import { timer } from '../lib/alpine/timer.ts';
</script>
```

```typescript
// timer.ts (logic)
export function timer(limit: number, index: number, total: number) {
  return {
    timeLeft: limit,
    isStarted: false,
    startTimer() {
      this.isStarted = true;
      // countdown logic...
    }
  };
}
```

**Benefits:**
- Logic is testable TypeScript (type-safe)
- Markup is readable Astro (SSR + Alpine directives)
- No client-side JavaScript framework bundle
- Alpine (~15KB) is the only JS shipped to browser

### Answer Submission Flow

1. **Player submits answer** → QuizPlayer component sends POST to `/api/rooms/{room_id}/answer`
2. **Backend validates** → Uses `validation.py` for fuzzy matching (85% threshold)
3. **Backend calculates score** → Uses `scoring.py` with time bonus + streak multiplier
4. **Backend updates participant** → Stores answer in `storage.py` dictionaries
5. **Backend broadcasts** → WebSocket sends `leaderboard_updated` event to all clients
6. **All clients update** → Leaderboard component fetches new rankings

### Key Python Concepts Demonstrated

This project is designed to teach Python beginners. Here are the interesting parts:

#### 1. Scoring Algorithm (`backend/scoring.py`)

```python
def calculate_score(max_points: int, response_time: int, time_limit: int, streak: int) -> int:
    """
    Time bonus: Faster answers = more points (100% instant, 50% at timeout)
    Streak multiplier: +10% per correct answer, max +50%
    """
```

**Learning**: Mathematical calculations, percentage logic, max/min functions

#### 2. Fuzzy String Matching (`backend/validation.py`)

```python
from rapidfuzz import fuzz

similarity = fuzz.ratio(user_answer.lower().strip(), correct_answer.lower().strip())
if similarity >= 85:  # Handles typos like "Pari" → "Paris"
    return True
```

**Learning**: String algorithms, external libraries, threshold-based logic, case-insensitive comparison

#### 3. WebSocket Broadcasting (`backend/main.py`)

```python
async def broadcast_to_room(room_id: str, message: dict):
    """Send message to all connected clients in a room"""
    if room_id in connected_clients:
        for ws in connected_clients[room_id]:
            await ws.send_json(message)
```

**Learning**: Async/await patterns, real-time communication, event broadcasting

#### 4. In-Memory Storage (`backend/storage.py`)

```python
rooms: Dict[str, Room] = {}           # Room sessions
participants: Dict[str, Participant] = {}  # Players
answers: Dict[str, List[Answer]] = {}      # Submitted answers
```

**Learning**: Dictionary-based data structures, type hints, data modeling without databases

### Files for Educational Review

1. **`backend/scoring.py`** - Pure Python math and logic
2. **`backend/main.py`** - FastAPI endpoints, async/await, WebSockets
3. **`backend/validation.py`** - String algorithms and fuzzy matching
4. **`backend/models.py`** - Pydantic data validation and type safety

## Environment Variables

### Backend (.env)
```env
CORS_ORIGINS=http://localhost:4321,http://localhost:3000
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

### Frontend (.env)
```env
PUBLIC_BACKEND_API=http://localhost:8000
PUBLIC_BACKEND_WS=ws://localhost:8000
```

## Common Commands

### Backend
```bash
# Activate virtual environment (if needed manually)
source .venv/bin/activate  # macOS/Linux
.venv\Scripts\activate     # Windows

# Run server
uv run uvicorn main:app --reload

# Add new dependency
uv add <package-name>

# Run with custom port
uv run uvicorn main:app --reload --port 8080
```

### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run check

# Add new dependency
npm install <package-name>
```

## Debugging Tips

### Backend Debugging

**Check if backend is running:**
```bash
curl http://localhost:8000
```

**View interactive API documentation:**
```bash
open http://localhost:8000/docs  # macOS
# or visit http://localhost:8000/docs in your browser
```

**Test endpoints directly:**
```bash
# Create a room
curl -X POST "http://localhost:8000/api/rooms/create?quiz_id=test-quiz"

# Check room status
curl "http://localhost:8000/api/rooms/{room_id}"
```

**View server logs:**
- Uvicorn prints all requests and errors to the terminal
- Look for WebSocket connection messages
- Check for CORS errors if frontend can't connect

### Frontend Debugging

**Browser Console (DevTools):**
```javascript
// View Alpine.js component state
$data

// Watch state changes in real-time
$watch('timeLeft', value => console.log('Time:', value))
```

**Network Tab:**
- Monitor WebSocket connection at `ws://localhost:8000/ws/...`
- Check API calls to `/api/...` endpoints
- Look for 422 errors (validation failures) or 404 (wrong URLs)

**Common Console Errors:**
- `WebSocket connection failed` → Backend not running
- `CORS policy` → Backend CORS_ORIGINS doesn't include frontend URL
- `Failed to fetch` → Wrong API URL in `.env`

## Deployment

This guide walks you through deploying both backend and frontend to Railway.app for permanent, shareable URLs.

### Prerequisites

1. **GitHub Account** - Code must be in a GitHub repository
2. **Railway Account** - Sign up at [railway.app](https://railway.app) (free tier available)

### Step 1: Push Code to GitHub

If your code isn't on GitHub yet:

```bash
# In project root
git add .
git commit -m "Prepare for Railway deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/python-quiz.git
git push -u origin main
```

### Step 2: Deploy Backend to Railway

1. **Go to Railway Dashboard** → Click "New Project"

2. **Select "Deploy from GitHub repo"**
   - Authorize Railway to access your GitHub account
   - Select your `python-quiz` repository

3. **Configure Backend Service:**
   - Railway will detect the Python project automatically
   - Click on the service → Settings → Set **Root Directory** to: `backend`
   - Railway will detect `pyproject.toml` and install dependencies with `uv`

4. **Add Environment Variables:**
   - Click on the service → Variables tab → Add these:
   ```
   CORS_ORIGINS=http://localhost:4321
   HOST=0.0.0.0
   PORT=8000
   DEBUG=False
   ```
   - Note: We'll update `CORS_ORIGINS` after deploying the frontend

5. **Generate Domain:**
   - Click Settings → Generate Domain
   - Copy the URL (e.g., `https://python-quiz-backend-production.up.railway.app`)
   - Save this for Step 3

6. **Verify Deployment:**
   - Visit `https://YOUR-BACKEND-URL.railway.app/docs`
   - You should see the FastAPI interactive documentation

### Step 3: Deploy Frontend to Railway

1. **Back to Railway Dashboard** → Click "New Project" again

2. **Select same GitHub repository** (`python-quiz`)

3. **Configure Frontend Service:**
   - Click on the service → Settings → Set **Root Directory** to: `frontend`
   - Railway will detect `package.json` and run `npm install`

4. **Add Environment Variables:**
   - Click Variables tab → Add these (use your backend URL from Step 2):
   ```
   PUBLIC_BACKEND_API=https://YOUR-BACKEND-URL.railway.app
   PUBLIC_BACKEND_WS=wss://YOUR-BACKEND-URL.railway.app
   ```
   - Note: Use `wss://` (not `ws://`) for secure WebSocket in production

5. **Configure Build Command (Important!):**
   - Click Settings → Build Command
   - Set to: `npm run build`
   - Start Command should be: `node dist/server/entry.mjs`

6. **Generate Domain:**
   - Click Settings → Generate Domain
   - Copy the frontend URL (e.g., `https://python-quiz-production.up.railway.app`)

7. **Verify Deployment:**
   - Visit your frontend URL
   - You should see the quiz homepage

### Step 4: Update Backend CORS

Now that you have the frontend URL, update the backend to accept requests from it:

1. **Go to Backend Service** in Railway Dashboard

2. **Update Variables:**
   - Click Variables tab
   - Update `CORS_ORIGINS` to include your frontend URL:
   ```
   CORS_ORIGINS=https://YOUR-FRONTEND-URL.railway.app,http://localhost:4321
   ```
   - Example: `CORS_ORIGINS=https://python-quiz-production.up.railway.app,http://localhost:4321`

3. **Redeploy:**
   - Railway will automatically redeploy when you save variables
   - Wait for deployment to complete (~1-2 minutes)

### Step 5: Test Your Deployment

1. Visit your frontend URL: `https://YOUR-FRONTEND-URL.railway.app`
2. Create a new room as host
3. Join as participant (open in incognito/different browser)
4. Start a question and verify real-time updates work
5. Submit answers and check leaderboard updates

**Share the URL with colleagues for feedback!** 🎉

### Troubleshooting Deployment

**Backend deployment fails:**
- Check Railway logs for Python errors
- Ensure `pyproject.toml` has all dependencies
- Verify `PORT` environment variable is set to 8000

**Frontend can't connect to backend:**
- Check browser console for CORS errors
- Verify `PUBLIC_BACKEND_API` and `PUBLIC_BACKEND_WS` are correct
- Ensure backend CORS includes frontend URL
- WebSocket must use `wss://` (not `ws://`) in production

**WebSocket disconnects frequently:**
- Railway free tier may have connection limits
- Check Railway logs for WebSocket errors
- Verify WebSocket URL uses `wss://` protocol

**Changes not appearing:**
- Push changes to GitHub: `git push`
- Railway auto-deploys on git push
- Check "Deployments" tab in Railway dashboard

### Local Development After Deployment

You can still develop locally! Just keep the `.env` files pointing to `localhost`:

**Backend `.env`:**
```env
CORS_ORIGINS=http://localhost:4321,http://localhost:3000
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

**Frontend `.env`:**
```env
PUBLIC_BACKEND_API=http://localhost:8000
PUBLIC_BACKEND_WS=ws://localhost:8000
```

Railway uses environment variables you set in the dashboard, not your local `.env` files.

## Troubleshooting

### Local Development Issues

**Backend won't start:**
- Check if port 8000 is available: `lsof -i :8000`
- Ensure Python 3.12+ is installed: `python --version`
- Try: `uv sync` to reinstall dependencies

**Frontend won't start:**
- Check if port 4321 is available
- Clear npm cache: `npm cache clean --force`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**WebSocket not connecting:**
- Ensure backend is running
- Check browser console for errors
- Verify WebSocket URL in frontend `.env`

**CORS errors:**
- Add frontend URL to backend `CORS_ORIGINS` in `.env`
- Restart backend server after changing `.env`

### Deployment Issues

See the [Troubleshooting Deployment](#troubleshooting-deployment) section above for production-specific issues.

## License

This project is created for educational purposes.

## Contributing

This is a teaching project. Feel free to adapt for your own educational needs!

---

**Built with Python and love for teaching!** 🐍
