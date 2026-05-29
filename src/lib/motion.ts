export const springSnappy = { type: 'spring' as const, stiffness: 520, damping: 36 }
export const springSoft = { type: 'spring' as const, stiffness: 320, damping: 32 }
export const springGentle = { type: 'spring' as const, stiffness: 260, damping: 28 }

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
}

export const fadeSlideUp = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const },
}

export const fadeSlideRight = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 8 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: springSoft,
}

export const staggerContainer = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
}

export const staggerItem = {
  initial: { opacity: 0, x: -6 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
}
