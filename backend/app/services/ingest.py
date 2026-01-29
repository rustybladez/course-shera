from __future__ import annotations

import os
from dataclasses import dataclass

import fitz  # pymupdf


@dataclass
class ExtractedDoc:
    text: str
    detected_type: str | None = None


def extract_text_from_path(path: str) -> ExtractedDoc:
    ext = os.path.splitext(path)[1].lower()

    if ext in {".pdf"}:
        doc = fitz.open(path)
        pages = []
        for p in doc:
            pages.append(p.get_text("text"))
        return ExtractedDoc(text="\n\n".join(pages), detected_type="pdf")

    # Treat everything else as plain text for MVP (code, md, txt)
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return ExtractedDoc(text=f.read(), detected_type="text")


def simple_chunk(text: str, max_chars: int = 1800, overlap: int = 200) -> list[str]:
    """
    Hackathon-grade chunker: char-based with overlap.
    Works fine for small corpora; swap later for token/heading-aware chunking.
    """
    t = (text or "").strip()
    if not t:
        return []

    chunks: list[str] = []
    i = 0
    while i < len(t):
        j = min(len(t), i + max_chars)
        chunk = t[i:j].strip()
        if chunk:
            chunks.append(chunk)
        if j >= len(t):
            break
        i = max(0, j - overlap)
    return chunks

