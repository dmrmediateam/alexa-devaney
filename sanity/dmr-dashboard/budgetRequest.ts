import { useCallback } from 'react'
import { useClient, useCurrentUser } from 'sanity'
import { SITE_URL } from './tokens'

export type BudgetRequestInput = {
  clientName: string
  currentSpend: number
  requestedSpend: number
  baselineMonth: string
  projection: { leads: number; cpl: number; roi: number; commission: number }
  note?: string
}

/** 'sent' = DMR was emailed. 'saved' = request stored in Sanity but the email step failed. */
export type BudgetRequestResult = { status: 'sent' | 'saved'; id: string }
export type SubmitBudgetRequest = (input: BudgetRequestInput) => Promise<BudgetRequestResult>

/**
 * Saves the request as a `dmrBudgetRequest` document (needs a signed-in Studio user),
 * then asks the website to email the DMR team about that document.
 */
export function useSubmitBudgetRequest(): SubmitBudgetRequest {
  const client = useClient({ apiVersion: '2025-01-01' })
  const user = useCurrentUser()

  return useCallback<SubmitBudgetRequest>(
    async (input) => {
      const doc = await client.create({
        _type: 'dmrBudgetRequest',
        ...input,
        note: input.note?.trim() || undefined,
        requestedBy: user?.name,
        requestedByEmail: user?.email,
        status: 'requested',
      })
      try {
        const res = await fetch(`${SITE_URL}/api/dmr/budget-request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: doc._id }),
        })
        return { status: res.ok ? 'sent' : 'saved', id: doc._id }
      } catch {
        return { status: 'saved', id: doc._id }
      }
    },
    [client, user],
  )
}
