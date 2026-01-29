# Testing Guide: Part 3 - AI-Generated Learning Materials

## Overview
Part 3 implements AI-powered generation of learning materials based on course content using RAG (Retrieval-Augmented Generation). The system retrieves relevant context from uploaded materials and uses Gemini to generate new educational content.

## System Architecture

### Backend (`/generate` endpoint)
- **File**: `backend/app/api/routes/generate.py`
- **Function**: Receives generation requests, retrieves relevant chunks via RAG, generates content using Gemini
- **Modes**:
  - `theory_notes`: Reading notes in Markdown format
  - `slides`: Presentation slides in Markdown (Marp-style)
  - `lab_code`: Code-centric learning materials with runnable examples

### Frontend (`/generate` page)
- **File**: `frontend/src/app/generate/page.tsx`
- **Features**: 
  - Topic/prompt input
  - Course filtering (optional)
  - Mode selection
  - Real-time generation with loading states
  - Expandable/collapsible results
  - Citation tracking

### Integration Points
1. **Authentication**: Uses JWT tokens from our custom auth system
2. **RAG Pipeline**: Leverages `run_search()` from search service
3. **Gemini Service**: Uses `generate_markdown()` for content generation
4. **Citations**: Tracks which chunks were used and cited

## Prerequisites

### 1. Backend Setup
```bash
cd backend
# Ensure environment is configured
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Variables
Ensure `.env` file has:
```
GEMINI_API_KEY=your_api_key_here
DATABASE_URL=your_neon_postgres_url
JWT_SECRET=your_secret_key
```

### 3. Database State
- At least one course created
- Materials uploaded and ingested (chunks + embeddings exist)
- Test with materials from `backend/samples/intro_note.md`

### 4. User Authentication
- Admin account created: `python scripts/create_admin.py`
- Can login at http://localhost:3000/login

## Testing Procedures

### Test 1: Theory Notes Generation

**Purpose**: Verify generation of structured reading notes

**Steps**:
1. Navigate to http://localhost:3000/generate
2. Select "📝 Reading Notes" mode
3. Enter prompt: "Explain sorting algorithms"
4. Click "Generate"

**Expected Results**:
- ✅ Loading state shows "Generating..." with spinner
- ✅ Result appears in green-bordered card
- ✅ Content includes:
  - Markdown headings and formatting
  - Bullet points and examples
  - `[cite:chunk_id]` markers in content
- ✅ Citation count shown (e.g., "3 sources cited")
- ✅ "Show More/Less" button works for expansion
- ✅ Content is grounded in uploaded materials

**Sample Expected Output**:
```markdown
# Sorting Algorithms

## Overview
Sorting algorithms arrange data in a specific order [cite:abc123].

## Common Algorithms
- **Bubble Sort**: Compares adjacent elements [cite:def456]
- **Quick Sort**: Divide-and-conquer approach [cite:ghi789]
...
```

### Test 2: Slides Generation

**Purpose**: Verify slide deck content generation

**Steps**:
1. Navigate to http://localhost:3000/generate
2. Select "📊 Slides" mode
3. Enter prompt: "Introduction to Machine Learning"
4. Click "Generate"

**Expected Results**:
- ✅ Content structured as slide format
- ✅ Each slide has clear separation
- ✅ Concise bullet points (not verbose paragraphs)
- ✅ Citations present in speaker notes or near claims

**Sample Expected Output**:
```markdown
---

# Introduction to Machine Learning

---

## What is ML?
- Learning from data without explicit programming [cite:abc123]
- Pattern recognition and prediction
- Applications: image recognition, NLP, recommendations

---

## Types of Learning
- **Supervised**: Labeled training data [cite:def456]
...
```

### Test 3: Lab Code Generation

**Purpose**: Verify code-centric material generation

**Steps**:
1. Navigate to http://localhost:3000/generate
2. Select "💻 Lab Code" mode
3. Enter prompt: "Implement binary search in Python"
4. Click "Generate"

**Expected Results**:
- ✅ Contains runnable code block
- ✅ Syntax highlighting applied
- ✅ Code is syntactically correct (no syntax errors)
- ✅ Includes explanation of the code
- ✅ Citations reference source materials

**Sample Expected Output**:
```markdown
# Binary Search Implementation

## Concept
Binary search efficiently finds elements in sorted arrays [cite:abc123].

## Implementation

\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1
\`\`\`

## Explanation
The algorithm divides the search space in half [cite:def456]...
```

### Test 4: Course Context Filtering

**Purpose**: Verify course-specific generation

**Steps**:
1. Ensure materials exist for multiple courses
2. Navigate to /generate
3. Select a specific course from dropdown
4. Enter prompt related to that course
5. Generate content

**Expected Results**:
- ✅ RAG retrieval only searches within selected course
- ✅ Citations reference materials from that course only
- ✅ Content is contextually relevant to the course

### Test 5: Error Handling

**Purpose**: Verify graceful error handling

**Test Cases**:

**A. Empty Prompt**
- Enter nothing and try to generate
- Expected: Button disabled, no API call

**B. No Materials Ingested**
- Select a course with no materials
- Try to generate
- Expected: Generates content but notes lack of context

**C. API Key Missing**
- Temporarily remove GEMINI_API_KEY
- Try to generate
- Expected: Error message "GEMINI_API_KEY is not configured"

**D. Network Error**
- Stop backend server
- Try to generate
- Expected: Error message displayed in red card

### Test 6: Citation System

**Purpose**: Verify citation tracking works

**Steps**:
1. Generate any content with multiple sources
2. Check validation object in result
3. Verify `has_any_citation_marker: true`
4. Check `retrieved_chunks` array matches citations

**Expected Results**:
- ✅ Citations array contains chunk UUIDs
- ✅ Validation object confirms citation markers exist
- ✅ Number of citations matches sources used

### Test 7: Content Quality Validation

**Purpose**: Ensure generated content meets quality standards

**Checklist**:
- [ ] **Coherence**: Content flows logically
- [ ] **Structure**: Proper headings and organization
- [ ] **Grounding**: Claims are supported by citations
- [ ] **Accuracy**: No hallucinated facts (verify against sources)
- [ ] **Completeness**: Addresses the prompt fully
- [ ] **Formatting**: Markdown renders correctly

### Test 8: UI/UX Testing

**Purpose**: Verify user experience quality

**Checklist**:
- [ ] Loading state is clear and animated
- [ ] Error messages are helpful
- [ ] Expand/collapse works smoothly
- [ ] Mode selector is intuitive
- [ ] Suggestions are helpful
- [ ] Font Awesome icons render
- [ ] Mobile responsive (test on narrow viewport)

## Integration Testing

### RAG Pipeline Integration
1. Upload a new material via /admin/upload
2. Wait for ingestion to complete
3. Generate content on a related topic
4. Verify the new material's chunks appear in citations

### Multi-Course Scenario
1. Create 2 courses: "Algorithms" and "Web Dev"
2. Upload materials to each
3. Generate without course filter → mixed sources
4. Generate with course filter → filtered sources

## Performance Benchmarks

Expected response times:
- **Theory Notes**: 5-15 seconds
- **Slides**: 5-12 seconds  
- **Lab Code**: 8-20 seconds (depends on code complexity)

If slower:
- Check Gemini API latency
- Verify vector search performance
- Check database connection

## Known Issues & Limitations

1. **Citation Format**: Uses `[cite:chunk_id]` which is UUID-based (not user-friendly display yet)
2. **No Image Generation**: Visual aids not implemented (mentioned in problem set as bonus)
3. **No MCP Wikipedia Integration**: External knowledge base integration pending
4. **Code Validation**: Syntactic correctness not programmatically verified
5. **Slide Formatting**: Plain Markdown, not Marp-compatible yet

## Troubleshooting

### Problem: "GEMINI_API_KEY is not configured"
**Solution**: 
```bash
# Add to backend/.env
GEMINI_API_KEY=your_key_here
```

### Problem: No citations in generated content
**Causes**:
1. No materials ingested → Upload and ingest first
2. Query too vague → Be more specific
3. Course filter excluding relevant materials

**Solution**: Check database has `material_chunks` with embeddings

### Problem: Content seems generic/hallucinated
**Cause**: RAG retrieved irrelevant chunks or no chunks

**Solution**:
- Improve prompt specificity
- Upload more relevant materials
- Check search relevance scores in validation object

### Problem: Frontend shows blank page
**Solutions**:
1. Check browser console for errors
2. Verify Font Awesome CDN loaded
3. Check auth token exists: `localStorage.getItem('token')`
4. Verify backend is running on port 8000

### Problem: "Cannot find name 'LogoutButton'"
**Solution**: Already fixed - ensure imports include:
```typescript
import { LogoutButton } from "@/components/LogoutButton";
```

## API Documentation

### POST `/generate`

**Request**:
```json
{
  "course_id": "uuid-or-null",
  "mode": "theory_notes|slides|lab_code",
  "prompt": "Your topic or question"
}
```

**Response**:
```json
{
  "content_markdown": "# Generated content...",
  "citations": ["chunk_uuid_1", "chunk_uuid_2"],
  "validation": {
    "has_any_citation_marker": true,
    "retrieved_chunks": ["chunk_uuid_1", "chunk_uuid_2"]
  }
}
```

**Authentication**: Bearer token required

## Success Criteria

Part 3 is considered complete when:

- [x] Backend endpoint generates all 3 modes
- [x] Frontend integrated with backend (no client-side SDK)
- [x] Authentication works
- [x] RAG retrieval provides context
- [x] Citations tracked and displayed
- [x] Content is grounded in materials
- [x] UI is polished and responsive
- [ ] Code syntax validation (bonus)
- [ ] Image generation (bonus)
- [ ] MCP Wikipedia integration (bonus)

## Next Steps

After Part 3 validation:
1. **Part 4**: Validation System (verify generated content)
2. **Part 5**: Chat Agent (multi-turn conversations)
3. **Enhancements**: 
   - MCP server for Wikipedia
   - Visual diagram generation
   - PDF export functionality
   - Slide deck export

## Contact & Support

For issues or questions:
- Check backend logs: Look for errors in uvicorn output
- Check frontend console: Browser DevTools → Console
- Verify database state: Query `material_chunks` table
- Test API directly: Use Postman or curl to test `/generate`

---

**Generated**: January 29, 2026  
**Version**: 1.0  
**Status**: Part 3 Integration Complete
