import { useEffect, useRef, useState } from 'react'
import { Button } from './Button.jsx'

/**
 * A button that requires two clicks: the first arms it (label swaps to the
 * confirm text), the second — within `armedForMs` — actually fires
 * `onConfirm`. Avoids native `confirm()` dialogs while still preventing
 * accidental destructive clicks.
 */
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = 'Confirm?',
  armedForMs = 2500,
  variant,
  ...buttonProps
}) {
  const [armed, setArmed] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  function handleClick(event) {
    event.stopPropagation()
    if (!armed) {
      setArmed(true)
      timerRef.current = setTimeout(() => setArmed(false), armedForMs)
      return
    }
    clearTimeout(timerRef.current)
    setArmed(false)
    onConfirm()
  }

  return (
    <Button type="button" {...buttonProps} onClick={handleClick} variant={armed ? 'danger' : variant}>
      {armed ? confirmLabel : children}
    </Button>
  )
}
