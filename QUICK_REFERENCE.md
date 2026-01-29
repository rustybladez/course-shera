# ⚡ Quick Reference Card

## 🚀 Get Started (Right Now)

```powershell
# Terminal 1: Run setup
.\setup.ps1

# Then update your .env files:
# backend/.env: DATABASE_URL, GEMINI_API_KEY
# frontend/.env.local: NEXT_PUBLIC_API_URL

# Terminal 2: Run servers
.\run.ps1
```

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🗂️ File Locations

| What | Where |
|------|-------|
| Python code | `backend/app/` |
| React pages | `frontend/src/app/` |
| Database schema | Migrations in `backend/scripts/` |
| API routes | `backend/app/api/routes/` |
| Business logic | `backend/app/services/` |
| Models | `backend/app/models.py` |
| Settings | `backend/app/core/config.py` |

---

## 🔧 Common Tasks

### Add a new API endpoint
1. Create function in `backend/app/api/routes/xyz.py`
2. Return Pydantic schema from `backend/app/schemas.py`
3. Use models from `backend/app/models.py` with SQLAlchemy
4. Import route in `backend/app/api/router.py`

### Add a React page
1. Create file: `frontend/src/app/path/page.tsx`
2. Import components and use API via `NEXT_PUBLIC_API_URL`
3. Use `axios` or fetch to call backend

### Connect to database
```python
from app.db import get_db
from sqlalchemy.orm import Session

def my_endpoint(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == "...").first()
    return user
```

### Call Gemini API
```python
from app.core.config import settings
from google.genai import Client

client = Client(api_key=settings.gemini_api_key)
response = client.models.generate_content(
    model=settings.gemini_text_model,
    contents="Your prompt here"
)
```

### Search with vector embeddings
```python
from sqlalchemy import func
result = db.query(MaterialChunk).order_by(
    MaterialChunk.embedding.cosine_distance(embedding_vector)
).limit(10).all()
```

---

## 📝 Data Model Cheat Sheet

```python
# User
class User(Base):
    id: UUID
    email: str
    name: str
    role: Enum('admin', 'student')

# Course
class Course(Base):
    id: UUID
    code: str
    title: str
    term: str
    created_by: UUID → User

# Material (PDF/code/slides)
class Material(Base):
    id: UUID
    course_id: UUID → Course
    category: str  # 'theory' | 'lab'
    type: str  # 'pdf' | 'code' | 'slides'
    storage_url: str
    week: int
    topic: str
    tags: List[str]

# Material chunk (for search)
class MaterialChunk(Base):
    id: UUID
    material_id: UUID → Material
    text: str
    embedding: Vector(768)
    language: str  # for code

# Generated content
class GeneratedAsset(Base):
    id: UUID
    course_id: UUID → Course
    request_type: str  # 'notes' | 'slides' | 'code'
    output_markdown: str
    citations: JSON
    validation: JSON

# Chat
class ChatThread(Base):
    id: UUID
    course_id: UUID → Course
    user_id: UUID → User

class ChatMessage(Base):
    id: UUID
    thread_id: UUID → ChatThread
    role: str  # 'user' | 'assistant'
    content: str
    citations: JSON
```

---

## 🎯 Core Endpoints to Implement

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/me` | GET | Current user |
| `/api/materials` | GET | List materials |
| `/api/materials` | POST | Upload material |
| `/api/materials/{id}` | DELETE | Delete (admin) |
| `/api/search` | POST | Semantic search |
| `/api/generate` | POST | AI generation |
| `/api/validate` | POST | Quality check |
| `/api/chat/threads` | GET | List chats |
| `/api/chat/threads/{id}/message` | POST | Send message |

---

## 🧪 Testing

### Backend
```bash
cd backend
.venv\Scripts\activate
pytest tests/
```

### Frontend
```bash
cd frontend
npm test
```

### Manual API testing
Visit http://localhost:8000/docs (Swagger UI)

---

## 🐛 Debugging

### Backend not starting?
```bash
# Check Python version
python --version

# Check dependencies
pip list

# Check database connection
python -c "from app.db import engine; print(engine.connect())"
```

### Frontend not connecting to API?
```bash
# Check NEXT_PUBLIC_API_URL in .env.local
# Make sure backend is running on :8000
# Check browser console for errors
```

### Vector search not working?
```bash
# Ensure pgvector extension is created:
psql <DATABASE_URL> -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Check embeddings were stored:
select count(*) from material_chunks where embedding is not null;
```

---

## 📚 Required Free Accounts

1. **Neon Postgres** → https://neon.tech
   - Get: DATABASE_URL
   - Keep password safe!

2. **Google AI Studio** → https://ai.google.dev
   - Get: GEMINI_API_KEY

3. **Clerk** (optional) → https://clerk.com
   - Get: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY

---

## 💡 Hackathon Pro Tips

1. **Start with mock data**: Don't spend time building fancy UX → get API working first
2. **Use Swagger UI**: Test endpoints before building frontend
3. **Minimal CSS**: Use Tailwind defaults, add custom CSS only if needed
4. **Prioritize MVP**: Features > Polish initially, then polish if time
5. **Document as you go**: Add comments to complex logic
6. **Test in Swagger UI first**: Then hook up React components
7. **Seed data script**: Create `backend/scripts/seed_demo.py` to populate DB
8. **Git commits**: Commit working versions frequently

---

## 🚨 Critical Don'ts

❌ Don't commit `.env` files  
❌ Don't use Docker  
❌ Don't over-engineer: simple works!  
❌ Don't forget citations in generated content  
❌ Don't skip testing before demo day  

---

## 🆘 Need Help?

Check these files first:
- `SETUP_GUIDE.md` - setup issues
- `IMPLEMENTATION_PLAN.md` - architecture & API details
- `README.md` - overview
- FastAPI docs: http://localhost:8000/docs

Good luck! 🚀
