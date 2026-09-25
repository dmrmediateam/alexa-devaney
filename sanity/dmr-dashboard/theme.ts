/**
 * DMR Media Studio theme — ink, off-white and one blue accent.
 * Also styles Sanity's own login screen (the provider buttons pick up these colors).
 */
import { buildLegacyTheme } from 'sanity'

export const dmrTheme = buildLegacyTheme({
  '--font-family-base': `Inter, -apple-system, 'Segoe UI', system-ui, sans-serif`,
  '--black': '#0f0f0f',
  '--white': '#fafaf9',
  '--gray-base': '#6b6b68',
  '--gray': '#e7e7e5',

  '--brand-primary': '#0f0f0f',

  '--component-bg': '#fafaf9',
  '--component-text-color': '#0f0f0f',

  '--default-button-color': '#e7e7e5',
  '--default-button-primary-color': '#0f0f0f',
  '--default-button-success-color': '#2f6f53',
  '--default-button-warning-color': '#b45309',
  '--default-button-danger-color': '#b42318',

  '--focus-color': '#3c88c0',

  '--main-navigation-color': '#0f0f0f',
  '--main-navigation-color--inverted': '#fafaf9',

  '--state-info-color': '#3c88c0',
  '--state-success-color': '#2f6f53',
  '--state-warning-color': '#b45309',
  '--state-danger-color': '#b42318',
})
