"use client";

import { useState } from "react";
import { getAttribution } from "@/lib/attribution";
import { LEAD_VALUES, fireLeadConversion, setUserData, trackEvent, type ConversionEvent } from "@/lib/analytics";
import { qualify } from "@/lib/leads/qualify";
import { formElapsedMs } from "@/lib/leads/phone";

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
  /* Set when the server rejected a field the visitor can fix (an email domain
     that does not exist), so the form can say what to change. */
  const [errorField, setErrorField] = useState<"email" | null>(null);

  /** homeValue: the price of the home this lead is about, when the form knows it */
  async function submit(fields: Record<string, unknown>, homeValue?: number): Promise<boolean> {
    setStatus("submitting");
    setErrorField(null);
    const payload = { formType, ...fields };
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          page: window.location.pathname + window.location.search,
          attribution: getAttribution(),
          elapsedMs: formElapsedMs(),
        }),
      });
      if (res.status === 422) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (body.error === "email") setErrorField("email");
        throw new Error("rejected");
      }
      if (!res.ok) throw new Error("request failed");

      const email = typeof fields.email === "string" ? fields.email : undefined;
      const phone = typeof fields.phone === "string" ? fields.phone : undefined;
      setUserData({ email, phone });

      const q = qualify(payload);
      const base = LEAD_VALUES[formType] ?? 20;
      const conversionValue = fireLeadConversion(formType, homeValue);
      trackEvent(event, {
        form_type: formType,
        qualified: q.qualified,
        value: conversionValue ?? (q.qualified ? base : Math.round(base / 6)),
        currency: "USD",
      });
      setStatus("done");
      return true;
    } catch {
      setStatus("error");
      return false;
    }
  }

  return { status, submit, errorField };
}
