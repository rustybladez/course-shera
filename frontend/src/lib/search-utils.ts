/**
 * Utility functions for formatting search results
 */

export function cleanMarkdown(text: string): string {
  return text
    .replace(/^#+\s+/gm, "") // Remove markdown headers
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold formatting
    .replace(/_(.*?)_/g, "$1") // Remove italic formatting
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Convert links to text
    .trim();
}

export function truncateExcerpt(text: string, maxLength: number = 400): string {
  const cleaned = cleanMarkdown(text);
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength).trimEnd() + "…";
}

export function highlightQuery(text: string, query: string): string {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

export function formatRelevance(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

export function getRelevanceColor(score: number): string {
  if (score >= 0.8) return "bg-green-100 text-green-700";
  if (score >= 0.6) return "bg-blue-100 text-blue-700";
  if (score >= 0.4) return "bg-yellow-100 text-yellow-700";
  return "bg-orange-100 text-orange-700";
}

export function getRelevanceLabel(score: number): string {
  if (score >= 0.8) return "Excellent";
  if (score >= 0.6) return "Good";
  if (score >= 0.4) return "Fair";
  return "Low";
}
