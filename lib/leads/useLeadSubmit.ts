"use client";

import { useState } from "react";
import { getAttribution } from "@/lib/attribution";
import { LEAD_VALUES, setUserData, trackEvent, type ConversionEvent } from "@/lib/analytics";
import { qualify } from "@/lib/leads/qualify";

export type LeadStatus = "idle" | "submitting" | "done" | "error";

/**
 * One submit path for every lead form on the site.
 *
 * Attribution, enhanced-conversion identifiers, the analytics event and the
 * status machine all live here rather than being copied into each form. The
 * last tracking gap on this site came from three surfaces each holding their
 * own copy of the same logic and one of them missing a piece.
 */
export function useLeadSubmit(formType: string, event: ConversionEvent = "generate_lead") {
  const [status, setStatus] = useState<LeadStatus>("idle");

  async function submit(fields: Record<string, unknown>): Promise<boolean> {
    setStatus("submitting");
    const payload = { formType, ...fields };
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          page: window.location.pathname + window.location.search,
          attribution: getAttribution(),
        }),
      });
      if (!res.ok) throw new Error("request failed");

      const email = typeof fields.email === "string" ? fields.email : undefined;
      const phone = typeof fields.phone === "string" ? fields.phone : undefined;
      setUserData({ email, phone });

      const q = qualify(payload);
      const base = LEAD_VALUES[formType] ?? 20;
      trackEvent(event, {
        form_type: formType,
        qualified: q.qualified,
        value: q.qualified ? base : Math.round(base / 6),
        currency: "USD",
      });
      setStatus("done");
      return true;
    } catch {
      setStatus("error");
      return false;
    }
  }

  return { status, submit };
}
