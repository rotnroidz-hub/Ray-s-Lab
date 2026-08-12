import { useEffect, type EffectCallback } from 'react'

/** Runs an effect exactly once on mount (StrictMode-safe alternative to `[]`). */
export function useEffectOnce(effect: EffectCallback) {
  useEffect(effect, []) // eslint-disable-line react-hooks/exhaustive-deps
}