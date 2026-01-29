from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import GenerateRequest, GenerateResponse
from app.services.gemini import GeminiService
from app.services.search import run_search

router = APIRouter()


def _system_prompt(mode: str) -> str:
    if mode == "theory_notes":
        return (
            "You are an expert course assistant. Write comprehensive, well-structured Markdown notes.\n"
            "Rules:\n"
            "- Use headings, bullet points, clear examples, and diagrams where helpful.\n"
            "- Draw from your general knowledge to explain concepts thoroughly.\n"
            "- When SOURCES are provided, integrate them and add citation markers [cite:CHUNK_ID].\n"
            "- If SOURCES don't cover the topic fully, use your expertise to fill gaps while noting what's from your knowledge vs. sources.\n"
            "- Make content educational, accurate, and easy to understand.\n"
        )
    if mode == "slides":
        return (
            "You are an expert course assistant. Create engaging slide content in Markdown.\n"
            "Rules:\n"
            "- Keep each slide concise with clear bullet points.\n"
            "- Create 5-8 slides covering the topic comprehensively.\n"
            "- Use '---' to separate slides.\n"
            "- Draw from your general knowledge to explain concepts.\n"
            "- When SOURCES are provided, cite them with [cite:CHUNK_ID] in content or speaker notes.\n"
            "- Make slides visually structured and presentation-ready.\n"
        )
    if mode == "lab_code":
        return (
            "You are an expert lab instructor. Create comprehensive code-centric learning material.\n"
            "Rules:\n"
            "- Include complete, runnable code examples with proper syntax.\n"
            "- Provide detailed explanations of how the code works.\n"
            "- Specify the programming language clearly.\n"
            "- Draw from your programming knowledge to create best-practice examples.\n"
            "- When SOURCES are provided with code patterns, cite them with [cite:CHUNK_ID].\n"
            "- Include practical exercises or variations for learners to try.\n"
        )
    return "You are a helpful assistant."


@router.post("", response_model=GenerateResponse)
def generate(req: GenerateRequest, db: Session = Depends(get_db)):
    gemini = GeminiService()
    if not gemini.is_configured():
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY is not configured")

    q_emb = gemini.embed([req.prompt])[0]
    try:
        rows = run_search(
            db,
            query_embedding=q_emb,
            query_text=req.prompt,
            course_id=req.course_id,
            category=None,
            top_k=6,
            use_hybrid=True,
        )
    except Exception:
        rows = run_search(
            db,
            query_embedding=q_emb,
            query_text="",
            course_id=req.course_id,
            category=None,
            top_k=6,
            use_hybrid=False,
        )

    citations = [r.chunk_id for r in rows]
    sources = []
    for r in rows:
        sources.append(
            {
                "chunk_id": str(r.chunk_id),
                "material_title": r.material_title,
                "category": r.category,
                "text": r.text,
            }
        )

    if sources:
        user = (
            f"USER PROMPT:\n{req.prompt}\n\n"
            f"RELEVANT COURSE MATERIALS (optional context to integrate if helpful):\n"
            f"{json.dumps(sources, ensure_ascii=False)}\n\n"
            "Generate comprehensive content for the user's prompt. "
            "If the provided materials are relevant, integrate them and cite with [cite:CHUNK_ID]. "
            "If materials don't fully cover the topic, use your general knowledge to create complete, educational content."
        )
    else:
        user = (
            f"USER PROMPT:\n{req.prompt}\n\n"
            "No specific course materials were found for this topic. "
            "Generate comprehensive educational content using your general knowledge. "
            "Make it thorough, accurate, and well-structured."
        )
    
    md = gemini.generate_markdown(_system_prompt(req.mode), user)

    # Minimal validation: ensure at least one citation marker if we had sources.
    validation = None
    if citations:
        validation = {
            "has_any_citation_marker": "[cite:" in md,
            "retrieved_chunks": [str(c) for c in citations],
        }

    return GenerateResponse(content_markdown=md, citations=citations, validation=validation)

