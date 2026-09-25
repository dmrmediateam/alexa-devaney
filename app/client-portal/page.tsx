import type { Metadata } from 'next'
import { Instrument_Serif, Inter } from 'next/font/google'
import './portal.css'

/**
 * DMR Media client portal sign-in — branded front door to the Sanity Studio.
 * Sanity owns authentication (Google / email / SSO), so the button hands off to
 * the Studio, which shows Sanity's login with the DMR theme applied.
 *
 * Ported from the reference build (eaganluxury.com), which styles this page
 * with Tailwind; this site has no Tailwind, so the same design lives in
 * ./portal.css. The page renders without SiteChrome, so it carries no site
 * header, footer or nav by construction.
 */

const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-dmr-serif' })
const sans = Inter({ subsets: ['latin'], variable: '--font-dmr-sans' })

const STUDIO_URL = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'https://alexa-devaney.sanity.studio/dashboard'
const DMR_EMAIL = 'team@dmrmedia.org'

export const metadata: Metadata = {
  title: { absolute: 'Client Dashboard | DMR Media' },
  description: 'Sign in to see your leads, ad spend and estimated ROI.',
  robots: { index: false, follow: false },
}

const preview = [
  { label: 'Total leads', value: '159' },
  { label: 'Cost per lead', value: '$15' },
  { label: 'Ad spend', value: '$2,453' },
]
const bars = [7, 144, 160, 157, 159]

export default function ClientPortalPage() {
  return (
    <div className={`portal ${serif.variable} ${sans.variable}`}>
      {/* ── Sign-in column ─────────────────────────────── */}
      <section className="portal__signin">
        <header className="portal__head">
          <span className="portal__wordmark">DMR</span>
          <a className="portal__headlink" href="https://dmrmedia.org">
            dmrmedia.org
          </a>
        </header>

        <div className="portal__body">
          <p className="portal__eyebrow">Client dashboard</p>
          <h1 className="portal__title">
            Welcome <em>back</em>.
          </h1>
          <p className="portal__lede">
            Your leads, ad spend and estimated ROI, updated every month by your DMR team.
          </p>

          <a className="portal__btn portal__btn--primary" href={STUDIO_URL}>
            Sign in to your dashboard →
          </a>
          <p className="portal__hint">Use the Google or email account DMR invited you with.</p>

          <div className="portal__divider">
            <span /> Need a hand? <span />
          </div>

          <a
            className="portal__btn portal__btn--ghost"
            href={`mailto:${DMR_EMAIL}?subject=${encodeURIComponent('Help signing in to my dashboard')}`}
          >
            Email {DMR_EMAIL}
          </a>
        </div>

        <footer className="portal__foot">
          <span>DMR Media Specialists</span>
          <a href={`mailto:${DMR_EMAIL}`}>{DMR_EMAIL}</a>
        </footer>
      </section>

      {/* ── Brand panel ────────────────────────────────── */}
      <aside className="portal__panel">
        <p className="portal__panel-eyebrow">Monthly performance</p>

        <div>
          <h2 className="portal__panel-title">
            Every lead, every dollar, <em>one place.</em>
          </h2>

          {/* Mini dashboard preview (sample numbers) */}
          <div className="portal__card">
            <div className="portal__card-top">
              <div>
                <p className="portal__card-label">Est. ROI · since launch</p>
                <p className="portal__card-roi">330%</p>
              </div>
              <span className="portal__badge">85% below industry CPL</span>
            </div>
            <div className="portal__bars" aria-hidden="true">
              {bars.map((b, i) => (
                <i key={i} style={{ height: `${Math.max(4, (b / 160) * 100)}%` }} />
              ))}
            </div>
            <div className="portal__stats">
              {preview.map((p) => (
                <div key={p.label}>
                  <p className="portal__card-label">{p.label}</p>
                  <p className="portal__stat-value">{p.value}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="portal__sample">Sample data</p>
        </div>

        <p className="portal__note">
          A <em>low</em> estimate, on purpose: 1% close rate, one side of the commission, your
          market&rsquo;s median price.
        </p>
      </aside>
    </div>
  )
}
