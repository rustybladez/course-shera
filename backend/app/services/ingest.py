from __future__ import annotations

import os
import re
from dataclasses import dataclass

import fitz  # pymupdf

# ---------------------------------------------------------------------------
# Extraction
# ---------------------------------------------------------------------------


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

    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return ExtractedDoc(text=f.read(), detected_type="text")


# ---------------------------------------------------------------------------
# Theory chunking (heading-aware for Markdown, else char-based with overlap)
# ---------------------------------------------------------------------------


def _line_to_offset(text: str) -> list[int]:
    """Maps line index (0-based) -> start character offset."""
    out: list[int] = [0]
    for i, c in enumerate(text):
        if c == "\n":
            out.append(i + 1)
    return out


def simple_chunk(text: str, max_chars: int = 1800, overlap: int = 200) -> list[str]:
    """
    Char-based chunking with overlap. Used as fallback.
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


def chunk_theory_improved(text: str, path: str = "") -> list[str]:
    """
    Heading-aware for Markdown (split by ## or ###); otherwise simple_chunk.
    """
    t = (text or "").strip()
    if not t:
        return []

    ext = os.path.splitext(path)[1].lower() if path else ""
    if ext in {".md", ".markdown"}:
        # Split by ## or ###, keep header with following content
        parts: list[str] = []
        current: list[str] = []
        for line in t.split("\n"):
            if re.match(r"^#{2,3}\s", line):
                if current:
                    parts.append("\n".join(current))
                current = [line]
            else:
                current.append(line)
        if current:
            parts.append("\n".join(current))
        if not parts:
            return simple_chunk(t)
        # Merge very small consecutive parts to avoid tiny chunks
        merged: list[str] = []
        acc = ""
        for p in parts:
            if acc and len(acc) + len(p) < 1200:
                acc = acc + "\n\n" + p
            else:
                if acc:
                    merged.append(acc.strip())
                acc = p
        if acc:
            merged.append(acc.strip())
        return merged if merged else simple_chunk(t)

    return simple_chunk(t)


# ---------------------------------------------------------------------------
# Code chunking (structure-aware: def/class/function boundaries)
# ---------------------------------------------------------------------------


@dataclass
class CodeChunk:
    text: str
    language: str
    symbol_name: str | None = None
    start_line: int | None = None
    end_line: int | None = None


# Patterns: (regex for boundary, group index for symbol name, or None)
_CODE_PATTERNS: dict[str, list[tuple[str, int | None]]] = {
    "python": [
        (r"(?:^|\n)(async\s+)?def\s+(\w+)\s*\(", 2),
        (r"(?:^|\n)class\s+(\w+)\s*[:(]", 1),
    ],
    "javascript": [
        (r"\nfunction\s+(\w+)\s*\(", 1),
        (r"\nclass\s+(\w+)\s*[\s{]", 1),
        (r"\n(const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function", 2),
    ],
    "typescript": [
        (r"\nfunction\s+(\w+)\s*\(", 1),
        (r"\nclass\s+(\w+)\s*[\s{]", 1),
        (r"\n(const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function", 2),
        (r"\n(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(", 1),
    ],
    "java": [
        (r"\n(?:public|private|protected)?\s*(?:static\s+)?[\w<>\[\],\s]+\s+(\w+)\s*\(", 1),
        (r"\n(?:public\s+)?class\s+(\w+)\s*[\s{]", 1),
    ],
    "c": [
        (r"\n(?:static\s+)?[\w\s\*]+\s+(\w+)\s*\(", 1),
    ],
    "cpp": [
        (r"\n(?:[\w:\s]+)\s+(\w+)\s*\(", 1),
        (r"\nclass\s+(\w+)\s*[\s{]", 1),
    ],
    "go": [
        (r"\nfunc\s+(?:\([^)]+\)\s+)?(\w+)\s*\(", 1),
    ],
    "rust": [
        (r"\n(?:pub\s+)?fn\s+(\w+)\s*\(", 1),
        (r"\n(?:pub\s+)?struct\s+(\w+)\s*[\s{]", 1),
        (r"\n(?:pub\s+)?impl\s+(\w+)\s*[\s{]", 1),
    ],
}

_EXT_TO_LANG: dict[str, str] = {
    ".py": "python",
    ".js": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".java": "java",
    ".c": "c",
    ".h": "c",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".cxx": "cpp",
    ".hpp": "hpp",
    ".go": "go",
    ".rs": "rust",
}


def _infer_language(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    return _EXT_TO_LANG.get(ext, "plain")


def _code_boundaries(text: str, language: str) -> list[tuple[int, int, str | None]]:
    """
    Returns list of (start_offset, end_offset, symbol_name) for each top-level block.
    """
    patterns = _CODE_PATTERNS.get(language, [])
    if not patterns:
        return [(0, len(text), None)]

    by_start: dict[int, str | None] = {}
    for pat, grp in patterns:
        for m in re.finditer(pat, text):
            sym = None
            if grp is not None and m.lastindex is not None and grp <= m.lastindex:
                try:
                    sym = m.group(grp)
                except IndexError:
                    pass
            if sym and re.match(r"^(async|const|let|var|export|pub|static|public|private|protected)$", sym):
                sym = None
            s = m.start()
            if s not in by_start:
                by_start[s] = sym
            elif sym and not by_start[s]:
                by_start[s] = sym
    if 0 not in by_start:
        by_start[0] = None
    starts = sorted(by_start.items(), key=lambda x: x[0])

    out: list[tuple[int, int, str | None]] = []
    keys = [k for k, _ in starts]
    for i, (s0, sym) in enumerate(starts):
        s1 = keys[i + 1] if i + 1 < len(keys) else len(text)
        segment = text[s0:s1].strip()
        if len(segment) < 20 and sym is None:
            continue
        out.append((s0, s1, sym))
    return out


def chunk_code_structure(text: str, path: str) -> list[CodeChunk]:
    """
    Structure-aware chunking for code. Splits by def/class/function (etc.),
    extracts symbol names, computes line ranges.
    """
    t = (text or "").strip()
    if not t:
        return []

    lang = _infer_language(path)
    lines = _line_to_offset(t)

    def offset_to_line(offset: int) -> int:
        for i, o in enumerate(lines):
            if o > offset:
                return max(0, i - 1)
        return max(0, len(lines) - 1)

    boundaries = _code_boundaries(t, lang)
    chunks: list[CodeChunk] = []
    for start, end, sym in boundaries:
        segment = t[start:end].strip()
        if not segment or (len(segment) < 15 and sym is None):
            continue
        sl = offset_to_line(start)
        el = offset_to_line(end - 1) if end <= len(t) else offset_to_line(len(t) - 1)
        chunks.append(
            CodeChunk(
                text=segment,
                language=lang,
                symbol_name=sym,
                start_line=sl + 1,
                end_line=el + 1,
            )
        )

    if not chunks:
        # Fallback: single chunk or simple_chunk
        for i, s in enumerate(simple_chunk(t, max_chars=1600, overlap=150)):
            chunks.append(
                CodeChunk(text=s, language=lang, symbol_name=None, start_line=None, end_line=None)
            )
    return chunks


def is_code_material(material_type: str, path: str) -> bool:
    if (material_type or "").lower() == "code":
        return True
    ext = os.path.splitext(path or "")[1].lower()
    return ext in _EXT_TO_LANG
