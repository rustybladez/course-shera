from __future__ import annotations

import uuid

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models import Material, MaterialChunk


def build_search_query(
    *,
    query_embedding: list[float],
    course_id: uuid.UUID | None,
    category: str | None,
    top_k: int,
) -> Select:
    # Distance operator: <=> (cosine distance) provided by pgvector.
    # Lower distance is better. We'll return score = 1 - distance for UI friendliness.
    stmt = (
        select(
            MaterialChunk.id.label("chunk_id"),
            MaterialChunk.material_id.label("material_id"),
            Material.title.label("material_title"),
            Material.category.label("category"),
            MaterialChunk.text.label("text"),
            (1.0 - MaterialChunk.embedding.cosine_distance(query_embedding)).label("score"),
        )
        .join(Material, Material.id == MaterialChunk.material_id)
        .where(MaterialChunk.embedding.is_not(None))
        .order_by(MaterialChunk.embedding.cosine_distance(query_embedding))
        .limit(top_k)
    )

    if course_id is not None:
        stmt = stmt.where(Material.course_id == course_id)
    if category is not None:
        stmt = stmt.where(Material.category == category)

    return stmt


def run_search(
    db: Session,
    *,
    query_embedding: list[float],
    course_id: uuid.UUID | None,
    category: str | None,
    top_k: int,
):
    stmt = build_search_query(
        query_embedding=query_embedding,
        course_id=course_id,
        category=category,
        top_k=top_k,
    )
    return db.execute(stmt).all()

