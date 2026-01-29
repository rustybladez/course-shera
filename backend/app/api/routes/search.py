from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import (
    SearchAskRequest,
    SearchAskResponse,
    SearchRequest,
    SearchResponse,
    SearchHit,
)
from app.services.gemini import GeminiService
from app.services.search import run_search

logger = logging.getLogger(__name__)
router = APIRouter()


def _rows_to_hits(rows, max_excerpt: int = 700) -> list[SearchHit]:
    hits: list[SearchHit] = []
    for r in rows:
        excerpt = (r.text or "").strip()
        if len(excerpt) > max_excerpt:
            excerpt = excerpt[:max_excerpt].rstrip() + "…"
        hits.append(
            SearchHit(
                chunk_id=r.chunk_id,
                material_id=r.material_id,
                material_title=r.material_title,
                category=r.category,
                excerpt=excerpt,
                score=float(r.score or 0.0),
                language=getattr(r, "language", None),
                symbol_name=getattr(r, "symbol_name", None),
                start_line=getattr(r, "start_line", None),
                end_line=getattr(r, "end_line", None),
            )
        )
    return hits


@router.post("", response_model=SearchResponse)
def search(req: SearchRequest, db: Session = Depends(get_db)):
    gemini = GeminiService()
    if not gemini.is_configured():
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY is not configured")

    q_emb = gemini.embed([req.query])[0]
    use_hybrid = getattr(req, "use_hybrid", True)
    lang = getattr(req, "language", None)
    sym = getattr(req, "symbol", None)

    try:
        rows = run_search(
            db,
            query_embedding=q_emb,
            query_text=req.query,
            course_id=req.course_id,
            category=req.category,
            top_k=req.top_k,
            language=lang,
            symbol=sym,
            use_hybrid=use_hybrid,
        )
    except Exception as e:
        if use_hybrid:
            logger.warning("Hybrid search failed, falling back to vector-only: %s", e)
            rows = run_search(
                db,
                query_embedding=q_emb,
                query_text="",
                course_id=req.course_id,
                category=req.category,
                top_k=req.top_k,
                language=lang,
                symbol=sym,
                use_hybrid=False,
            )
        else:
            raise

    return SearchResponse(hits=_rows_to_hits(rows))


@router.post("/ask", response_model=SearchAskResponse)
def search_ask(req: SearchAskRequest, db: Session = Depends(get_db)):
    """RAG: retrieve relevant chunks, then generate a grounded answer with citations."""
    gemini = GeminiService()
    if not gemini.is_configured():
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY is not configured")

    q_emb = gemini.embed([req.query])[0]
    rows = run_search(
        db,
        query_embedding=q_emb,
        query_text=req.query,
        course_id=req.course_id,
        category=req.category,
        top_k=req.top_k,
        use_hybrid=True,
    )

    hits = _rows_to_hits(rows)
    if not hits:
        return SearchAskResponse(
            answer="I couldn't find any relevant material in the course content for that question. Try rephrasing or broadening your query.",
            citations=[],
            hits=[],
        )

    sources = []
    for h in hits:
        blurb = (h.excerpt or "")[:500].strip()
        if len((h.excerpt or "")) > 500:
            blurb += "…"
        sources.append(
            f"[{h.chunk_id}]\n{h.material_title} ({h.category})\n{blurb}"
        )

    system = (
        "You are a course assistant. Answer the user's question using ONLY the provided source excerpts. "
        "Keep answers concise and well-structured. "
        "When you use information from a source, cite it by writing [chunk_id] at the end of the relevant sentence. "
        "If the sources do not contain enough information to answer, say so and cite what is relevant."
    )
    user = (
        "SOURCES:\n\n"
        + "\n\n---\n\n".join(sources)
        + "\n\n---\n\nQUESTION: "
        + req.query
        + "\n\nProvide a grounded answer with [chunk_id] citations."
    )
    answer = gemini.generate_markdown(system, user)

    citation_ids = list({
        h.chunk_id for h in hits
        if f"[{h.chunk_id}]" in answer or str(h.chunk_id) in answer
    })

    return SearchAskResponse(answer=answer, citations=citation_ids, hits=hits)

