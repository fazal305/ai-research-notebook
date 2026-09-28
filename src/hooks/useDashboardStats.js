import { useEffect, useState } from "react";
import * as notesRepository from "../services/storage/notesRepository.js";
import * as historyRepository from "../services/storage/historyRepository.js";
import { countWords } from "../utils/textUtils.js";

/**
 * Aggregates real dashboard numbers from IndexedDB. Documents come from
 * the caller (ResearchContext already has them loaded — no reason to
 * refetch); notes and history are fetched fresh here since the dashboard
 * needs the whole collection, not any single document's slice of it.
 *
 * Every number here is derived from what's actually stored — nothing is
 * estimated or hardcoded.
 */
export function useDashboardStats(documents) {
  const [notes, setNotes] = useState([]);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    Promise.all([notesRepository.listNotes(), historyRepository.listHistory()])
      .then(([notesList, historyList]) => {
        if (cancelled) return;
        setNotes(notesList);
        setHistory(historyList);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalWords = documents.reduce(
    (sum, doc) => sum + countWords(doc.content),
    0,
  );

  const recentDocuments = [...documents]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);
  const recentAnalyses = [...history]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 5);

  const topicCounts = new Map();
  for (const entry of history) {
    if (
      entry.operation !== "key-concepts" ||
      entry.status !== "complete" ||
      !entry.response
    )
      continue;
    for (const topic of entry.response
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }
  }
  const mostUsedTopics = [...topicCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([term, count]) => ({ term, count }));

  return {
    status,
    documentCount: documents.length,
    noteCount: notes.length,
    aiAnalysisCount: history.length,
    totalWords,
    recentDocuments,
    recentAnalyses,
    mostUsedTopics,
  };
}
