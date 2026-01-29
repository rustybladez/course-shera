from __future__ import annotations

import datetime as dt
import uuid

from pydantic import BaseModel, Field


class MeOut(BaseModel):
    user_id: str
    role: str  # admin | student


class CourseCreate(BaseModel):
    title: str
    code: str | None = None
    term: str | None = None


class CourseOut(BaseModel):
    id: uuid.UUID
    title: str
    code: str | None = None
    term: str | None = None
    created_at: dt.datetime


class MaterialCreate(BaseModel):
    course_id: uuid.UUID
    category: str = Field(pattern="^(theory|lab)$")
    title: str
    type: str = Field(pattern="^(pdf|slides|code|note|link)$")
    week: int | None = None
    topic: str | None = None
    tags: list[str] | None = None


class MaterialOut(BaseModel):
    id: uuid.UUID
    course_id: uuid.UUID
    category: str
    title: str
    type: str
    storage_url: str | None = None  # null when type=link
    link_url: str | None = None
    week: int | None = None
    topic: str | None = None
    tags: list[str] | None = None
    created_at: dt.datetime


class MaterialUpdate(BaseModel):
    title: str | None = None
    category: str | None = Field(default=None, pattern="^(theory|lab)$")
    type: str | None = Field(default=None, pattern="^(pdf|slides|code|note|link)$")
    week: int | None = None
    topic: str | None = None
    tags: list[str] | None = None
    link_url: str | None = None


class MaterialLinkCreate(BaseModel):
    course_id: uuid.UUID
    title: str
    link_url: str
    topic: str | None = None
    week: int | None = None
    tags: list[str] | None = None


class SearchRequest(BaseModel):
    course_id: uuid.UUID | None = None
    query: str
    category: str | None = Field(default=None, pattern="^(theory|lab)$")
    top_k: int = 12
    language: str | None = None  # filter code chunks by language, e.g. python, javascript
    symbol: str | None = None  # filter by symbol_name (substring match)
    use_hybrid: bool = True  # combine semantic + full-text search


class SearchHit(BaseModel):
    chunk_id: uuid.UUID
    material_id: uuid.UUID
    material_title: str
    category: str
    excerpt: str
    score: float
    language: str | None = None
    symbol_name: str | None = None
    start_line: int | None = None
    end_line: int | None = None


class SearchResponse(BaseModel):
    hits: list[SearchHit]


class SearchAskRequest(BaseModel):
    course_id: uuid.UUID | None = None
    query: str
    category: str | None = Field(default=None, pattern="^(theory|lab)$")
    top_k: int = 8


class SearchAskResponse(BaseModel):
    answer: str
    citations: list[uuid.UUID]
    hits: list[SearchHit]


class GenerateRequest(BaseModel):
    course_id: uuid.UUID | None = None
    mode: str = Field(pattern="^(theory_notes|slides|lab_code)$")
    prompt: str


class GenerateResponse(BaseModel):
    content_markdown: str
    citations: list[uuid.UUID] = []
    validation: dict | None = None


class ChatCreateThreadRequest(BaseModel):
    course_id: uuid.UUID | None = None
    title: str | None = None


class ChatThreadOut(BaseModel):
    id: uuid.UUID
    course_id: uuid.UUID | None = None
    title: str | None = None


class ChatMessageIn(BaseModel):
    content: str


class ChatMessageOut(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    citations_json: str | None = None
    created_at: dt.datetime

