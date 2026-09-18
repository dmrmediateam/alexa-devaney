"use client";

import Honeypot from "@/components/leads/Honeypot";
import { useLeadSubmit } from "@/lib/leads/useLeadSubmit";

/** The /connect page form. Markup and classes match the original so the
 *  existing styling applies unchanged; only the submit behaviour is new. */
export default function ContactForm({ consent }: { consent: string }) {
  const { status, submit } = useLeadSubmit("contact");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await submit({
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      company: String(data.get("company") ?? ""),
      website: String(data.get("website") ?? ""),
    });
  }

  if (status === "done") {
    return (
      <div className="connect-grid__form connect-grid__form--done">
        <h3>Thank you</h3>
        <p>Your message is with Carole and she will follow up personally, usually the same day.</p>
      </div>
    );
  }

  return (
    <form className="connect-grid__form reveal" data-delay="100" onSubmit={handleSubmit}>
      <Honeypot idSuffix="connect" />
      <div className="connect-grid__fields">
        <input type="text" name="name" placeholder="Name" required />
        <input type="email" name="email" placeholder="Email" required />
        <input type="tel" name="phone" placeholder="Phone" />
        <textarea name="message" placeholder="How can we help?" rows={5} />
      </div>
      <label className="newsletter__consent">
        <input type="checkbox" name="termsAccepted" required />
        <span>{consent}</span>
      </label>
      <button type="submit" className="lp-btn btn--primary-light" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send Message"}
      </button>
      {status === "error" && (
        <p className="form-error">Something went wrong. Please try again, or call directly.</p>
      )}
    </form>
  );
}
