import { useEffect, useState } from 'react';

/**
 * Returns a debounced version of the value, updating only after `delay` ms of silence.
 *
 * Note: because React bails out of a state update whose new value is === the current one,
 * a `useEffect` keyed on this hook's return value will NOT re-fire if the value settles back
 * to something textually identical to what it was before (e.g. clearing a search box and
 * retyping the same query). Callers that must react to every settle — not just every distinct
 * value — should debounce with their own `setTimeout` tied to the raw value instead of relying
 * on this hook's output for their effect's dependency array. See `usePersonSearch`'s search
 * effect for an example.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
