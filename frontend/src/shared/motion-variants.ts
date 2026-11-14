import type { Transition, Variants } from "framer-motion"

const defaultTransition: Transition = {
  duration: 0.2,
  ease: "easeOut",
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: defaultTransition },
  exit: { opacity: 0, transition: defaultTransition },
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: defaultTransition },
  exit: { opacity: 0, y: 8, transition: defaultTransition },
}

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: defaultTransition },
  exit: { opacity: 0, y: -8, transition: defaultTransition },
}

export const collapse: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto", transition: defaultTransition },
  exit: { opacity: 0, height: 0, transition: defaultTransition },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
  exit: {},
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, transition: defaultTransition },
}

export const pageTransition: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, scale: 0.98, transition: defaultTransition },
}

export const reducedMotionVariants: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
  exit: { opacity: 1 },
}
