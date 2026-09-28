/**
 * Deterministic, dependency-free text statistics. These are plain
 * algorithms, not AI — they run instantly on the main thread for
 * document-metadata display. The same functions are reused inside
 * textWorker.js for large-document processing, and by the "Text
 * Statistics" AI-panel tool, so the numbers are always computed one way.
 */

export function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function countCharacters(text) {
  return text.length;
}

export function countSentences(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const matches = trimmed.match(/[^.!?]+[.!?]+(\s|$)/g);
  return matches ? matches.length : 1;
}

export function countParagraphs(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
}

export function estimateReadingMinutes(text, wordsPerMinute = 200) {
  const words = countWords(text);
  if (words === 0) return 0;
  return Math.max(1, Math.round(words / wordsPerMinute));
}

export function textStats(text) {
  return {
    characters: countCharacters(text),
    words: countWords(text),
    sentences: countSentences(text),
    paragraphs: countParagraphs(text),
    readingMinutes: estimateReadingMinutes(text),
  };
}
