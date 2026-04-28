import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function CountdownOverlay({ active, onComplete }) {
  const [count, setCount] = useState(3)

  useEffect(() => {
    if (!active) return
    setCount(3)
    let n = 3
    const id = setInterval(() => {
      n -= 1
      if (n <= 0) {
        clearInterval(id)
        setCount(0)
        setTimeout(() => onComplete?.(), 600)
      } else {
        setCount(n)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [active, onComplete])

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="countdown-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(239,68,68,0.35) 0%, rgba(20,5,5,0.92) 60%, rgba(0,0,0,0.96) 100%)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div className="text-center select-none">
            <div className="text-accent-red text-xs uppercase tracking-[0.6em] font-semibold mb-4 glow-red">
              Crisis Simulation Starting In
            </div>
            <div className="relative h-[180px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="font-mono font-black text-accent-red glow-red"
                  style={{ fontSize: '160px', lineHeight: 1 }}
                >
                  {count > 0 ? count : 'GO'}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-2 text-text-secondary text-[11px] uppercase tracking-[0.4em] font-mono">
              All systems engaging · stand by
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
