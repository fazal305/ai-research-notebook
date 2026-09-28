import { Spinner } from "../common/Spinner.jsx";
import { useTextStats } from "../../hooks/useTextStats.js";
import "./TextStatisticsPanel.css";

/**
 * "Text Statistics" needs no AI model — these are plain counts — but for a
 * large document, computing them can take long enough to be worth running
 * off the main thread. See workers/textWorker.js.
 */
export function TextStatisticsPanel({ text }) {
  const { stats, status, error } = useTextStats(text);

  return (
    <section className="text-stats">
      <h3 className="text-stats__heading">Text Statistics</h3>

      {status === "processing" || status === "idle" ? (
        <Spinner label="Analyzing…" />
      ) : status === "error" ? (
        <p className="text-stats__error">{error}</p>
      ) : (
        <dl className="text-stats__grid">
          <div className="text-stats__item">
            <dt>Characters</dt>
            <dd>{stats.characters.toLocaleString()}</dd>
          </div>
          <div className="text-stats__item">
            <dt>Words</dt>
            <dd>{stats.words.toLocaleString()}</dd>
          </div>
          <div className="text-stats__item">
            <dt>Sentences</dt>
            <dd>{stats.sentences.toLocaleString()}</dd>
          </div>
          <div className="text-stats__item">
            <dt>Paragraphs</dt>
            <dd>{stats.paragraphs.toLocaleString()}</dd>
          </div>
          <div className="text-stats__item text-stats__item--wide">
            <dt>Estimated reading time</dt>
            <dd>{stats.readingMinutes} min</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
