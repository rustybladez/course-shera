# Testing Guide: Intelligent Search Engine

## Overview
The intelligent search system uses RAG (Retrieval Augmented Generation) with vector embeddings to enable semantic search across course materials.

## Prerequisites
✅ Backend running on http://localhost:8000
✅ Frontend running on http://localhost:3000
✅ Gemini API key configured in `backend/.env`
✅ Admin user created (admin@courseshera.com / admin123)
✅ Database with pgvector extension enabled

---

## Test Flow

### 1. **Login as Admin**
```
URL: http://localhost:3000/login
Email: admin@courseshera.com
Password: admin123
```

### 2. **Create a Course**
```
Navigate to: /admin/upload
1. Click "Create New Course"
2. Enter:
   - Title: "AI Fundamentals"
   - Code: "CS401"
   - Term: "Fall 2026"
3. Click "Create"
```

### 3. **Upload Test Material**

#### Option A: Upload PDF
```
1. Select course: "AI Fundamentals"
2. Category: Theory
3. Title: "Introduction to RAG"
4. Type: PDF
5. Week: 1
6. Topic: "retrieval augmented generation"
7. Tags: "rag, ai, llm"
8. Upload a PDF file about RAG/AI
9. Click "Upload"
```

#### Option B: Upload Markdown Note
```
Create a file called test_rag.md with this content:

---
# Retrieval Augmented Generation (RAG)

RAG is a technique that combines retrieval systems with large language models to reduce hallucinations and provide grounded responses.

## How RAG Works
1. User submits a query
2. Query is embedded into a vector
3. Similar documents are retrieved using vector search
4. Retrieved context is passed to the LLM
5. LLM generates a response based on the context

## Benefits
- Reduces hallucination
- Provides source attribution
- Enables dynamic knowledge updates
- More cost-effective than fine-tuning
---

Upload this file with:
- Category: Theory
- Title: "RAG Explained"
- Type: Note
- Week: 1
- Topic: "rag fundamentals"
- Tags: "rag, retrieval, llm"
```

### 4. **Ingest the Material**
```
1. Find the uploaded material in the materials list
2. Click the "Ingest" button next to it
3. Wait for confirmation: "Ingested X chunks"
4. Status should show success message
```

**What happens during ingestion:**
- Text extracted from file (PDF/markdown/code)
- Content split into ~1800 character chunks (200 char overlap)
- Each chunk embedded using Gemini (gemini-embedding-001)
- Embeddings stored in PostgreSQL with pgvector

### 5. **Test Semantic Search**
```
Navigate to: /search
```

#### Test Case 1: Basic Query
```
Query: "what is RAG"
Expected: Should return chunks explaining RAG concept
Check: Relevance score > 60%
```

#### Test Case 2: Conceptual Query
```
Query: "how to reduce hallucination in AI models"
Expected: Should return chunks about RAG's benefits
Check: Results mention RAG, grounding, or context
```

#### Test Case 3: Specific Question
```
Query: "steps involved in retrieval augmented generation"
Expected: Should return chunks with the RAG workflow
Check: Results contain numbered steps or process description
```

#### Test Case 4: With Filters
```
Query: "explain AI concepts"
Filters:
- Course: "AI Fundamentals"
- Category: Theory
- Results: Top 10
Expected: Only results from selected course/category
```

#### Test Case 5: No Results
```
Query: "quantum computing algorithms"
Expected: "No results found" message (if no quantum content uploaded)
```

### 6. **Test Multiple Materials**
```
Upload 2-3 more materials:
1. A PDF on Neural Networks
2. A code file (Python ML script)
3. A markdown note on Transformers

Ingest all of them, then test:
Query: "compare neural networks and transformers"
Expected: Results from both materials
```

### 7. **Verify Result Quality**

For each search result, check:
- ✅ **Ranking**: Most relevant results appear first (highest score)
- ✅ **Excerpt**: Text snippet is coherent and relevant
- ✅ **Metadata**: Material title and category shown correctly
- ✅ **Score**: Relevance percentage makes sense (high for exact matches)
- ✅ **Numbering**: Results numbered 1, 2, 3...

---

## Expected Behavior

### ✅ Success Indicators
- Search returns results within 2-3 seconds
- Relevance scores > 50% for good matches
- Results ranked by similarity
- Query like "RAG" matches "Retrieval Augmented Generation"
- Semantic understanding (synonyms work)
- Filters work correctly

### ❌ Common Issues & Solutions

**Issue**: "GEMINI_API_KEY is not configured"
```
Solution: Add to backend/.env:
GEMINI_API_KEY=your_key_here
Restart backend
```

**Issue**: No results even after ingesting
```
Possible causes:
1. Material not ingested (check in admin panel)
2. Query too specific or unrelated
3. Embeddings not stored (check database)

Debug:
- Check backend logs for SQL queries
- Verify material_chunks table has data:
  SELECT COUNT(*) FROM material_chunks WHERE embedding IS NOT NULL;
```

**Issue**: Very low relevance scores (<30%)
```
Cause: Query and content are semantically distant
Solution: 
- Try broader queries
- Upload more diverse content
- Check if content was extracted correctly
```

**Issue**: Search slow (>5 seconds)
```
Possible causes:
1. Too many chunks in database (>10k)
2. Missing vector index

Solution: Add pgvector index (backend does this on startup)
CREATE INDEX IF NOT EXISTS idx_material_chunks_embedding 
ON material_chunks USING ivfflat (embedding vector_cosine_ops);
```

---

## Backend API Testing (Optional)

### Test via Swagger UI
```
URL: http://localhost:8000/docs

1. POST /auth/login
   Body: {"email": "admin@courseshera.com", "password": "admin123"}
   Copy the access_token

2. Click "Authorize" button, paste: Bearer <token>

3. POST /materials/{material_id}/ingest
   Test ingestion directly

4. POST /search
   Body: {
     "query": "what is RAG",
     "course_id": null,
     "category": null,
     "top_k": 10
   }
```

### Direct Database Queries
```sql
-- Check if materials exist
SELECT id, title, type FROM materials;

-- Check if chunks were created
SELECT material_id, COUNT(*), AVG(LENGTH(text)) as avg_chunk_size
FROM material_chunks
GROUP BY material_id;

-- Check if embeddings exist
SELECT COUNT(*) as total_chunks,
       COUNT(embedding) as embedded_chunks
FROM material_chunks;

-- Test vector search manually
SELECT m.title, mc.text, 
       1 - (mc.embedding <=> '[0.1, 0.2, ...]') as score
FROM material_chunks mc
JOIN materials m ON m.id = mc.material_id
WHERE mc.embedding IS NOT NULL
ORDER BY mc.embedding <=> '[0.1, 0.2, ...]'
LIMIT 5;
```

---

## Performance Benchmarks

**Expected Performance:**
- Upload: <2 seconds
- Ingestion: 1-3 seconds per material (depends on size)
- Search: 1-3 seconds
- Embedding generation: ~0.5-1s per chunk batch

**Scalability:**
- <100 materials: Instant search
- 100-1000 materials: <2s search
- 1000+ materials: Consider pagination

---

## Feature Checklist

- ✅ Vector embeddings using Gemini API
- ✅ pgvector cosine similarity search
- ✅ Chunking with overlap (1800/200 chars)
- ✅ Text extraction (PDF, markdown, code)
- ✅ Authentication required
- ✅ Course/category filters
- ✅ Top-K result limiting
- ✅ Relevance scoring (0-100%)
- ✅ Result ranking by similarity
- ✅ Material metadata display
- ✅ Error handling
- ✅ Loading states
- ✅ Keyboard shortcuts (Enter to search)

---

## Next Steps

After verifying search works:
1. ✅ Upload diverse materials (PDFs, code, notes)
2. ✅ Test with real course content
3. ✅ Experiment with different query types
4. 🔄 Fine-tune chunk size if needed (in `ingest.py`)
5. 🔄 Add more filters (week, topic, tags)
6. 🔄 Implement result caching for popular queries

---

## Troubleshooting Tips

1. **Check backend logs** - Watch uvicorn terminal for errors
2. **Verify API calls** - Open browser DevTools → Network tab
3. **Test incrementally** - One material at a time
4. **Use specific queries** - Start with exact terms from your content
5. **Check database** - Run SQL queries to verify data

---

## Success Criteria

✅ Upload → Ingest → Search workflow completes without errors
✅ Search returns relevant results with scores > 50%
✅ Results ranked correctly (best match first)
✅ Filters work as expected
✅ UI responsive and intuitive
✅ Error messages clear and actionable

**If all tests pass, the intelligent search engine is production-ready!** 🎉
