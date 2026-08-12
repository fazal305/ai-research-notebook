import { PanelSection } from '../layout/PanelSection.jsx'
import { EmptyState } from '../common/EmptyState.jsx'
import { TextStatisticsPanel } from './TextStatisticsPanel.jsx'
import { SummaryPanel } from './SummaryPanel.jsx'
import { SentimentPanel } from './SentimentPanel.jsx'
import { KeyConceptsPanel } from './KeyConceptsPanel.jsx'
import { useResearch } from '../../hooks/useResearch.js'

export function AIAnalysisPanel() {
  const { selectedDocument } = useResearch()

  if (!selectedDocument) {
    return (
      <PanelSection title="AI Analysis">
        <EmptyState title="No document selected" description="Select a document to enable AI analysis." />
      </PanelSection>
    )
  }

  const documentId = selectedDocument.id
  const documentTitle = selectedDocument.title

  return (
    <PanelSection title="AI Analysis">
      <TextStatisticsPanel text={selectedDocument.content} />
      {/* Remounted per document so a stale result/worker request from a
          previously selected document can't bleed into the new one. */}
      <SummaryPanel
        key={`summary-${documentId}`}
        text={selectedDocument.content}
        documentId={documentId}
        documentTitle={documentTitle}
      />
      <KeyConceptsPanel
        key={`concepts-${documentId}`}
        text={selectedDocument.content}
        documentId={documentId}
        documentTitle={documentTitle}
      />
      <SentimentPanel
        key={`sentiment-${documentId}`}
        text={selectedDocument.content}
        documentId={documentId}
        documentTitle={documentTitle}
      />
    </PanelSection>
  )
}
