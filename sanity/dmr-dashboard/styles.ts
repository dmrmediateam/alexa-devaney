/**
 * Only the pieces @sanity/ui doesn't draw: pane geometry, the rigid tile grid, tables,
 * chart marks and DMR's display numbers. Colors come from Sanity UI's --card-* variables,
 * so light/dark follow the Studio. Everything is scoped under .dmr-tool.
 */
export const dashboardCss = /* css */ `
.dmr-tool { height: 100%; min-height: 0; font-variant-numeric: tabular-nums; }
.dmr-tool *, .dmr-tool *::before, .dmr-tool *::after { box-sizing: border-box; }
.dmr-min0 { min-width: 0; }

/* panes: same proportions as the Structure tool */
.dmr-list-pane { width: 320px; flex: none; height: 100%; }
.dmr-content-pane { min-width: 0; height: 100%; }
.dmr-pane-header { height: 49px; flex: none; }
.dmr-list-scroll, .dmr-content-scroll { overflow-y: auto; min-height: 0; }
.dmr-list-foot { flex: none; }
.dmr-header-sub { color: var(--card-muted-fg-color); font-weight: 400; }
.dmr-month select { min-width: 150px; }
.dmr-wordmark { font-family: 'Instrument Serif', Georgia, serif; font-size: 20px; line-height: 1; letter-spacing: -0.02em; color: var(--card-fg-color); }

/* list items: Structure-style previews */
.dmr-item { width: 100%; text-align: left; border: 0; cursor: pointer; font: inherit; }
.dmr-item-media { width: 33px; height: 33px; flex: none; }

/* rigid tile grid: tiles share 1px hairlines, no gaps, no floating cards */
.dmr-tiles { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1px; background: var(--card-border-color); border: 1px solid var(--card-border-color); border-radius: 3px; overflow: hidden; }
.dmr-tiles-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.dmr-tiles-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.dmr-tiles-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.dmr-tile { min-width: 0; border-radius: 0 !important; }
.dmr-tiles .dmr-tile-hero {
  --card-bg-color: #0f0f0f !important;
  --card-fg-color: #fafaf9 !important;
  --card-muted-fg-color: rgba(250, 250, 249, 0.62) !important;
  background: #0f0f0f !important;
}
.dmr-row-link { text-decoration: none; }

/* DMR display numbers */
.dmr-num { display: block; font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; font-size: 40px; line-height: 1; letter-spacing: -0.01em; color: var(--card-fg-color); }
.dmr-num-sm { font-size: 28px; }
.dmr-contact-email { font-family: 'Instrument Serif', Georgia, serif; font-size: clamp(28px, 3vw, 40px); line-height: 1.1; color: var(--card-fg-color); text-decoration: none; word-break: break-word; }
.dmr-contact-email:hover { text-decoration: underline; text-underline-offset: 5px; text-decoration-thickness: 1px; }
.dmr-step-n { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%; background: var(--card-fg-color); color: var(--card-bg-color); font-size: 12px; font-weight: 600; }

/* tables */
.dmr-table { width: 100%; border-collapse: collapse; font-size: 13px; color: var(--card-fg-color); }
.dmr-table th { text-align: right; font-size: 12px; font-weight: 500; color: var(--card-muted-fg-color); padding: 10px 16px; border-bottom: 1px solid var(--card-border-color); white-space: nowrap; }
.dmr-table td { text-align: right; padding: 12px 16px; border-bottom: 1px solid var(--card-border-color); white-space: nowrap; }
.dmr-table th:first-child, .dmr-table td:first-child { text-align: left; }
.dmr-table td:first-child { white-space: normal; }
.dmr-table tbody tr:last-child td { border-bottom: 0; }
.dmr-table tfoot td { font-weight: 600; border-top: 1px solid var(--card-border-color); border-bottom: 0; }
.dmr-share { display: inline-flex; align-items: center; gap: 10px; justify-content: flex-end; }
.dmr-share-bar { width: 96px; height: 6px; border-radius: 3px; background: var(--card-border-color); overflow: hidden; }
.dmr-share-bar span { display: block; height: 100%; background: #3c88c0; }
.dmr-share-num { min-width: 36px; text-align: right; color: var(--card-muted-fg-color); }

/* ROI math */
.dmr-math { margin: 0; font-size: 13px; }
.dmr-math > div { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--card-border-color); }
.dmr-math > div:last-child { border-bottom: 0; }
.dmr-math dt { color: var(--card-muted-fg-color); }
.dmr-math dd { margin: 0; color: var(--card-fg-color); white-space: nowrap; }
.dmr-math-total { align-items: baseline; }
.dmr-math-total dt { color: var(--card-fg-color); font-weight: 600; }
.dmr-math-total dd { font-family: 'Instrument Serif', Georgia, serif; font-size: 28px; line-height: 1; }
.dmr-faq { padding: 0 16px 4px; }
.dmr-faq details { border-top: 1px solid var(--card-border-color); }
.dmr-faq summary { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0; cursor: pointer; list-style: none; }
.dmr-faq summary::-webkit-details-marker { display: none; }
.dmr-chev { color: var(--card-muted-fg-color); display: inline-flex; transition: transform .15s ease; }
.dmr-faq details[open] .dmr-chev { transform: rotate(90deg); }

/* chart (single series, DMR blue) */
.dmr-chart { position: relative; }
.dmr-chart svg { display: block; width: 100%; height: auto; overflow: visible; }
.dmr-grid { stroke: var(--card-border-color); stroke-width: 1; }
.dmr-baseline { stroke: var(--card-muted-fg-color); stroke-opacity: .5; stroke-width: 1; }
.dmr-line { fill: none; stroke: #3c88c0; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.dmr-area-stop { stop-color: #3c88c0; }
.dmr-dot { fill: #3c88c0; stroke: var(--card-bg-color); stroke-width: 2; }
.dmr-crosshair { stroke: var(--card-muted-fg-color); stroke-dasharray: 3 3; stroke-width: 1; }
.dmr-tick { font-size: 11px; fill: var(--card-muted-fg-color); }
.dmr-tooltip { position: absolute; transform: translate(-50%, calc(-100% - 14px)); display: grid; gap: 2px; padding: 8px 12px; border-radius: 4px; background: #0f0f0f; color: #fafaf9; pointer-events: none; white-space: nowrap; box-shadow: 0 6px 20px rgba(0,0,0,.18); font-size: 12px; }
.dmr-tooltip-k { opacity: .7; font-size: 11px; }
.dmr-tooltip-v { font-family: 'Instrument Serif', Georgia, serif; font-size: 22px; line-height: 1.1; }

/* ad spend planner */
.dmr-tiles-planner { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.dmr-guide-icon { font-size: 25px; line-height: 0; display: block; }

/* DMR budget dial */
.dmr-knob-tile { background: radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, #3c88c0 7%, var(--card-bg-color)) 0%, var(--card-bg-color) 60%) !important; }
.dmr-knob2 { display: flex; justify-content: center; }
.dmr-knob2 svg { width: 100%; max-width: 460px; height: auto; touch-action: none; user-select: none; cursor: grab; outline: none; overflow: visible; }
.dmr-knob2.is-dragging svg { cursor: grabbing; }
.dmr-knob2 svg:focus-visible .dmr-k-handle { stroke-width: 6; }
.dmr-k-tick { stroke: var(--card-muted-fg-color); stroke-opacity: .45; stroke-width: 1.25; }
.dmr-k-tick.is-major { stroke-opacity: .9; stroke-width: 2; }
.dmr-k-scale { font-size: 12px; font-weight: 500; fill: var(--card-muted-fg-color); font-variant-numeric: tabular-nums; }
.dmr-k-track { fill: none; stroke: var(--card-border-color); stroke-width: 14; stroke-linecap: round; }
.dmr-k-zone { fill: none; stroke-width: 14; stroke-linecap: butt; }
.dmr-k-zone.is-positive { stroke: #3c88c0; stroke-opacity: .22; }
.dmr-k-zone.is-caution { stroke: #d9a23a; stroke-opacity: .18; }
.dmr-k-zone.is-critical { stroke: #c24141; stroke-opacity: .22; }
.dmr-k-value { fill: none; stroke-width: 14; stroke-linecap: round; transition: d .12s ease; }
.dmr-k-reclabel { font-size: 10px; font-weight: 600; letter-spacing: .18em; fill: #3c88c0; }
.dmr-k-today-line { stroke: var(--card-fg-color); stroke-width: 2; }
.dmr-k-today-pill { fill: var(--card-fg-color); }
.dmr-k-today-text { font-size: 9.5px; font-weight: 700; letter-spacing: .14em; fill: var(--card-bg-color); }
.dmr-k-knurl { stroke: #ffffff; stroke-opacity: .09; stroke-width: 1.5; }
.dmr-k-face { fill: none; stroke: #ffffff; stroke-opacity: .06; stroke-width: 1; }
.dmr-k-rotor { transition: transform .12s ease; }
.dmr-knob2.is-dragging .dmr-k-rotor, .dmr-knob2.is-dragging .dmr-k-value { transition: none; }
.dmr-k-eyebrow { font-size: 10.5px; font-weight: 600; letter-spacing: .2em; fill: #fafaf9; fill-opacity: .55; }
.dmr-k-value-text { font-family: 'Instrument Serif', Georgia, serif; font-size: 60px; fill: #fafaf9; letter-spacing: -0.01em; }
.dmr-k-per { font-size: 12px; fill: #fafaf9; fill-opacity: .55; }
.dmr-k-mark { font-family: 'Instrument Serif', Georgia, serif; font-size: 15px; letter-spacing: .04em; fill: #fafaf9; fill-opacity: .35; }
.dmr-k-handle { fill: #ffffff; stroke-width: 4; filter: drop-shadow(0 2px 5px rgba(0,0,0,.25)); transition: r .15s ease; }
.dmr-knob2.is-dragging .dmr-k-handle { r: 17; }

/* status chip under the dial */
.dmr-k-status { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; margin: 0 auto; padding: 8px 14px; border-radius: 999px; font-size: 13px; color: var(--card-fg-color); background: var(--card-border-color); max-width: 100%; }
.dmr-k-status strong { font-weight: 600; }
.dmr-k-status-delta { color: var(--card-muted-fg-color); font-variant-numeric: tabular-nums; }
.dmr-k-status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--card-muted-fg-color); }
.dmr-k-status.is-positive { background: color-mix(in srgb, #3c88c0 14%, var(--card-bg-color)); }
.dmr-k-status.is-positive .dmr-k-status-dot { background: #3c88c0; }
.dmr-k-status.is-caution { background: color-mix(in srgb, #d9a23a 18%, var(--card-bg-color)); }
.dmr-k-status.is-caution .dmr-k-status-dot { background: #d9a23a; }
.dmr-k-status.is-critical { background: color-mix(in srgb, #c24141 16%, var(--card-bg-color)); }
.dmr-k-status.is-critical .dmr-k-status-dot { background: #c24141; }

/* custom stepper + segmented presets */
.dmr-k-controls { display: flex; align-items: center; justify-content: center; gap: 10px; }
.dmr-k-step { width: 40px; height: 40px; flex: none; border-radius: 50%; border: 1px solid var(--card-border-color); background: var(--card-bg-color); color: var(--card-fg-color); font-size: 20px; line-height: 1; cursor: pointer; transition: background .15s ease, border-color .15s ease; }
.dmr-k-step:hover { border-color: var(--card-fg-color); }
.dmr-k-seg { display: inline-flex; padding: 3px; border-radius: 999px; background: var(--card-border-color); gap: 2px; }
.dmr-k-seg button { border: 0; background: transparent; color: var(--card-muted-fg-color); font-family: inherit; font-weight: 500; font-size: 13px; padding: 8px 14px; border-radius: 999px; cursor: pointer; font-variant-numeric: tabular-nums; }
.dmr-k-seg button:hover { color: var(--card-fg-color); }
.dmr-k-seg button[aria-pressed='true'] { background: #0f0f0f; color: #fafaf9; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
.dmr-k-step:focus-visible, .dmr-k-seg button:focus-visible { outline: 2px solid #3c88c0; outline-offset: 2px; }

.dmr-num-accent { color: #3c88c0; }
.dmr-up { color: #2f8a5f !important; }
.dmr-down { color: #c24141 !important; }
.dmr-warn { color: #b7791f !important; }
.dmr-muted { color: var(--card-muted-fg-color); }
.dmr-up [data-ui='Text'], .dmr-warn [data-ui='Text'] { color: inherit; }

/* AI follow-up */
.dmr-ai-media { width: 44px; height: 44px; }
.dmr-tile-ai { position: relative; overflow: visible; }
.dmr-tiles:has(.dmr-tile-ai) { overflow: visible; }
.dmr-pop {
  position: absolute; right: 16px; top: -18px; z-index: 2;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 8px 8px 12px; border-radius: 999px;
  background: #0f0f0f; color: #fafaf9; font-size: 13px; line-height: 1.2;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .22);
  animation: dmr-pop-in .45s cubic-bezier(.34, 1.56, .64, 1) both;
}
.dmr-pop::after { content: ''; position: absolute; right: 40px; bottom: -6px; width: 12px; height: 12px; background: #0f0f0f; transform: rotate(45deg); border-radius: 2px; }
.dmr-pop strong { color: #7fb8e0; font-weight: 700; }
.dmr-pop-icon { display: inline-flex; font-size: 17px; color: #7fb8e0; }
.dmr-pop-close { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border: 0; border-radius: 50%; background: rgba(250, 250, 249, .12); color: #fafaf9; cursor: pointer; font-size: 15px; padding: 0; }
.dmr-pop-close:hover { background: rgba(250, 250, 249, .24); }
@keyframes dmr-pop-in { from { opacity: 0; transform: translateY(8px) scale(.85); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .dmr-pop { animation: none; } }
@media (max-width: 800px) {
  .dmr-pop { position: relative; top: 0; right: 0; display: flex; margin-bottom: 14px; border-radius: 12px; }
  .dmr-pop > span:nth-child(2) { flex: 1; }
  .dmr-pop::after { display: none; }
}

@media (max-width: 1100px) {
  .dmr-tiles-planner { grid-template-columns: minmax(0, 1fr); }
  .dmr-tiles-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 800px) {
  .dmr-tool { flex-direction: column !important; }
  .dmr-list-pane { width: 100%; height: auto; border-right: 0 !important; border-bottom: 1px solid var(--card-border-color); }
  .dmr-list-scroll { display: flex !important; flex-wrap: nowrap; gap: 4px; overflow-x: auto; }
  .dmr-list-scroll > div:first-child { display: flex !important; gap: 4px; flex: none; }
  .dmr-list-scroll > div:first-child > * { margin: 0 !important; }
  .dmr-list-scroll .dmr-item { flex: none; width: 220px; }
  .dmr-list-scroll > div:nth-child(2), .dmr-list-foot { display: none !important; }
  .dmr-content-pane { height: auto; flex: 1; }
  .dmr-tiles-2, .dmr-tiles-3 { grid-template-columns: minmax(0, 1fr); }
  .dmr-hide-sm { display: none; }
}
@media (max-width: 520px) {
  .dmr-k-controls { gap: 6px; }
  .dmr-k-step { width: 34px; height: 34px; font-size: 18px; }
  .dmr-k-seg button { padding: 7px 9px; font-size: 12.5px; }
  .dmr-tiles-4 { grid-template-columns: minmax(0, 1fr); }
  .dmr-header-btn [data-ui='Text'] { display: none; }
  .dmr-header-sub { display: none; }
  .dmr-month select { min-width: 0; }
}
`
