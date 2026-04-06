/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion'
import type { PiggyState } from '../../types'

interface PiggyCharacterProps {
  state: PiggyState
  size?: number
  showMessage?: boolean
}

const STATE_CONFIG: Record<PiggyState, {
  message: string
  bodyColor: string
  cheekColor: string
  eyeExpression: 'happy' | 'normal' | 'worried' | 'crying' | 'wink'
  accentColor: string
}> = {
  full: {
    message: 'Uau! Seu bolso tá cheio! 🐷💚',
    bodyColor: '#f9a8d4',
    cheekColor: '#f472b6',
    eyeExpression: 'happy',
    accentColor: '#22c55e',
  },
  ok: {
    message: 'Tá indo bem! Segura o bolso!',
    bodyColor: '#f9a8d4',
    cheekColor: '#f472b6',
    eyeExpression: 'normal',
    accentColor: '#facc15',
  },
  low: {
    message: 'Ei! Tô ficando com fome... cuida aí 🐷',
    bodyColor: '#fca5a5',
    cheekColor: '#f87171',
    eyeExpression: 'worried',
    accentColor: '#f97316',
  },
  critical: {
    message: 'Socorro! Meu bolso tá VAZIO! 🐷😱',
    bodyColor: '#fecaca',
    cheekColor: '#ef4444',
    eyeExpression: 'crying',
    accentColor: '#ef4444',
  },
  wave: {
    message: 'Oi! Eu sou seu porquinho! 🐷👋',
    bodyColor: '#f9a8d4',
    cheekColor: '#f472b6',
    eyeExpression: 'wink',
    accentColor: '#a855f7',
  },
}

// Body animations per state
const bodyAnimations: Record<PiggyState, any> = {
  full: {
    y: [0, -14, 0, -8, 0],
    rotate: [0, -3, 0, 3, 0],
    transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
  },
  ok: {
    scaleX: [1, 1.04, 1, 0.97, 1],
    scaleY: [1, 0.97, 1, 1.04, 1],
    transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
  },
  low: {
    rotate: [-4, 4, -4],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },
  critical: {
    x: [-3, 3, -3, 3, -2, 2, 0],
    y: [0, 1, 0, 1, 0],
    transition: { duration: 0.4, repeat: Infinity, ease: 'easeInOut' },
  },
  wave: {
    y: [0, -6, 0],
    transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
  },
}

// Arm/wave animation (only for wave state)
const armAnimation: any = {
  rotate: [0, -30, 10, -30, 10, 0],
  transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
}

function Eyes({ expression }: { expression: PiggyCharacterProps['state'] extends 'full' ? 'happy' : string }) {
  if (expression === 'happy') {
    // Crescent/arc eyes (^‿^)
    return (
      <>
        <path d="M 28 38 Q 32 33 36 38" stroke="#7c2d12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 64 38 Q 68 33 72 38" stroke="#7c2d12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    )
  }
  if (expression === 'worried') {
    return (
      <>
        <ellipse cx="32" cy="38" rx="5" ry="5.5" fill="#7c2d12" />
        <ellipse cx="68" cy="38" rx="5" ry="5.5" fill="#7c2d12" />
        {/* Worried brows */}
        <line x1="26" y1="28" x2="38" y2="32" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="62" y1="32" x2="74" y2="28" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
      </>
    )
  }
  if (expression === 'crying') {
    return (
      <>
        <path d="M 28 40 Q 32 35 36 40" stroke="#7c2d12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 64 40 Q 68 35 72 40" stroke="#7c2d12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Tears */}
        <ellipse cx="29" cy="46" rx="2" ry="3.5" fill="#93c5fd" opacity="0.9" />
        <ellipse cx="71" cy="46" rx="2" ry="3.5" fill="#93c5fd" opacity="0.9" />
        {/* Sad brows */}
        <line x1="26" y1="28" x2="38" y2="32" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="62" y1="32" x2="74" y2="28" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
      </>
    )
  }
  if (expression === 'wink') {
    return (
      <>
        <ellipse cx="32" cy="38" rx="5" ry="5.5" fill="#7c2d12" />
        {/* Wink eye */}
        <path d="M 63 38 Q 68 33 73 38" stroke="#7c2d12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    )
  }
  // normal
  return (
    <>
      <ellipse cx="32" cy="38" rx="5" ry="5.5" fill="#7c2d12" />
      <ellipse cx="68" cy="38" rx="5" ry="5.5" fill="#7c2d12" />
      <ellipse cx="30.5" cy="36.5" rx="1.5" ry="1.5" fill="white" />
      <ellipse cx="66.5" cy="36.5" rx="1.5" ry="1.5" fill="white" />
    </>
  )
}

export function PiggyCharacter({ state, size = 120, showMessage = false }: PiggyCharacterProps) {
  const cfg = STATE_CONFIG[state]
  const anim = bodyAnimations[state]

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={anim}
        style={{ display: 'inline-block', originX: '50%', originY: '80%' }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shadow */}
          <ellipse cx="50" cy="115" rx="28" ry="5" fill="rgba(0,0,0,0.10)" />

          {/* Body */}
          <ellipse cx="50" cy="75" rx="36" ry="32" fill={cfg.bodyColor} />

          {/* Belly highlight */}
          <ellipse cx="50" cy="80" rx="20" ry="18" fill="white" opacity="0.25" />

          {/* Left ear */}
          <ellipse cx="20" cy="50" rx="11" ry="14" fill={cfg.bodyColor} transform="rotate(-15 20 50)" />
          <ellipse cx="20" cy="51" rx="6" ry="9" fill={cfg.cheekColor} opacity="0.5" transform="rotate(-15 20 51)" />

          {/* Right ear */}
          <ellipse cx="80" cy="50" rx="11" ry="14" fill={cfg.bodyColor} transform="rotate(15 80 50)" />
          <ellipse cx="80" cy="51" rx="6" ry="9" fill={cfg.cheekColor} opacity="0.5" transform="rotate(15 80 51)" />

          {/* Head */}
          <circle cx="50" cy="48" r="30" fill={cfg.bodyColor} />

          {/* Cheeks */}
          <ellipse cx="24" cy="56" rx="9" ry="7" fill={cfg.cheekColor} opacity="0.45" />
          <ellipse cx="76" cy="56" rx="9" ry="7" fill={cfg.cheekColor} opacity="0.45" />

          {/* Eyes */}
          <Eyes expression={cfg.eyeExpression as Parameters<typeof Eyes>[0]['expression']} />

          {/* Snout */}
          <ellipse cx="50" cy="62" rx="14" ry="10" fill={cfg.cheekColor} opacity="0.55" />
          <circle cx="45" cy="63" r="3.5" fill="#be185d" opacity="0.5" />
          <circle cx="55" cy="63" r="3.5" fill="#be185d" opacity="0.5" />

          {/* Mouth */}
          {state === 'critical' || state === 'low' ? (
            <path d="M 42 72 Q 50 68 58 72" stroke="#be185d" strokeWidth="2" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M 42 70 Q 50 76 58 70" stroke="#be185d" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}

          {/* Left leg */}
          <rect x="29" y="100" width="14" height="15" rx="7" fill={cfg.bodyColor} />
          {/* Right leg */}
          <rect x="57" y="100" width="14" height="15" rx="7" fill={cfg.bodyColor} />

          {/* Waving arm (wave state only) */}
          {state === 'wave' && (
            <motion.g animate={armAnimation} style={{ originX: '82px', originY: '75px' }}>
              <ellipse cx="88" cy="70" rx="9" ry="6" fill={cfg.bodyColor} transform="rotate(-30 88 70)" />
            </motion.g>
          )}

          {/* Coin slot on top */}
          <rect x="44" y="18" width="12" height="4" rx="2" fill="#78350f" opacity="0.6" />

          {/* Tail (right side) */}
          <path d="M 86 80 Q 96 76 92 68 Q 88 60 95 56" stroke={cfg.cheekColor} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
        </svg>
      </motion.div>

      {showMessage && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm font-bold px-4 py-2 rounded-full"
          style={{ color: cfg.accentColor, backgroundColor: cfg.accentColor + '18' }}
        >
          {cfg.message}
        </motion.div>
      )}
    </div>
  )
}
