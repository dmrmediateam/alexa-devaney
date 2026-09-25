import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { usd } from './math'

export type KnobZone = { from: number; to: number; tone: 'critical' | 'positive' | 'caution'; label: string }

const SIZE = 440
const C = SIZE / 2
const START = 135 // degrees, 0 = 3 o'clock, clockwise
const SWEEP = 270
const R_TRACK = 166 // value track
const R_TICK_IN = 180
const R_TICK_OUT = 188
const R_TICK_MAJOR = 194
const R_LABEL = 208
const R_PUCK = 122
const DMR_BLUE = '#3c88c0'

/**
 * DMR budget dial. A black "hi-fi" puck that physically rotates (knurled rim + blue
 * indicator), an outer dollar scale, a DMR-blue value arc, a labelled recommended band
 * and a TODAY flag. Drag anywhere, or use ←/→ (±$50), PgUp/PgDn (±$250), Home/End.
 */
export function SpendKnob({
  value,
  min,
  max,
  current,
  zones,
  onChange,
}: {
  value: number
  min: number
  max: number
  current: number
  zones: KnobZone[]
  onChange: (v: number) => void
}) {
  const uid = useId().replace(/:/g, '')
  const ref = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState(false)
  const t = (v: number) => Math.min(1, Math.max(0, (v - min) / (max - min)))
  const clampRound = (v: number) => Math.min(max, Math.max(min, Math.round(v / 50) * 50))
  const angle = START + t(value) * SWEEP

  const fromPointer = (e: PointerEvent<SVGSVGElement>) => {
    const box = ref.current!.getBoundingClientRect()
    const x = ((e.clientX - box.left) / box.width) * SIZE - C
    const y = ((e.clientY - box.top) / box.height) * SIZE - C
    const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
    let rel = (deg - START + 360) % 360
    if (rel > SWEEP) rel = rel > SWEEP + (360 - SWEEP) / 2 ? 0 : SWEEP
    onChange(clampRound(min + (rel / SWEEP) * (max - min)))
  }

  const onKey = (e: KeyboardEvent) => {
    const steps: Record<string, number> = { ArrowRight: 50, ArrowUp: 50, ArrowLeft: -50, ArrowDown: -50, PageUp: 250, PageDown: -250 }
    if (e.key in steps) onChange(clampRound(value + steps[e.key]))
    else if (e.key === 'Home') onChange(min)
    else if (e.key === 'End') onChange(max)
    else return
    e.preventDefault()
  }

  // Dollar scale: major ticks on a "nice" step, 4 minor ticks between.
  const major = niceStep((max - min) / 5)
  const majors: number[] = []
  for (let v = Math.ceil(min / major) * major; v <= max + 0.01; v += major) majors.push(v)
  const minors: number[] = []
  for (let v = Math.ceil(min / (major / 5)) * (major / 5); v <= max + 0.01; v += major / 5) minors.push(v)

  const handle = pt(t(value), R_TRACK)
  const today = t(current)
  const flagTip = pt(today, R_TICK_IN - 2)
  const flagBase = pt(today, R_TICK_OUT + 12)
  const rec = zones.find((z) => z.tone === 'positive')

  return (
    <div className={`dmr-knob2${dragging ? ' is-dragging' : ''}`}>
      <svg
        ref={ref}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="slider"
        tabIndex={0}
        aria-label="Monthly ad spend"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
        aria-valuetext={`${usd(value)} per month`}
        onKeyDown={onKey}
        onPointerDown={(e) => {
          setDragging(true)
          e.currentTarget.setPointerCapture(e.pointerId)
          fromPointer(e)
        }}
        onPointerMove={(e) => dragging && fromPointer(e)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        <defs>
          <radialGradient id={`${uid}-puck`} cx="38%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#3a3a3a" />
            <stop offset="55%" stopColor="#161616" />
            <stop offset="100%" stopColor="#050505" />
          </radialGradient>
          <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5a5a5a" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </linearGradient>
          <filter id={`${uid}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000" floodOpacity="0.28" />
          </filter>
          <path id={`${uid}-recpath`} d={rec ? arc(t(rec.from), t(rec.to), R_TRACK - 22) : ''} />
        </defs>

        {/* Dollar scale */}
        {minors.map((v) => {
          const a = pt(t(v), R_TICK_IN)
          const b = pt(t(v), R_TICK_OUT)
          return <line key={`m${v}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="dmr-k-tick" />
        })}
        {majors.map((v) => {
          const a = pt(t(v), R_TICK_IN)
          const b = pt(t(v), R_TICK_MAJOR)
          const l = pt(t(v), R_LABEL)
          return (
            <g key={`M${v}`}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="dmr-k-tick is-major" />
              <text x={l.x} y={l.y + 4} textAnchor="middle" className="dmr-k-scale">{shortUsd(v)}</text>
            </g>
          )
        })}

        {/* Track, guideline bands, value arc */}
        <path d={arc(0, 1, R_TRACK)} className="dmr-k-track" />
        {zones.map((z, i) => (
          <path key={i} d={arc(t(z.from), t(z.to), R_TRACK)} className={`dmr-k-zone is-${z.tone}`} />
        ))}
        <path d={arc(0, t(value), R_TRACK)} className="dmr-k-value" stroke={DMR_BLUE} />
        {rec && t(rec.to) - t(rec.from) > 0.17 && (
          <text className="dmr-k-reclabel" dy="4">
            <textPath href={`#${uid}-recpath`} startOffset="50%" textAnchor="middle">RECOMMENDED</textPath>
          </text>
        )}

        {/* TODAY flag */}
        <line x1={flagTip.x} y1={flagTip.y} x2={flagBase.x} y2={flagBase.y} className="dmr-k-today-line" />
        <g transform={`translate(${pt(today, R_TICK_OUT + 26).x} ${pt(today, R_TICK_OUT + 26).y})`}>
          <rect x={-26} y={-10} width={52} height={20} rx={10} className="dmr-k-today-pill" />
          <text y={4} textAnchor="middle" className="dmr-k-today-text">TODAY</text>
        </g>

        {/* Puck */}
        <g filter={`url(#${uid}-shadow)`} className="dmr-k-puckwrap">
          <circle cx={C} cy={C} r={R_PUCK + 6} fill={`url(#${uid}-rim)`} />
          <circle cx={C} cy={C} r={R_PUCK} fill={`url(#${uid}-puck)`} />
        </g>
        <g transform={`rotate(${angle} ${C} ${C})`} className="dmr-k-rotor">
          {Array.from({ length: 72 }, (_, i) => {
            const a = (i * 5 * Math.PI) / 180
            return (
              <line
                key={i}
                x1={C + (R_PUCK - 9) * Math.cos(a)}
                y1={C + (R_PUCK - 9) * Math.sin(a)}
                x2={C + (R_PUCK - 1) * Math.cos(a)}
                y2={C + (R_PUCK - 1) * Math.sin(a)}
                className="dmr-k-knurl"
              />
            )
          })}
          <line x1={C + R_PUCK - 36} y1={C} x2={C + R_PUCK - 14} y2={C} stroke={DMR_BLUE} strokeWidth={5} strokeLinecap="round" />
          <circle cx={C + R_PUCK - 44} cy={C} r={3} fill={DMR_BLUE} />
        </g>
        <circle cx={C} cy={C} r={R_PUCK - 16} className="dmr-k-face" />

        {/* Readout */}
        <text x={C} y={C - 34} textAnchor="middle" className="dmr-k-eyebrow">MONTHLY AD SPEND</text>
        <text x={C} y={C + 22} textAnchor="middle" className="dmr-k-value-text">{usd(value)}</text>
        <text x={C} y={C + 48} textAnchor="middle" className="dmr-k-per">per month</text>
        <text x={C} y={C + 84} textAnchor="middle" className="dmr-k-mark">DMR</text>

        {/* Grab handle on the track */}
        <circle cx={handle.x} cy={handle.y} r={15} className="dmr-k-handle" stroke={DMR_BLUE} />
        <circle cx={handle.x} cy={handle.y} r={5} fill={DMR_BLUE} />
      </svg>
    </div>
  )
}

function pt(t: number, r: number) {
  const a = ((START + t * SWEEP) * Math.PI) / 180
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) }
}

function arc(t1: number, t2: number, r: number) {
  if (t2 - t1 <= 0.0005) return ''
  const a = pt(t1, r)
  const b = pt(t2, r)
  const large = (t2 - t1) * SWEEP > 180 ? 1 : 0
  return `M${a.x},${a.y} A${r},${r} 0 ${large} 1 ${b.x},${b.y}`
}

function niceStep(raw: number) {
  const mag = 10 ** Math.floor(Math.log10(raw))
  const n = raw / mag
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag
}

const shortUsd = (v: number) => (v >= 1000 ? `$${+(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`)
