import { useEffect } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Keeps Tab/Shift+Tab cycling within the container while `isActive` — standard modal focus-trap behavior. */
export function useFocusTrap(containerRef, isActive) {
  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event) {
      if (event.key !== 'Tab') return
      const container = containerRef.current
      if (!container) return

      const focusable = [...container.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
        (el) => el.offsetParent !== null,
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, containerRef])
}
