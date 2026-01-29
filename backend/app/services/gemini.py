from __future__ import annotations

from google import genai

from app.core.config import settings


class GeminiService:
    def __init__(self) -> None:
        if not settings.gemini_api_key:
            self._client = None
        else:
            self._client = genai.Client(api_key=settings.gemini_api_key)

    def is_configured(self) -> bool:
        return self._client is not None

    def embed(self, texts: list[str]) -> list[list[float]]:
        """
        Returns one embedding per input text.
        """
        if not self._client:
            raise RuntimeError("GEMINI_API_KEY is not configured")

        out: list[list[float]] = []
        for t in texts:
            res = self._client.models.embed_content(
                model=settings.gemini_embed_model,
                contents=t,
            )
            # google-genai returns a list-like embeddings field; normalize to python list[float]
            # docs show `result.embeddings`
            emb = res.embeddings[0].values if hasattr(res.embeddings[0], "values") else res.embeddings[0]
            out.append(list(emb))
        return out

    def generate_markdown(self, system: str, user: str) -> str:
        if not self._client:
            raise RuntimeError("GEMINI_API_KEY is not configured")

        res = self._client.models.generate_content(
            model=settings.gemini_text_model,
            contents=[
                {"role": "user", "parts": [{"text": f"{system}\n\n{user}"}]},
            ],
        )
        return (res.text or "").strip()

    def generate_image(self, prompt: str) -> str | None:
        """
        Generate a visual placeholder using Unsplash for educational content.
        Returns image URL from Unsplash based on the prompt keywords.
        """
        try:
            # Extract key words from prompt for better image search
            keywords = prompt.replace("Educational diagram for: ", "").replace("Educational diagram: ", "")
            # Clean and format keywords for Unsplash
            keywords = keywords.replace(" ", ",").lower()
            # Limit to first few keywords to avoid overly specific searches
            keywords = ",".join(keywords.split(",")[:3])
            
            # Use Unsplash Source API for random educational/tech images
            # This doesn't require an API key and provides high-quality images
            image_url = f"https://source.unsplash.com/1600x900/?{keywords},education,technology,abstract"
            
            return image_url
        except Exception as e:
            print(f"Image URL generation failed: {e}")
            # Fallback to a generic educational placeholder
            return "https://source.unsplash.com/1600x900/?education,technology,abstract"
