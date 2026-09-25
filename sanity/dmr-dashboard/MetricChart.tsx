import { useEffect, useRef, useState } from 'react'
import { monthLabel } from './math'

export type Point = { month: string; value: number }

/**
 * Single-series area chart driven by the selected metric card (Reddit Ads Manager pattern).
 * One hue, 2px line, recessive grid, crosshair + tooltip on hover, whole-column hit targets.
 */
export function MetricChart({ points, format, label }: { points: Point[]; format: (n: number) => string; label: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(720)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const H = 240
  const pad = { top: 16, right: 16, bottom: 28, left: 56 }
  const iw = W - pad.left - pad.right
  const ih = H - pad.top - pad.bottom
  const max = niceMax(Math.max(1, ...points.map((p) => p.value)))
  const step = points.length > 1 ? iw / (points.length - 1) : 0
  const x = (i: number) => pad.left + (points.length > 1 ? step * i : iw / 2)
  const y = (v: number) => pad.top + ih - (v / max) * ih
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ')
  const area = points.length ? `${line} L${x(points.length - 1)},${pad.top + ih} L${x(0)},${pad.top + ih} Z` : ''
  const last = points.length - 1
  const ticks = [0, 0.5, 1]

  return (
    <div className="dmr-chart" ref={ref} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} by month`}>
        <defs>
          <linearGradient id="dmr-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3c88c0" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#3c88c0" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(max * t)} y2={y(max * t)} className={t === 0 ? 'dmr-baseline' : 'dmr-grid'} />
            <text x={pad.left - 10} y={y(max * t) + 4} textAnchor="end" className="dmr-tick">{format(max * t)}</text>
          </g>
        ))}
        <path d={area} fill="url(#dmr-area)" />
        <path d={line} className="dmr-line" />
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + ih} className="dmr-crosshair" />
        )}
        {points.map((p, i) => (
          <g key={p.month}>
            {(i === hover || (hover === null && i === last)) && (
              <circle cx={x(i)} cy={y(p.value)} r={5} className="dmr-dot" />
            )}
            <text x={x(i)} y={H - 6} textAnchor="middle" className="dmr-tick">{monthLabel(p.month, 'short')}</text>
            <rect
              x={x(i) - (step || iw) / 2}
              y={0}
              width={step || iw}
              height={H}
              fill="transparent"
              tabIndex={0}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${monthLabel(p.month)}: ${format(p.value)}`}
            />
          </g>
        ))}
      </svg>
      {hover !== null && points[hover] && (
        <div
          className="dmr-tooltip"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(points[hover].value) / H) * 100}%` }}
        >
          <span className="dmr-tooltip-k">{monthLabel(points[hover].month)}</span>
          <span className="dmr-tooltip-v">{format(points[hover].value)}</span>
          <span className="dmr-tooltip-k">{label}</span>
        </div>
      )}
    </div>
  )
}

function niceMax(v: number) {
  const mag = 10 ** Math.floor(Math.log10(v))
  const n = v / mag
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag
}
