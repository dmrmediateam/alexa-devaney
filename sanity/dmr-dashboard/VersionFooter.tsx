import { useEffect, useState } from 'react'
import { CopyIcon } from '@sanity/icons'
import { Button, Card, Flex, Text, useToast } from '@sanity/ui'
import { useClient } from 'sanity'
import { SITE_URL } from './tokens'
import { DMR_PORTAL_VERSION } from './version'

type SiteVersion = { version: string; commit: string | null; env: string | null }

/**
 * Bottom strip: which portal version this Studio runs, and which one the
 * website runs (from /api/dmr/version). They differ when one was redeployed
 * and the other wasn't: a git push updates the site, `npm run sanity:deploy`
 * updates the Studio. Copy puts every detail on the clipboard for a ticket.
 */
export function VersionFooter() {
  const client = useClient({ apiVersion: '2025-01-01' })
  const { projectId, dataset } = client.config()
  const toast = useToast()
  const [site, setSite] = useState<SiteVersion | 'loading' | 'unreachable'>('loading')

  useEffect(() => {
    let live = true
    fetch(`${SITE_URL}/api/dmr/version`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body: SiteVersion) => live && setSite(body?.version ? body : 'unreachable'))
      // A site from before v1.1.0 has no version route, which reads the same as down.
      .catch(() => live && setSite('unreachable'))
    return () => {
      live = false
    }
  }, [])

  const siteLabel =
    site === 'loading' ? 'checking…' : site === 'unreachable' ? 'unknown' : `v${site.version}${site.commit ? ` (${site.commit})` : ''}`
  const mismatch = typeof site === 'object' && site.version !== DMR_PORTAL_VERSION

  const details = [
    `DMR portal: Studio v${DMR_PORTAL_VERSION}, website ${siteLabel}`,
    `Sanity: ${projectId}/${dataset}`,
    `Site: ${SITE_URL}`,
    `Studio: ${window.location.origin}`,
    `Checked: ${new Date().toISOString()}`,
  ].join('\n')

  const copy = () =>
    navigator.clipboard.writeText(details).then(
      () => toast.push({ status: 'success', title: 'Version details copied' }),
      () => toast.push({ status: 'error', title: 'Could not copy', description: details }),
    )

  return (
    <Card borderTop paddingX={3} paddingY={1} className="dmr-version" tone={mismatch || site === 'unreachable' ? 'caution' : 'default'}>
      <Flex align="center" gap={2}>
        <Text size={0} muted textOverflow="ellipsis" className="dmr-min0">
          DMR Dashboard v{DMR_PORTAL_VERSION} · Website {siteLabel}
          {mismatch && ' · versions differ'}
          <span className="dmr-hide-sm"> · {projectId}/{dataset}</span>
        </Text>
        <Button icon={CopyIcon} mode="bleed" fontSize={0} padding={1} onClick={copy} aria-label="Copy version details" title="Copy version details" />
      </Flex>
    </Card>
  )
}
