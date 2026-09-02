import { useState, useEffect } from 'react'
import { ShieldCheck, RefreshCw, Loader as Loader2 } from 'lucide-react'

interface CaptchaChallengeProps {
  onPass: () => void
}

const IMAGE_CATEGORIES = [
  { label: 'autobuses', emoji: '🚌', keyword: 'bus' },
  { label: 'coches', emoji: '🚗', keyword: 'car' },
  { label: 'bicicletas', emoji: '🚲', keyword: 'bicycle' },
  { label: 'aviones', emoji: '✈️', keyword: 'plane' },
  { label: 'trenes', emoji: '🚆', keyword: 'train' },
  { label: 'barcos', emoji: '⛵', keyword: 'boat' },
]

const ALL_EMOJIS = [
  '🚌', '🚗', '🚲', '✈️', '🚆', '⛵', '🌲', '🏔️', '🏠', '🌊', '🌅', '🎒', '🗺️', '🧭', '⛺', '🚶', '📷', '☕', '🍇', '🧀'
]

export function CaptchaChallenge({ onPass }: CaptchaChallengeProps) {
  const [targetCategory, setTargetCategory] = useState(IMAGE_CATEGORIES[0])
  const [grid, setGrid] = useState<string[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState(false)

  const generateChallenge = () => {
    const cat = IMAGE_CATEGORIES[Math.floor(Math.random() * IMAGE_CATEGORIES.length)]
    setTargetCategory(cat)

    const targetEmojis = ALL_EMOJIS.filter(e =>
      e === cat.emoji ||
      (cat.label === 'autobuses' && e === '🚌') ||
      (cat.label === 'coches' && e === '🚗') ||
      (cat.label === 'bicicletas' && e === '🚲') ||
      (cat.label === 'aviones' && e === '✈️') ||
      (cat.label === 'trenes' && e === '🚆') ||
      (cat.label === 'barcos' && e === '⛵')
    )

    const distractorEmojis = ALL_EMOJIS.filter(e => !targetEmojis.includes(e))

    const tiles: string[] = []
    const numTargets = 3
    const numDistractors = 9 - numTargets

    for (let i = 0; i < numTargets; i++) {
      tiles.push(targetEmojis[Math.floor(Math.random() * targetEmojis.length)])
    }
    for (let i = 0; i < numDistractors; i++) {
      tiles.push(distractorEmojis[Math.floor(Math.random() * distractorEmojis.length)])
    }

    // Shuffle
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]]
    }

    setGrid(tiles)
    setSelected([])
    setVerified(false)
    setError(false)
  }

  useEffect(() => {
    generateChallenge()
  }, [])

  const toggleTile = (index: number) => {
    if (verified) return
    setSelected(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
    setError(false)
  }

  const verify = () => {
    const correctIndices: number[] = []
    grid.forEach((emoji, i) => {
      if (emoji === targetCategory.emoji) correctIndices.push(i)
    })

    const isCorrect =
      correctIndices.length === selected.length &&
      correctIndices.every(i => selected.includes(i))

    if (isCorrect) {
      setVerified(true)
      onPass()
    } else {
      setError(true)
      setSelected([])
      setTimeout(() => generateChallenge(), 800)
    }
  }

  if (verified) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-forest-50 border border-forest-200 text-sm text-forest-700">
        <ShieldCheck className="w-5 h-5 text-forest-600" />
        <span>Verificación completada</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-sand-200 overflow-hidden">
      <div className="bg-sand-50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sand-600" />
          <span className="text-xs font-medium text-sand-700">Verificación de seguridad</span>
        </div>
        <button
          type="button"
          onClick={generateChallenge}
          className="text-sand-400 hover:text-sand-600"
          title="Renovar"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3">
        <p className="text-xs text-sand-600 mb-2">
          Selecciona todos los <strong className="text-sand-800">{targetCategory.label}</strong> {targetCategory.emoji}
        </p>

        <div className="grid grid-cols-3 gap-1.5">
          {grid.map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleTile(i)}
              className={`aspect-square rounded-lg flex items-center justify-center text-2xl transition-all ${
                selected.includes(i)
                  ? 'bg-forest-100 ring-2 ring-forest-500'
                  : 'bg-sand-50 hover:bg-sand-100 ring-1 ring-sand-200'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-600 mt-2">Selección incorrecta. Inténtalo de nuevo.</p>
        )}

        <button
          type="button"
          onClick={verify}
          disabled={selected.length === 0}
          className="w-full mt-2 px-3 py-2 rounded-lg bg-forest-600 text-white text-xs font-medium hover:bg-forest-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Verificar
        </button>
      </div>
    </div>
  )
}
