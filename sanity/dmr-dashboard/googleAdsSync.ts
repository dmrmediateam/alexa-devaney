import { useCallback } from 'react'
import { useClient } from 'sanity'
import { SITE_URL } from './tokens'

export type SyncResult = { ok: boolean; at: string; message: string; months?: number; campaigns?: number }
export type RunGoogleAdsSync = () => Promise<SyncResult>

/**
 * Stamps `syncRequestedAt` on Report Settings (needs a signed-in Studio user),
 * then asks the website to pull Google Ads into the Monthly Reports. The
 * website refuses without a fresh stamp, so only Studio users can trigger it.
 */
export function useGoogleAdsSync(): RunGoogleAdsSync {
  const client = useClient({ apiVersion: '2025-01-01' })

  return useCallback<RunGoogleAdsSync>(async () => {
    const failed = (message: string): SyncResult => ({ ok: false, at: new Date().toISOString(), message })
    try {
      await client.patch('dmr-client-settings').set({ syncRequestedAt: new Date().toISOString() }).commit()
    } catch {
      return failed('Could not start the sync: your Studio account may not have write access.')
    }
    try {
      const res = await fetch(`${SITE_URL}/api/dmr/google-ads-sync`, { method: 'POST' })
      const body = (await res.json().catch(() => null)) as SyncResult | null
      return body?.message ? body : failed(`The website returned ${res.status}.`)
    } catch {
      return failed(`Could not reach ${SITE_URL}.`)
    }
  }, [client])
}
