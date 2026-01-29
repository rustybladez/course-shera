from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import SearchRequest, SearchResponse, SearchHit
from app.services.gemini import GeminiService
from app.services.search import run_search

router = APIRouter()


@router.post("", response_model=SearchResponse)
def search(req: SearchRequest, db: Session = Depends(get_db)):
    gemini = GeminiService()
    if not gemini.is_configured():
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY is not configured")

    q_emb = gemini.embed([req.query])[0]
    rows = run_search(
        db,
        query_embedding=q_emb,
        course_id=req.course_id,
        category=req.category,
        top_k=req.top_k,
    )

    hits: list[SearchHit] = []
    for r in rows:
        excerpt = (r.text or "").strip()
        if len(excerpt) > 700:
            excerpt = excerpt[:700].rstrip() + "…"
        hits.append(
            SearchHit(
                chunk_id=r.chunk_id,
                material_id=r.material_id,
                material_title=r.material_title,
                category=r.category,
                excerpt=excerpt,
                score=float(r.score or 0.0),
            )
        )

    return SearchResponse(hits=hits)

