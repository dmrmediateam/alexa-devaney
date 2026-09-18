"use client";

import Honeypot from "@/components/leads/Honeypot";
import { useLeadSubmit } from "@/lib/leads/useLeadSubmit";

/** Footer signup, present on every page. Low intent by design: it never sends
 *  an SMS, and it is valued accordingly for bidding. */
export default function NewsletterForm({ consent }: { consent: string }) {
  const { status, submit } = useLeadSubmit("newsletter");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await submit({
      email: String(data.get("email") ?? "").trim(),
      company: String(data.get("company") ?? ""),
      website: String(data.get("website") ?? ""),
    });
  }

  if (status === "done") {
    return <p className="newsletter__done">Thank you, you are subscribed.</p>;
  }

  return (
    <form className="newsletter" onSubmit={handleSubmit}>
      <Honeypot idSuffix="newsletter" />
      <div className="newsletter__row">
        <input type="email" name="email" placeholder="Email Address" required />
        <button type="submit" aria-label="Subscribe" disabled={status === "submitting"}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h15" /><path d="M13 6l6 6-6 6" /></svg>
        </button>
      </div>
      <label className="newsletter__consent">
        <input type="checkbox" name="termsAccepted" required />
        <span>{consent} <a href="/legal/privacy-policy">Privacy Policy</a>.</span>
      </label>
      {status === "error" && <p className="form-error">Something went wrong. Please try again.</p>}
    </form>
  );
}
