import { useEffect, useRef } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'
import './Modal.css'

/** Generic dialog: Escape to close, backdrop click to close, focus moves in on open, Tab is trapped inside. */
export function Modal({ isOpen, onClose, title, children }) {
  const dialogRef = useRef(null)

  useFocusTrap(dialogRef, isOpen)

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    dialogRef.current?.focus()

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={dialogRef} tabIndex={-1}>
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
