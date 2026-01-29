# Demo course note

## What this platform does

This is a small demo note so you can test:
- uploading & ingesting course materials
- semantic search over chunks
- AI-generated notes/code grounded in retrieved chunks
- chat interface

## Key concept: Retrieval-Augmented Generation (RAG)

RAG works by:
1. Splitting documents into chunks
2. Embedding each chunk into vectors
3. Retrieving the most similar chunks for a user query
4. Providing those chunks as context to the LLM to reduce hallucination

## Example

Query: "How does RAG reduce hallucination?"

Answer: It grounds the model in relevant excerpts retrieved from the course materials, so the response can cite sources.

