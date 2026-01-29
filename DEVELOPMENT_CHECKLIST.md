# 📝 Development Checklist

Copy this and use it to track progress during the hackathon!

---

## 🔧 Initial Setup

- [ ] All team members run `.\setup.ps1`
- [ ] Create Neon account and project
- [ ] Create Gemini API key
- [ ] Update `backend\.env` with DATABASE_URL and GEMINI_API_KEY
- [ ] Update `frontend\.env.local` with NEXT_PUBLIC_API_URL
- [ ] Run `.\run.ps1` and verify both servers start
- [ ] Test http://localhost:8000/docs (API) works
- [ ] Test http://localhost:3000 (frontend) loads

---

## 📚 Priority 1: Infrastructure & Auth

### Database
- [ ] Create migration script for tables
- [ ] Verify pgvector extension is created
- [ ] Test basic CRUD on User/Course tables
- [ ] Seed sample course via `seed_demo.py`

### Authentication
- [ ] Set up Clerk integration (if using)
  - [ ] Add Clerk keys to `.env.local`
  - [ ] Create sign-up page
  - [ ] Create login page
  - [ ] Create user profile page
- [ ] Or use simple JWT/token auth (optional)

### Testing
- [ ] Write test for database connection
- [ ] Write test for user creation
- [ ] Run `pytest` and verify tests pass

---

## 📤 Priority 2: Content Management (Admin)

### Upload Endpoint
- [ ] Create `POST /api/materials` endpoint
  - [ ] Accept: title, category, type, week, topic, tags
  - [ ] Accept: file upload
  - [ ] Validate inputs
  - [ ] Save file to `./storage/materials/`
  - [ ] Create Material record in DB
  - [ ] Return material_id

### Material Listing
- [ ] Create `GET /api/materials` endpoint
  - [ ] Support filters: course_id, category, week, topic
  - [ ] Return: list of materials with metadata
  - [ ] Add pagination (optional)

### Material Details
- [ ] Create `GET /api/materials/{id}` endpoint
  - [ ] Return full material info
  - [ ] Return storage URL for download

### Admin UI (Next.js)
- [ ] Create admin upload page
  - [ ] File dropzone
  - [ ] Metadata form (title, category, type, week, topic, tags)
  - [ ] Submit button
  - [ ] Success/error messages
  - [ ] Progress indicator (if async upload)

### Testing
- [ ] Test upload endpoint with Swagger UI
- [ ] Test with sample PDF
- [ ] Verify file saved to `./storage/`
- [ ] Verify DB record created

---

## 🔍 Priority 3: Ingestion & Search

### Ingest Service
- [ ] Create `IngestService` class
  - [ ] Parse PDF (PyMuPDF)
  - [ ] Parse code files (simple text extraction)
  - [ ] Chunk text (heading-aware for theory, line-aware for code)
  - [ ] Create chunks in DB
  - [ ] Generate embeddings (Gemini API)
  - [ ] Store embeddings in `material_chunks` table

### Ingest Endpoint
- [ ] Create `POST /api/ingest/{material_id}` endpoint
  - [ ] Trigger IngestService
  - [ ] Return status/progress
  - [ ] Support async (background task optional)

### Search Service
- [ ] Create `SearchService` class
  - [ ] Embed search query (Gemini API)
  - [ ] Query pgvector for similarity (cosine distance)
  - [ ] Return top-k results with metadata
  - [ ] Support filters (category, week, topic, tags)

### Search Endpoint
- [ ] Create `POST /api/search` endpoint
  - [ ] Input: query, course_id, filters
  - [ ] Output: list of chunks with metadata + similarity score
  - [ ] Return original material info (title, link)

### Search UI (Next.js)
- [ ] Create search page
  - [ ] Search input + submit
  - [ ] Filters (category, week, topic)
  - [ ] Results display
  - [ ] Show excerpt + source link
  - [ ] Show similarity score (optional)

### Testing
- [ ] Ingest sample material via API
- [ ] Verify chunks created in DB
- [ ] Verify embeddings stored
- [ ] Test search query
- [ ] Verify relevant results returned

---

## 🤖 Priority 4: AI Generation

### Generation Service
- [ ] Create `GenerationService` class
  - [ ] Retrieve context (search for relevant chunks)
  - [ ] Format system prompt + context
  - [ ] Call Gemini API with proper prompts
  - [ ] Parse response (extract markdown, citations, etc)
  - [ ] Save result to DB

### Mode 1: Theory Notes
- [ ] `generate_theory_notes(prompt, course_id)`
  - [ ] Output: markdown with headings, bullets, definitions
  - [ ] Include citations to source materials
  - [ ] Return: `{ content, citations, model_used }`

### Mode 2: Lab Code
- [ ] `generate_lab_code(prompt, course_id, language='python')`
  - [ ] Output: runnable code + explanation
  - [ ] Syntax check (ast.parse for Python)
  - [ ] Include "how to run" instructions
  - [ ] Include citations to example code
  - [ ] Return: `{ code, explanation, citations, language }`

### Mode 3: Slides (optional)
- [ ] `generate_slides(prompt, course_id)`
  - [ ] Output: Markdown in Marp format
  - [ ] Can later render to PDF
  - [ ] Include citations

### Generate Endpoint
- [ ] Create `POST /api/generate` endpoint
  - [ ] Input: mode (notes|code|slides), prompt, course_id
  - [ ] Output: { id, content, citations, status }
  - [ ] Support async generation

### Generation UI (Next.js)
- [ ] Create generator page
  - [ ] Mode selector (tabs: Notes / Code / Slides)
  - [ ] Prompt input
  - [ ] Generate button
  - [ ] Output display (markdown viewer)
  - [ ] Show citations (hover or sidebar)
  - [ ] Copy button

### Testing
- [ ] Generate notes for a topic
- [ ] Verify citations are accurate
- [ ] Generate Python code
- [ ] Verify code is syntactically correct
- [ ] Check quality of generated content

---

## ✅ Priority 5: Validation

### Validation Service
- [ ] Create `ValidationService` class
  - [ ] Check citations exist
  - [ ] For code: syntax check (ast.parse, ruff, etc)
  - [ ] For text: check for hallucinations (simple LLM call)
  - [ ] Score: groundedness, relevance, clarity

### Validate Endpoint
- [ ] Create `POST /api/validate` endpoint
  - [ ] Input: asset_id
  - [ ] Output: { scores, hallucinations, suggestions }

### Validation UI
- [ ] Show validation badge on generated content
  - [ ] Score display (e.g., "Groundedness: 8/10")
  - [ ] Hallucination flags (if any)
  - [ ] Suggested fixes
  - [ ] "Accept" / "Regenerate" buttons

### Testing
- [ ] Validate generated notes
- [ ] Validate generated code
- [ ] Verify scores are reasonable

---

## 💬 Priority 6: Chat

### Chat Service
- [ ] Create `ChatService` class
  - [ ] Maintain conversation history
  - [ ] Detect intent (search, generate, summarize)
  - [ ] Execute tools (search, generate, validate)
  - [ ] Collect citations
  - [ ] Stream response (optional)

### Chat Tools
- [ ] Tool 1: `search(query, filters)` → use SearchService
- [ ] Tool 2: `generate(mode, prompt)` → use GenerationService
- [ ] Tool 3: `summarize(material_id)` → extract summary from material
- [ ] Tool 4: `validate(asset_id)` → use ValidationService

### Chat Endpoints
- [ ] Create `GET /api/chat/threads` → list user's chats
- [ ] Create `POST /api/chat/threads` → create new thread
- [ ] Create `GET /api/chat/threads/{id}/messages` → fetch messages
- [ ] Create `POST /api/chat/threads/{id}/message` → send message
  - [ ] Stream response using SSE or WebSocket
  - [ ] Track citations
  - [ ] Save to DB

### Chat UI (Next.js)
- [ ] Create chat page
  - [ ] Message list (user + assistant)
  - [ ] Message input
  - [ ] Send button
  - [ ] Sources sidebar (citations)
  - [ ] Typing indicator
  - [ ] Error handling

### Testing
- [ ] Send chat message
- [ ] Verify relevant search is triggered
- [ ] Verify response includes citations
- [ ] Test tool execution (e.g., ask "generate notes on X")

---

## 🎁 Bonus Features (if time permits)

### Handwritten OCR
- [ ] Integrate Mathpix or Google Vision API
- [ ] Create OCR endpoint: `POST /api/ocr`
- [ ] Convert image → structured notes
- [ ] Save as material

### Video Generation
- [ ] Create slides from notes (Marp)
- [ ] Add TTS (ElevenLabs or similar)
- [ ] Stitch into video (optional)
- [ ] Upload to storage

### Community Features
- [ ] Create Post/Comment models
- [ ] Create discussion forum UI
- [ ] Add community posts endpoint
- [ ] Bot auto-reply (optional)

### UI Polish
- [ ] Dark mode
- [ ] Better typography
- [ ] Animations
- [ ] Loading states
- [ ] Error boundaries

---

## 🧪 Testing

### Unit Tests (Backend)
- [ ] Test SearchService
- [ ] Test GenerationService
- [ ] Test ValidationService
- [ ] Test database operations

### Integration Tests
- [ ] Test upload → ingest → search flow
- [ ] Test generation with real Gemini API
- [ ] Test chat with tools

### Manual Testing
- [ ] Test all endpoints in Swagger UI
- [ ] Test upload with sample files
- [ ] Test search with queries
- [ ] Test generation
- [ ] Test chat

---

## 📊 Demo Day Prep

### Before Demo
- [ ] Test end-to-end flow
- [ ] Prepare demo script (what to show)
- [ ] Prepare sample data
- [ ] Test with fresh database
- [ ] Write brief explanation slides
- [ ] Practice demo (don't go over time)

### Demo Script (example)
1. Show course/materials
2. Upload a sample PDF
3. Search for content
4. Generate notes (show citations)
5. Validate content (show scoring)
6. Ask a chat question
7. Show how AI returns grounded answers

---

## ✨ Quality Checklist

- [ ] Code is readable and documented
- [ ] Error handling is in place
- [ ] API responses are consistent
- [ ] UI is responsive (mobile-friendly)
- [ ] Database queries are optimized
- [ ] No hardcoded secrets in code
- [ ] Git history is clean (good commit messages)
- [ ] README is up-to-date

---

## 🚀 Final Checklist

- [ ] All core features working
- [ ] No critical bugs
- [ ] Database is populated with sample data
- [ ] API docs are clear
- [ ] UI is functional and decent-looking
- [ ] Team has practiced demo
- [ ] Have backup demo video (just in case)
- [ ] Know how to quickly reset DB if needed

---

**Good luck! Let's build something amazing! 🎉**
