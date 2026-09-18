"use client";

import Honeypot from "@/components/leads/Honeypot";
import { useLeadSubmit } from "@/lib/leads/useLeadSubmit";

/**
 * Enquiry about one specific property: the highest-intent form on the site,
 * so it is worth wiring before any other.
 */
export default function ListingInquiryForm({
  address,
  listingId,
  consent,
}: {
  address: string;
  listingId: string;
  consent: string;
}) {
  const { status, submit } = useLeadSubmit("listing-inquiry", "listing_inquiry");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await submit({
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      address,
      mlsNumber: listingId,
      company: String(data.get("company") ?? ""),
      website: String(data.get("website") ?? ""),
    });
  }

  if (status === "done") {
    return (
      <div className="listing-detail__inquiry">
        <h4>Thank you</h4>
        <p>We will be in touch about {address} shortly.</p>
      </div>
    );
  }

  return (
    <form className="listing-detail__inquiry" onSubmit={handleSubmit}>
      <Honeypot idSuffix="listing" />
      <h4>Request Information</h4>
      <input type="text" name="name" placeholder="Name" required />
      <input type="email" name="email" placeholder="Email" required />
      <input type="tel" name="phone" placeholder="Phone" />
      <textarea name="message" rows={3} defaultValue={`I'd like more information about ${address}.`} />
      <label className="newsletter__consent">
        <input type="checkbox" name="termsAccepted" required />
        <span>{consent}</span>
      </label>
      <button type="submit" className="lp-btn btn--primary-light" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send"}
      </button>
      {status === "error" && <p className="form-error">Something went wrong. Please try again.</p>}
    </form>
  );
}
