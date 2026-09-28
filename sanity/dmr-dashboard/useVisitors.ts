import { useEffect, useState } from 'react'
import { useClient } from 'sanity'

/**
 * Lead activity, written by the website (see lib/tracking/store.ts there).
 *
 * Identified visitors first: a named person who saved three homes is a call to
 * make this afternoon, an anonymous browser is a statistic. Arrays come back
 * trimmed to what the panel shows rather than whole, because a visitor
 * document can hold a hundred views and nobody reads a hundred rows.
 *
 * The slices use GROQ's INCLUSIVE `..`, not `...`. The exclusive form drops
 * the last element, which here is the newest one - the single entry the agent
 * most wants to see.
 */

export type VisitorActivity = {
  listingId?: string
  address?: string
  city?: string
  price?: number
  url?: string
  at?: string
}

export type VisitorSearch = { label?: string; at?: string }

export type Visitor = {
  _id: string
  visitorId?: string
  email?: string
  name?: string
  phone?: string
  lastFormType?: string
  firstSeen?: string
  lastSeen?: string
  identifiedAt?: string
  viewCount: number
  saveCount: number
  searchCount: number
  hearted: VisitorActivity[]
  viewed: VisitorActivity[]
  searches: VisitorSearch[]
}

const FIELDS = `
  _id, visitorId, email, name, phone, lastFormType,
  firstSeen, lastSeen, identifiedAt,
  "viewCount": count(viewed),
  "saveCount": count(hearted),
  "searchCount": count(searches),
  "hearted": hearted[]{listingId, address, city, price, url, at},
  "viewed": viewed[-12..-1]{listingId, address, city, price, url, at},
  "searches": searches[-6..-1]{label, at}
`

const QUERY = `{
  "identified": *[_type == "dmrVisitor" && defined(email)] | order(lastSeen desc)[0...60]{${FIELDS}},
  "anonymous": *[_type == "dmrVisitor" && !defined(email)] | order(lastSeen desc)[0...40]{${FIELDS}},
  "totals": {
    "all": count(*[_type == "dmrVisitor"]),
    "identified": count(*[_type == "dmrVisitor" && defined(email)])
  }
}`

export type VisitorState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready'
      identified: Visitor[]
      anonymous: Visitor[]
      totals: { all: number; identified: number }
    }

export function useVisitors(): VisitorState {
  const client = useClient({ apiVersion: '2025-01-01' })
  const [state, setState] = useState<VisitorState>({ status: 'loading' })

  useEffect(() => {
    let alive = true
    client
      .fetch(QUERY)
      .then((res: { identified: Visitor[]; anonymous: Visitor[]; totals: { all: number; identified: number } }) => {
        if (!alive) return
        setState({
          status: 'ready',
          identified: res?.identified ?? [],
          anonymous: res?.anonymous ?? [],
          totals: res?.totals ?? { all: 0, identified: 0 },
        })
      })
      .catch(() => {
        // Unlike the report panes there is no sample data here on purpose:
        // inventing fake buyers would be indistinguishable from real ones.
        if (alive) setState({ status: 'error' })
      })
    return () => {
      alive = false
    }
  }, [client])

  return state
}
