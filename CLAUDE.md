# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-time quiz platform for Python tutorial students. Educational project designed to demonstrate Python/FastAPI capabilities to beginners. Backend uses in-memory storage (no database), WebSockets for real-time updates. Frontend uses Astro 5.x with Alpine.js for lightweight interactivity.

## Development Commands

### Quick Start with Taskfile

**Install Task:** https://taskfile.dev/installation/

```bash
# Show all available commands
task

# Install all dependencies
task install

# Start both servers in parallel
task dev

# Start backend only
task backend

# Start frontend only
task frontend

# Build for production
task build

# Clean all artifacts
task clean

# Deploy to Railway
task deploy
```

### Manual Commands (without Taskfile)

**Backend (FastAPI + Python 3.12)**
```bash
cd backend
uv sync                              # Install dependencies
uv run uvicorn main:app --reload     # Start dev server
uv add <package-name>                # Add new package
```

Backend runs at http://localhost:8000
- Interactive API docs: http://localhost:8000/docs
- WebSocket endpoint: ws://localhost:8000/ws/{room_id}

**Frontend (Astro + Alpine.js + TypeScript)**
```bash
cd frontend
npm install                          # Install dependencies
npm run dev                          # Start dev server
npm run check                        # Type checking
npm run build                        # Production build
```

Frontend runs at http://localhost:4321

**Important**: Both servers must run simultaneously for full functionality.

## Architecture

### Backend Architecture (FastAPI)

**In-Memory Storage Pattern**: All state stored in Python dictionaries in `storage.py`:
```python
rooms: Dict[str, Room] = {}                    # Room sessions
participants: Dict[str, Participant] = {}      # Players
answers: Dict[str, List[Answer]] = {}          # Submitted answers
cached_leaderboards: Dict[str, Leaderboard] = {}  # Cached leaderboard state
```

**No database, no persistence**. Data exists only during server runtime. Rooms should auto-expire after 2 hours (not yet implemented).

**Leaderboard Caching**: Cached leaderboard prevents live score leaks mid-question. Updates only occur on:
- Question timeout (recalculate from participant scores)
- Quiz completion (recalculate from participant scores)
- Participant join (add to cache with score=0)
GET endpoint always returns cached data, never recalculates.

**Module Responsibilities**:
- `main.py` - FastAPI app, REST endpoints, WebSocket manager, CORS config
- `models.py` - Pydantic models for validation (Room, Participant, Answer, QuestionData, Leaderboard, LeaderboardEntry, LeaderboardResponse)
- `scoring.py` - Time-based scoring algorithm with streak bonuses
- `validation.py` - Fuzzy matching for short-answer questions (rapidfuzz, 80% threshold)
- `storage.py` - Global dictionaries for in-memory data (rooms, participants, answers, cached_leaderboards)

**WebSocket Architecture**:
- Each room has list of connected WebSocket clients in `connected_clients` dict
- `broadcast_to_room()` sends JSON messages to all clients in a room
- Auto-cleanup of disconnected clients
- Events: `question_started`, `question_changed`, `leaderboard_updated`, `participant_joined`

**CORS Configuration**:
- Configured in `main.py` middleware using `CORS_ORIGINS` environment variable
- Reads from comma-separated list in `.env` file
- Local default: `http://localhost:4321,http://localhost:3000,http://localhost`
- Production: Must include deployed frontend URL (set in Railway Variables tab)

### Frontend Architecture (Astro + Alpine.js)

**Astro Content Collections**:
- One folder per quiz in `src/content/quiz/` (e.g., `src/content/quiz/python-quiz/`)
- Each question is a separate `.md` file (`question-01.md`, `question-02.md`, etc.)
- Schema in `src/content/config.ts` validates frontmatter
- Frontmatter includes: `type`, `timeLimit`, `points`, `correctAnswer`, `options`
- Astro processes at build time, not runtime

**Alpine.js Integration Pattern**:
- Astro components (`.astro` files) contain Alpine directives (`x-data`, `x-show`, `x-if`, `x-on`)
- Alpine logic modules in `src/lib/alpine/*.ts` export TypeScript functions
- Components: QuizHost, QuizPlayer, Leaderboard, Timer
- Alpine entrypoint at `src/lib/alpine/alpineInit.ts` registers all components
- Configured via `@astrojs/alpinejs` integration with custom entrypoint
- Only Alpine.js (~15KB) shipped to browser - no heavy framework bundle

**Component Architecture**:
- `.astro` files = Server-side rendering + Alpine markup
- `.ts` files = Alpine component logic (reactive state, methods, lifecycle)
- Example: `Timer.astro` uses `x-data={timer(...)}` from `alpine/timer.ts`
- Separation of concerns: markup vs. logic
- **Keyboard shortcuts**: Enter key submits answers (both multiple-choice and short-answer)

**WebSocket Client** (`src/lib/websocket.ts`):
- `QuizWebSocket` class wraps native WebSocket
- Auto-reconnect with exponential backoff (max 5 attempts)
- Event listener pattern for handling server messages
- Used by all Alpine components for real-time updates

**State Management**:
- Alpine reactive state in component logic modules
- No global state manager needed
- WebSocket events trigger Alpine state updates
- Room/participant data fetched via REST, updates via WebSocket

**Script Bundling Pattern**:
- All page scripts use regular `<script>` tags (no `is:inline` or `define:vars`)
- Server-side data passed via `data-*` attributes on container elements
- TypeScript modules in `src/lib/` for shared logic
- Astro automatically bundles, minifies, and optimizes scripts
- Benefits: TypeScript support, import bundling, code reuse, better caching

**Utility Modules** (`src/lib/`):
- `session-storage.ts` - Type-safe sessionStorage access for room-scoped data
- `auth.ts` - Unified authorization checking for host and player roles
- `room-creation.ts` - Room creation logic with API calls
- `join-room.ts` - Form handling and participant join flow
- `alpine-helpers.ts` - Type-safe Alpine.js custom event helpers

**Data-Attributes Pattern**:
```astro
<!-- Server-side: Pass data via attributes -->
<div id="container" data-room-id={roomId} data-quiz-id={quizId}>
  <!-- content -->
</div>

<!-- Client-side: Read from attributes -->
<script>
  import { someFunction } from '../lib/module';

  const container = document.getElementById('container');
  const roomId = container?.dataset.roomId;

  if (roomId) {
    someFunction(roomId);
  }
</script>
```

### Quiz Markdown Format

**Structure**: One folder per quiz, one file per question

**Location**: `frontend/src/content/quiz/{quiz-name}/`

**Example**: `frontend/src/content/quiz/python-quiz/question-01.md`

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

**Short-answer example**:
```markdown
---
type: "short-answer"
timeLimit: 45
points: 1500
correctAnswer: ["Python", "python"]
---

What programming language are you learning?
```

**Key Points**:
- One file per question (not all questions in one file)
- Frontmatter validated by schema in `src/content/config.ts`
- Multiple-choice requires `options` array
- Short-answer can have multiple accepted answers for fuzzy matching (feature retained for future use)
- Frontend parses markdown and sends question data to backend with submissions
- **Current quiz design**: All questions are multiple-choice based on user testing feedback
- **TODO(human)**: Review and adjust time limits for all questions (30s for simple, 45s for code/long text)

### Scoring Algorithm

Located in `backend/scoring.py`:

1. **Time bonus**: Linear from 100% (instant) to 50% (timeout)
2. **Streak multiplier**: +10% per consecutive correct answer, max +50% (5+ streak)
3. Formula: `base_points * time_bonus * streak_multiplier`

Example: 1000 point question, answered in 5s of 30s, with 3-answer streak = 1,083 points

### Answer Validation

Located in `backend/validation.py`:

- **Multiple choice**: Exact string match
- **Short answer**: Fuzzy matching using rapidfuzz.fuzz.ratio()
- Threshold: 80% similarity (configurable, handles typos like "Pari" → "Paris")
- Case-insensitive, whitespace-trimmed

## Package Management

**Backend**: Use `uv` for all Python package operations (never pip). uv manages pyproject.toml and uv.lock.

**Frontend**: Use `npm` for all Node.js packages. Never edit package.json directly - use `npm install <pkg>`.

## Environment Variables

### Backend `.env`
```
CORS_ORIGINS=http://localhost:4321,http://localhost:3000
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

### Frontend `.env`
```
PUBLIC_BACKEND_API=http://localhost:8000
PUBLIC_BACKEND_WS=ws://localhost:8000
```

**Production**: Update CORS_ORIGINS in backend and PUBLIC_BACKEND_* in frontend to match deployed URLs.

## API Flow

1. **Create room**: POST `/api/rooms/create?quiz_id=<quiz>` → returns room_id + host_secret
2. **Join room**: POST `/api/rooms/{room_id}/join` with nickname → returns participant_id
3. **WebSocket**: Connect to `/ws/{room_id}` for real-time updates
4. **Start question**: POST `/api/rooms/{room_id}/start` with host_secret + time_limit
5. **Submit answer**: POST `/api/rooms/{room_id}/answer` with participant_id, answer, response_time, question metadata
6. **Get leaderboard**: GET `/api/leaderboard/{room_id}`

**Key design decision**: Frontend sends correct answer to backend with submissions (since frontend has markdown). Backend validates and scores. This means quiz answers are visible in browser - acceptable for educational use.

## Deployment

**Platform**: Railway.app for both backend and frontend (free tier, supports WebSockets and Node.js SSR)

**Repository**: GitHub monorepo with separate Railway services using root directory configuration

### Backend Service (Railway)
- **Root Directory**: `backend`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  ```
  CORS_ORIGINS=https://YOUR-FRONTEND-URL.railway.app,http://localhost:4321
  HOST=0.0.0.0
  PORT=8000
  DEBUG=False
  ```

### Frontend Service (Railway)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Start Command**: `node dist/server/entry.mjs`
- **Environment Variables**:
  ```
  PUBLIC_BACKEND_API=https://YOUR-BACKEND-URL.railway.app
  PUBLIC_BACKEND_WS=wss://YOUR-BACKEND-URL.railway.app
  ```

**Important**:
- Use `wss://` (not `ws://`) for WebSocket in production
- Update backend `CORS_ORIGINS` to include frontend URL
- Railway auto-deploys on git push

**See full deployment guide in README.md**

## Educational Context

This project is designed to show Python beginners what's possible. Key teaching files:
- `backend/scoring.py` - Pure Python math/logic
- `backend/main.py` - Async/await, WebSockets, REST APIs
- `backend/validation.py` - String algorithms, fuzzy matching

Code is intentionally well-commented for student review.

## Progress

### Completed (Session 2025-10-29)

**Frontend Architecture Refactor:**
- ✅ Migrated from React to Alpine.js for simpler, HTML-centric interactivity
- ✅ Extracted Alpine logic to TypeScript modules (`frontend/src/lib/alpine/*.ts`)
- ✅ Refactored all components to template-only (QuizHost, QuizPlayer, Leaderboard, Timer)
- ✅ Created global Alpine component registration system (`alpineInit.ts`)
- ✅ Enabled Astro SSR mode with Node.js adapter for dynamic room-based routing
- ✅ Fixed host page to display only current question (not all questions)
- ✅ Implemented proper markdown rendering (server-side with `<Content />` component)
- ✅ Used Alpine's `x-show` for question visibility instead of JSON serialization

**Backend API Fixes:**
- ✅ Added Pydantic request models (`JoinRoomRequest`, `StartQuestionRequest`, etc.)
- ✅ Updated all endpoints to accept JSON request bodies instead of query parameters
- ✅ Fixed 422 errors when submitting answers and advancing questions
- ✅ Added enums for `RoomStatus` and `QuestionType` (code quality improvement)

**Architecture Updates:**
- ✅ Room-based routing: `/room/{roomId}/host` and `/room/{roomId}/play`
- ✅ SessionStorage for auth: `host_secret` and `participant_id`
- ✅ Question sync between QuizHost component and question display (polling pattern)

### Completed (Session 2025-10-29 PM)

**Answer Display & Timer Enhancements:**
- [x] Correct answer display only after timer expires (not immediately after submission)
- [x] Separate leaderboard page at `/leaderboard/{roomId}` for host
- [x] Host control panel shows question status (idle/active/over) using enum pattern
- [x] Submit button shows countdown: "Answer submitted • XX seconds remaining"
- [x] Contextual timer messages: "Get ready for question #2" or "Quiz Complete!"
- [x] Timer respects dynamic `timeLimit` from question frontmatter
- [x] Multiple-choice highlights correct (green) and incorrect (red) answers after timeout
- [x] Short-answer shows correct answer in blue box after timeout
- [x] Backend broadcasts `question_timeout` WebSocket event to all clients
- [x] QuizPlayer uses `pendingResult` pattern to delay result display until timeout

**Key Files Modified:**
- `backend/main.py`: Added `schedule_timeout_broadcast()` for async timeout handling
- `backend/models.py`: Extended `StartQuestionRequest` with `correct_answer` and `question_index`
- `frontend/src/lib/alpine/quizHost.ts`: Changed to enum-based state (`questionStatus`)
- `frontend/src/lib/alpine/quizPlayer.ts`: Added `pendingResult`, `timeRemaining`, timeout listener
- `frontend/src/lib/alpine/timer.ts`: Added question context tracking and `waitingForNext` state
- `frontend/src/components/QuizPlayer.astro`: Added conditional styling for correct answers
- `frontend/src/components/Timer.astro`: Three-state display (waiting/active/next question)
- `frontend/src/pages/leaderboard/[roomId].astro`: New standalone leaderboard page

### Completed (Session 2025-10-31)

**Quiz Content:**
- [x] Created 10 real Python tutorial questions in `frontend/src/content/test-quiz/`
- [x] Questions cover: immutable types, string slicing, loop else clause, exceptions, function arguments, context managers, *args/**kwargs, dunder methods, scope, relative imports
- [x] Progressive difficulty: 500pts (easy) → 750pts (medium) → 1000pts (med-hard) → 1250pts (hard)
- [x] Time limits: 30s (easy) → 45s (medium) → 60s (med-hard) → 90s (hard)

**Deployment to Railway:**
- [x] Fixed backend CORS to read from `CORS_ORIGINS` environment variable
- [x] Created `.env.example` templates for both backend and frontend
- [x] Updated README with comprehensive Railway deployment guide
- [x] Fixed `.gitignore` to exclude only `backend/lib/` (not `frontend/src/lib/`)
- [x] Fixed Alpine.js entrypoint to use Astro's official pattern
- [x] Successfully deployed both services to Railway.app
- [x] Configured environment variables in Railway dashboard
- [x] Updated backend CORS to include deployed frontend URL

**Alpine.js Architecture Fix:**
- [x] Refactored `alpineInit.ts` to Astro entrypoint format
- [x] Configured `@astrojs/alpinejs` integration with custom entrypoint path
- [x] Removed manual script tag from `Layout.astro`
- [x] Fixed Railway build errors related to import path resolution

**Documentation:**
- [x] Created backend README with quick start guide
- [x] Updated main README with Alpine.js architecture details
- [x] Fixed quiz content structure documentation (one folder per quiz, one file per question)
- [x] Added MIT License recommendation

**Development Tooling:**
- [x] Created `Taskfile.yml` for simplified local development
- [x] Tasks for: install, dev, build, clean, deploy, logs
- [x] Parallel execution of backend + frontend with `task dev`

### Completed (Session 2025-11-01) - Phase 1: Critical Bugs

**Test Run Feedback - Phase 1 Implementation:**
- [x] Lowered fuzz ratio threshold from 85% to 80% (backend/validation.py)
- [x] Removed unnecessary metadata display (question type, time limit, points) from player view
- [x] Fixed double "waiting" messages (removed Timer in initial waiting state)
- [x] Implemented proper end-of-quiz experience for both host and players
- [x] Fixed quiz completion detection (pass total_questions during room creation)
- [x] Fixed Alpine.js scope bug (moved Quiz Complete div inside x-data boundary)
- [x] Fixed counter overflow after quiz completion (using Math.min() to cap values)
- [x] Fixed advance_question() logic (increment before checking completion)
- [x] Fixed "Next Question" button state (only enabled when questionStatus === 'over')
- [x] Added separate "Finish Quiz" button for final question
- [x] Fixed duplicate "Quiz Complete" messages (hide Timer when quiz completes)
- [x] Fixed overlapping states (question and completion screen showing simultaneously)
- [x] Added proper "Waiting for Host" state for players who join mid-quiz

**Key Files Modified:**
- `backend/validation.py`: Made fuzz ratio configurable parameter (80% default)
- `backend/models.py`: Fixed advance_question() increment-before-check logic
- `backend/main.py`: Added total_questions parameter to room creation, proper quiz_complete broadcast
- `frontend/src/components/QuizPlayer.astro`: Removed metadata, fixed scope, added state conditions
- `frontend/src/components/QuizHost.astro`: Fixed button logic, counter display with Math.min()
- `frontend/src/components/Timer.astro`: Hide when quiz complete or in initial waiting
- `frontend/src/pages/create-room.astro`: Load and pass total_questions to backend
- `frontend/src/pages/room/[roomId]/host.astro`: Counter display fix, completion message
- `frontend/src/lib/alpine/quizPlayer.ts`: WebSocket quiz_complete handler
- `frontend/src/lib/alpine/quizHost.ts`: Status handling and completion state

### Completed (Session 2025-11-04) - Phase 2: Nice-to-Have Features

**Nested Content Collections:**
- [x] Migrated from single quiz to nested content collections structure
- [x] Schema updated in `src/content/config.ts` to support nested quiz folders
- [x] Quiz loading refactored to use `getCollection()` with proper typing
- [x] Moved test-quiz to `frontend/src/content/quizzes/test-quiz/`

**Dynamic Quiz Selection:**
- [x] Removed hardcoded "test-quiz" from frontend
- [x] Created quiz selection page at `/create-room` with dynamic quiz list
- [x] Quiz selector displays all available quizzes from content collections
- [x] Room creation now accepts `quiz_id` from user selection
- [x] All pages (host, play, leaderboard) now load quiz dynamically based on room's quiz_id

**Code Quality Improvements:**
- [x] Fixed inconsistent naming (participantCount vs participants_count)
- [x] Cleaned up unused imports across multiple files
- [x] Improved type safety in Alpine components
- [x] Better error handling for missing quizzes

**Host Timer Enhancement:**
- [x] Added HostTimer component embedded in "Question Active" state badge
- [x] Shows remaining time to host during active questions
- [x] Simplified design without separate component file
- [x] Timer syncs with question timeout events

**Leaderboard Synchronization:**
- [x] Implemented domain model pattern with Leaderboard class and LeaderboardResponse DTO
- [x] Backend caching mechanism to prevent live score leaks mid-question
- [x] Leaderboard updates only on question timeout, quiz completion, or participant join
- [x] GET endpoint returns cached data only (never recalculates mid-question)
- [x] Smart emoji display: 🐍 for all participants before any scores, medals for top 3 with scores
- [x] Cohesive visual styling with blue theme for rank 4+ participants

**Key Files Modified:**
- `frontend/src/content/config.ts`: Nested collections schema
- `frontend/src/pages/create-room.astro`: Dynamic quiz selector UI
- `backend/models.py`: Leaderboard class with business logic methods
- `backend/storage.py`: Added cached_leaderboards Dict[str, Leaderboard]
- `backend/main.py`: Updated join_room, broadcast_leaderboard, get_leaderboard endpoints
- `frontend/src/lib/alpine/leaderboard.ts`: hasAnyScores getter, getRankEmoji() method
- `frontend/src/components/Leaderboard.astro`: Updated styling for all ranks
- `frontend/src/components/QuizHost.astro`: Embedded host timer in Question Active badge

### Completed (Session 2025-11-12) - Semantic Similarity Answer Validation

**Embedding-Based Answer Validation:**
- [x] Integrated sentence-transformers with all-MiniLM-L6-v2 model for semantic similarity
- [x] Implemented hybrid validation approach (exact match OR semantic similarity)
- [x] Added embedding-based validation as fallback for fuzzy string matching
- [x] Semantic similarity threshold set to 0.85 (85% similarity required)
- [x] Preserves existing fuzzy matching for typos and minor variations
- [x] Updated validation.py with embedding model initialization and caching
- [x] Added sentence-transformers dependency to backend pyproject.toml

**Key Files Modified:**
- `backend/validation.py`: Added semantic similarity validation using sentence embeddings
- `backend/pyproject.toml`: Added sentence-transformers dependency

**Validation Strategy:**
- Exact match check first (case-insensitive)
- Fuzzy string matching second (80% threshold for typos)
- Semantic similarity third (85% threshold for meaning equivalence)
- Answers accepted if ANY method returns True

### Current Status (Updated 2025-11-12)

**Fully Deployed and Working:**
- [x] Backend deployed to Railway with environment-based CORS
- [x] Frontend deployed to Railway with SSR support
- [x] Real-time WebSocket communication working in production
- [x] Full quiz flow functional (create room → join → play → leaderboard)
- [x] Dynamic quiz selection from content collections
- [x] 10 Python tutorial questions live and tested
- [x] Taskfile for streamlined local development
- [x] Phase 1 critical bugs fixed and tested
- [x] Phase 2 nice-to-have features completed
- [x] Semantic similarity answer validation implemented

**Production URLs:**
- Backend: Railway-generated URL with FastAPI docs
- Frontend: Railway-generated URL with quiz interface
- Both services auto-deploy on git push

### Next Steps

**Phase 2 Remaining Features:**
- [ ] Test semantic similarity validation with edge cases (Human)
- [ ] Evaluate performance impact of embedding model in production (Human)
- [ ] Consider caching embeddings for common answers (Claude)
- [ ] Protect create room and leaderboard endpoints with authentication/rate limiting (Claude)
- [ ] Add QR code for room joining (Claude)
- [ ] Improve data storage with semi-persistent mode using pickle/json (Human)

**Priority 3: Educational Content (Human)**
- [ ] Present project to Python tutorial students
- [ ] Walk through backend code (scoring.py, validation.py, main.py)
- [ ] Demonstrate WebSocket real-time updates
- [ ] Show deployment process

**Future Enhancements (Optional):**
- [ ] Room expiration (2-hour timeout)
- [ ] Host can skip questions
- [ ] Export quiz results as CSV
- [ ] Sound effects or animations
- [ ] Multiple quiz support in UI

**Current Focus:**
- Testing and evaluating semantic similarity validation approach
- Monitoring performance impact of embedding model

## Memory

When proposing learning tasks:
- Frontend: tell me what are you going to do, I'll review, you implement
- Backend (Python): fully learn-by-doin approach, with `TODO(human)` blocks
