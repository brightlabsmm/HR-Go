import { useReducedMotion } from "framer-motion"

import {
  collapse,
  fadeIn,
  pageTransition,
  reducedMotionVariants,
  scaleIn,
  slideDown,
  slideUp,
  staggerContainer,
  staggerItem,
} from "@/shared/motion-variants"

export function useMotionVariants() {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return {
      collapse: reducedMotionVariants,
      fadeIn: reducedMotionVariants,
      pageTransition: reducedMotionVariants,
      scaleIn: reducedMotionVariants,
      slideDown: reducedMotionVariants,
      slideUp: reducedMotionVariants,
      staggerContainer: reducedMotionVariants,
      staggerItem: reducedMotionVariants,
    }
  }

  return {
    collapse,
    fadeIn,
    pageTransition,
    scaleIn,
    slideDown,
    slideUp,
    staggerContainer,
    staggerItem,
  }
}
