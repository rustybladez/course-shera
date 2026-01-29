from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Material, MaterialChunk


def build_search_query(
    *,
    query_embedding: list[float],
    query_text: str,
    course_id: uuid.UUID | None,
    category: str | None,
    top_k: int,
    language: str | None = None,
    symbol: str | None = None,
    use_hybrid: bool = True,
):
    vec_score = 1.0 - MaterialChunk.embedding.cosine_distance(query_embedding)
    cols = [
        MaterialChunk.id.label("chunk_id"),
        MaterialChunk.material_id.label("material_id"),
        Material.title.label("material_title"),
        Material.category.label("category"),
        MaterialChunk.text.label("text"),
        MaterialChunk.language.label("language"),
        MaterialChunk.symbol_name.label("symbol_name"),
        MaterialChunk.start_line.label("start_line"),
        MaterialChunk.end_line.label("end_line"),
    ]

    use_fts = use_hybrid and bool((query_text or "").strip())
    if use_fts:
        fts_raw = func.coalesce(
            func.ts_rank_cd(
                func.to_tsvector("english", MaterialChunk.text),
                func.plainto_tsquery("english", query_text.strip()),
            ),
            0.0,
        )
        fts_norm = func.least(1.0, fts_raw * 5.0)
        combined = vec_score * 0.7 + fts_norm * 0.3
        cols.append(combined.label("score"))
        order_expr = combined.desc()
    else:
        cols.append(vec_score.label("score"))
        order_expr = vec_score.desc()

    stmt = (
        select(*cols)
        .join(Material, Material.id == MaterialChunk.material_id)
        .where(MaterialChunk.embedding.is_not(None))
        .order_by(order_expr)
        .limit(top_k)
    )

    if course_id is not None:
        stmt = stmt.where(Material.course_id == course_id)
    if category is not None:
        stmt = stmt.where(Material.category == category)
    if language is not None and language.strip():
        stmt = stmt.where(MaterialChunk.language == language.strip().lower())
    if symbol is not None and symbol.strip():
        stmt = stmt.where(MaterialChunk.symbol_name.ilike(f"%{symbol.strip()}%"))

    return stmt


def run_search(
    db: Session,
    *,
    query_embedding: list[float],
    query_text: str = "",
    course_id: uuid.UUID | None = None,
    category: str | None = None,
    top_k: int = 12,
    language: str | None = None,
    symbol: str | None = None,
    use_hybrid: bool = True,
):
    stmt = build_search_query(
        query_embedding=query_embedding,
        query_text=query_text,
        course_id=course_id,
        category=category,
        top_k=top_k,
        language=language,
        symbol=symbol,
        use_hybrid=use_hybrid,
    )
    return db.execute(stmt).all()
