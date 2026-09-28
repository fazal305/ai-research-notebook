import { useCallback, useRef, useState } from "react";

// If nothing happens — no progress event, no result, no error — for this
// long, treat the operation as stalled rather than spinning forever. Reset
// on every progress event, so a slow-but-alive model download or stream
// (both report progress repeatedly) isn't cut off.
const STALL_TIMEOUT_MS = 45000;

/**
 * Generic runner for a single AI operation: tracks status/progress/result/
 * error for whatever async call you hand it, including cancellation via an
 * AbortSignal passed to the operation. Components call `run` with a
 * function that calls into aiService — this hook doesn't know or care
 * which operation or provider is involved.
 */
export function useAI() {
  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'success' | 'error' | 'cancelled'
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  const run = useCallback(async (operation) => {
    requestIdRef.current += 1;
    const id = requestIdRef.current;
    const isCurrent = () => id === requestIdRef.current;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus("loading");
    setProgress(null);
    setError(null);
    setResult(null);

    let timeoutId;
    const armTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!isCurrent()) return;
        requestIdRef.current += 1; // invalidate so a late resolution is ignored
        controller.abort();
        setError(
          "This is taking longer than expected — it may have stalled. Try again.",
        );
        setStatus("error");
      }, STALL_TIMEOUT_MS);
    };
    armTimeout();

    try {
      const value = await operation({
        onProgress: (p) => {
          if (isCurrent()) {
            setProgress(p);
            armTimeout();
          }
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (isCurrent()) {
        setResult(value);
        setStatus("success");
      }
      return value;
    } catch (err) {
      clearTimeout(timeoutId);
      if (isCurrent()) {
        if (err.name === "AbortError") {
          setStatus("cancelled");
        } else {
          setError(err.message ?? String(err));
          setStatus("error");
        }
      }
      return undefined;
    }
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setStatus("idle");
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  return { status, progress, result, error, run, cancel, reset };
}
