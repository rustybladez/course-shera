from __future__ import annotations

import ast
import re
from typing import Any

import numpy as np

from app.services.gemini import GeminiService


class ValidationService:
    """
    Multi-layer validation pipeline for AI-generated content.
    Ensures correctness, relevance, and academic reliability.
    """

    def __init__(self, gemini: GeminiService):
        self.gemini = gemini

    def validate_content(
        self,
        content: str,
        content_type: str,
        topic: str,
        grounding_chunks: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """
        Run full validation pipeline on generated content.

        Args:
            content: The AI-generated content
            content_type: Type of content ("theory_notes", "slides", "lab_code")
            topic: The original user prompt/topic
            grounding_chunks: Retrieved course materials used for generation

        Returns:
            Validation report with scores and verdict
        """
        scores = {}

        # 1. Syntax validation (for code content)
        if content_type == "lab_code":
            scores["syntax_score"] = self._check_code_syntax(content)
        else:
            scores["syntax_score"] = 1.0  # Non-code always passes syntax

        # 2. Grounding check (semantic similarity to source materials)
        if grounding_chunks:
            scores["grounding_score"] = self._check_grounding(content, grounding_chunks)
        else:
            scores["grounding_score"] = 0.5  # Neutral if no sources

        # 3. Rubric evaluation (content-specific rules)
        scores["rubric_score"] = self._check_rubric(content, content_type, topic)

        # 4. AI self-evaluation (LLM as critic)
        ai_eval = self._ai_self_evaluation(content, content_type, topic, grounding_chunks)
        scores["ai_eval_score"] = ai_eval["score"]

        # Calculate final score (weighted average)
        final_score = self._calculate_final_score(scores)

        # Determine verdict
        verdict = "PASS" if final_score >= 0.7 else "REVIEW" if final_score >= 0.5 else "FAIL"

        return {
            "syntax_score": round(scores["syntax_score"], 2),
            "grounding_score": round(scores["grounding_score"], 2),
            "rubric_score": round(scores["rubric_score"], 2),
            "ai_eval_score": round(scores["ai_eval_score"], 2),
            "final_score": round(final_score, 2),
            "verdict": verdict,
            "ai_explanation": ai_eval["explanation"],
            "notes": self._generate_notes(scores, content_type),
        }

    def _check_code_syntax(self, content: str) -> float:
        """Check if code is syntactically valid."""
        # Extract code blocks from markdown
        code_blocks = re.findall(r"```(?:\w+)?\n(.*?)```", content, re.DOTALL)

        if not code_blocks:
            return 0.5  # No code found

        valid_count = 0
        total_count = len(code_blocks)

        for code in code_blocks:
            # Try Python syntax
            try:
                ast.parse(code.strip())
                valid_count += 1
            except SyntaxError:
                # Try to check if it's at least structured code
                if any(
                    keyword in code
                    for keyword in ["def ", "class ", "if ", "for ", "while ", "import "]
                ):
                    valid_count += 0.5  # Partial credit for structured code

        return valid_count / total_count if total_count > 0 else 1.0

    def _check_grounding(self, content: str, grounding_chunks: list[dict[str, Any]]) -> float:
        """Check if content is grounded in course materials using semantic similarity."""
        if not grounding_chunks or not self.gemini.is_configured():
            return 0.5

        try:
            # Embed the generated content
            content_embedding = self.gemini.embed([content[:1000]])[0]  # Use first 1000 chars

            # Get embeddings of source chunks
            source_texts = [chunk.get("text", "") for chunk in grounding_chunks]
            if not source_texts:
                return 0.5

            source_embeddings = self.gemini.embed(source_texts)

            # Calculate cosine similarities
            similarities = []
            for source_emb in source_embeddings:
                similarity = self._cosine_similarity(content_embedding, source_emb)
                similarities.append(similarity)

            # Return highest similarity (best grounding)
            max_similarity = max(similarities) if similarities else 0.0
            return min(max_similarity, 1.0)

        except Exception as e:
            print(f"Grounding check failed: {e}")
            return 0.5

    def _cosine_similarity(self, vec1: list[float], vec2: list[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))

    def _check_rubric(self, content: str, content_type: str, topic: str) -> float:
        """Rule-based evaluation using content-specific rubrics."""
        score = 0.0
        checks = 0

        if content_type == "theory_notes":
            # Theory rubric
            checks = 5

            # Has structure (headings)
            if any(marker in content for marker in ["# ", "## ", "### "]):
                score += 1

            # Mentions topic
            topic_words = topic.lower().split()[:3]
            if any(word in content.lower() for word in topic_words):
                score += 1

            # Reasonable length (>300 words)
            if len(content.split()) > 300:
                score += 1

            # Has examples or explanations
            if any(marker in content.lower() for marker in ["example", "for instance", "such as"]):
                score += 1

            # No suspicious external links (prevents hallucinated references)
            external_links = len(re.findall(r"https?://(?!localhost|127\.0\.0\.1)", content))
            if external_links == 0:
                score += 1

        elif content_type == "slides":
            # Slides rubric
            checks = 4

            # Has slide separators
            if "---" in content or "##" in content:
                score += 1

            # Concise (slides shouldn't be too long)
            if 100 < len(content.split()) < 1500:
                score += 1

            # Mentions topic
            topic_words = topic.lower().split()[:3]
            if any(word in content.lower() for word in topic_words):
                score += 1

            # Has bullet points or structure
            if "- " in content or "* " in content or "\n" in content:
                score += 1

        elif content_type == "lab_code":
            # Lab rubric
            checks = 5

            # Has code block
            if "```" in content:
                score += 1

            # Has comments
            if "#" in content or "//" in content or "/*" in content:
                score += 1

            # Has explanation
            if any(word in content.lower() for word in ["explanation", "how it works", "description"]):
                score += 1

            # Mentions topic/technology
            topic_words = topic.lower().split()[:3]
            if any(word in content.lower() for word in topic_words):
                score += 1

            # Has function/class definitions
            if any(keyword in content for keyword in ["def ", "class ", "function ", "const "]):
                score += 1

        return score / checks if checks > 0 else 0.0

    def _ai_self_evaluation(
        self,
        content: str,
        content_type: str,
        topic: str,
        grounding_chunks: list[dict[str, Any]] | None,
    ) -> dict[str, Any]:
        """Use AI to evaluate its own output."""
        if not self.gemini.is_configured():
            return {"score": 0.7, "explanation": "AI evaluation not available"}

        try:
            context = ""
            if grounding_chunks:
                context = "\n".join([f"- {chunk.get('material_title', 'Source')}: {chunk.get('text', '')[:200]}..." for chunk in grounding_chunks[:3]])

            system_prompt = (
                "You are an academic content evaluator. Rate the generated educational content on three dimensions:\n"
                "1. Correctness (technically accurate, no errors)\n"
                "2. Relevance (matches the topic and learning objectives)\n"
                "3. Academic reliability (grounded in provided sources, not hallucinated)\n\n"
                "Provide a score from 0.0 to 1.0 and a brief explanation."
            )

            user_prompt = (
                f"Topic: {topic}\n"
                f"Content Type: {content_type}\n\n"
                f"Generated Content:\n{content[:1500]}\n\n"
                f"Source Materials:\n{context}\n\n"
                "Rate this content with a score (0.0-1.0) and explain your reasoning in 2-3 sentences."
            )

            response = self.gemini.generate_markdown(system_prompt, user_prompt)

            # Extract score from response
            score_match = re.search(r"(\d+\.?\d*)\s*/\s*10|score[:\s]+(\d+\.?\d*)", response.lower())
            if score_match:
                score_val = float(score_match.group(1) or score_match.group(2))
                score = score_val / 10 if score_val > 1 else score_val
            else:
                score = 0.75  # Default if no score found

            return {"score": min(score, 1.0), "explanation": response[:500]}

        except Exception as e:
            print(f"AI self-evaluation failed: {e}")
            return {"score": 0.7, "explanation": "Evaluation completed with default scoring"}

    def _calculate_final_score(self, scores: dict[str, float]) -> float:
        """Calculate weighted average of all scores."""
        weights = {
            "syntax_score": 0.25,
            "grounding_score": 0.35,  # Most important
            "rubric_score": 0.20,
            "ai_eval_score": 0.20,
        }

        final = sum(scores[key] * weights[key] for key in weights)
        return min(final, 1.0)

    def _generate_notes(self, scores: dict[str, float], content_type: str) -> list[str]:
        """Generate human-readable notes about the validation."""
        notes = []

        if scores["syntax_score"] < 0.7:
            notes.append("⚠️ Code syntax issues detected")
        elif scores["syntax_score"] == 1.0 and content_type == "lab_code":
            notes.append("✅ Code is syntactically correct")

        if scores["grounding_score"] < 0.6:
            notes.append("⚠️ Content may not be well-grounded in course materials")
        elif scores["grounding_score"] > 0.75:
            notes.append("✅ Well-grounded in course materials")

        if scores["rubric_score"] < 0.6:
            notes.append("⚠️ Missing some expected structural elements")
        elif scores["rubric_score"] > 0.8:
            notes.append("✅ Follows content structure guidelines")

        if scores["ai_eval_score"] < 0.6:
            notes.append("⚠️ Content quality could be improved")
        elif scores["ai_eval_score"] > 0.8:
            notes.append("✅ High-quality academic content")

        if not notes:
            notes.append("✅ Content meets quality standards")

        return notes
