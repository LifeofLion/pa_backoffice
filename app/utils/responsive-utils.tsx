"use client"

import type React from "react"

import { useState, useEffect } from "react"

// Hook personnalisé pour détecter la taille de l'écran
export function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
    isMobile: typeof window !== "undefined" ? window.innerWidth < 640 : false,
    isTablet: typeof window !== "undefined" ? window.innerWidth >= 640 && window.innerWidth < 1024 : false,
    isDesktop: typeof window !== "undefined" ? window.innerWidth >= 1024 : false,
  })

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 640,
        isTablet: window.innerWidth >= 640 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024,
      })
    }

    // S'assurer que la taille initiale est correcte
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return screenSize
}

// Composant pour afficher différents contenus selon la taille de l'écran
export function ResponsiveContent({
  mobile,
  tablet,
  desktop,
}: {
  mobile: React.ReactNode
  tablet?: React.ReactNode
  desktop?: React.ReactNode
}) {
  const { isMobile, isTablet, isDesktop } = useScreenSize()

  if (isMobile) return <>{mobile}</>
  if (isTablet && tablet) return <>{tablet}</>
  if (isDesktop && desktop) return <>{desktop}</>

  // Fallback au contenu tablette ou mobile si le contenu desktop n'est pas fourni
  if (isDesktop && !desktop && tablet) return <>{tablet}</>
  return <>{mobile}</>
}

// Composant pour masquer/afficher du contenu selon la taille de l'écran
export function MobileOnly({ children }: { children: React.ReactNode }) {
  const { isMobile } = useScreenSize()
  if (!isMobile) return null
  return <>{children}</>
}

export function TabletUp({ children }: { children: React.ReactNode }) {
  const { isMobile } = useScreenSize()
  if (isMobile) return null
  return <>{children}</>
}

export function DesktopOnly({ children }: { children: React.ReactNode }) {
  const { isDesktop } = useScreenSize()
  if (!isDesktop) return null
  return <>{children}</>
}

