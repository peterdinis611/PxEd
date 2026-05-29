import { useEffect, useRef } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

export function AnimatedNumber({
  value,
  className,
  format = (n) => String(Math.round(n)),
}: {
  value: number
  className?: string
  format?: (n: number) => string
}) {
  const spring = useSpring(value, { stiffness: 400, damping: 30 })
  const display = useTransform(spring, (v) => format(v))
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  useEffect(() => {
    const unsub = display.on('change', (v) => {
      if (ref.current) ref.current.textContent = v
    })
    return unsub
  }, [display])

  return <motion.span ref={ref} className={className} />
}
