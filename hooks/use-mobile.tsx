import { useState, useEffect } from 'react'

/**
 * Hook générique pour écouter une media query CSS.
 * @param query La query à écouter, ex. '(max-width: 768px)'
 * @returns true si la query matche
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)

    mediaQueryList.addEventListener('change', handler)
    // initialise
    setMatches(mediaQueryList.matches)

    return () => mediaQueryList.removeEventListener('change', handler)
  }, [query])

  return matches
}

/**
 * Hook spécifique pour savoir si on est en mobile (écran < 768px).
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: 767px)`)
}
