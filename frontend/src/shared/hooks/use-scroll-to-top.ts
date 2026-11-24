import { useEffect, type RefObject } from "react"
import { useLocation } from "react-router"

export function useScrollToTop(
  containerRef?: RefObject<HTMLElement | null>
) {
  const { pathname } = useLocation()

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }
  }, [])

  useEffect(() => {
    containerRef?.current?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [pathname, containerRef])
}
