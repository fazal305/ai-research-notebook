import { Modal } from "../common/Modal.jsx";
import { HistoryPanel } from "./HistoryPanel.jsx";

export function HistoryModal({ isOpen, onClose, onOpenDocument }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI History">
      <HistoryPanel onOpenDocument={onOpenDocument} />
    </Modal>
  );
}
