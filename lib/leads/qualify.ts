/* ==========================================================================
   Lead qualification.

   One rule set, used by the email subject, the notification design, the SMS
   gate and the analytics event, so a lead can never be "qualified" in one
   place and not another.

   These are deliberately blunt. The point is not to score a lead precisely,
   it is to tell Carole in the subject line whether this is worth interrupting
   a showing for.
   ========================================================================== */

export type Qualification = {
  qualified: boolean;
  /** Short reason shown on the badge, e.g. "Cash buyer · $5M – $10M" */
  label: string;
  /** Subject-line tag. NEW = no qualifying questions on this form to judge on. */
  tag: "QUALIFIED" | "DQ" | "NEW";
};

const STRONG_FINANCING = new Set(["Paying cash", "Yes, pre-approved"]);
const SOFT_FINANCING = new Set(["Pre-approval in progress"]);

/*
 * "Yes, I have an agent" is the one hard disqualifier on the seller side, and
 * it is not only a commercial judgement: soliciting a seller already under
 * contract with another broker is off limits, and the site's own footer says
 * so. Flagging it keeps Carole from calling into that by accident.
 */
const REPRESENTED = "Yes, I have an agent";

function str(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : "";
}

export function qualify(payload: Record<string, unknown>): Qualification {
  const formType = str(payload, "formType");

  if (formType === "buyer") {
    const financing = str(payload, "financing");
    const price = str(payload, "pricePoint");
    if (STRONG_FINANCING.has(financing)) {
      return {
        qualified: true,
        label: [financing === "Paying cash" ? "Cash buyer" : "Pre-approved", price]
          .filter(Boolean)
          .join(" · "),
        tag: "QUALIFIED",
      };
    }
    if (SOFT_FINANCING.has(financing)) {
      return {
        qualified: true,
        label: ["Pre-approval in progress", price].filter(Boolean).join(" · "),
        tag: "QUALIFIED",
      };
    }
    return {
      qualified: false,
      label: financing ? `Not financed yet · ${financing}` : "Financing not stated",
      tag: "DQ",
    };
  }

  if (formType === "home-value") {
    const agent = str(payload, "agentStatus");
    const value = str(payload, "estimatedValue");
    const timeline = str(payload, "timeline");
    if (agent === REPRESENTED) {
      return {
        qualified: false,
        label: "Already represented by another agent",
        tag: "DQ",
      };
    }
    return {
      qualified: true,
      label: [agent || "Seller", value, timeline].filter(Boolean).join(" · "),
      tag: "QUALIFIED",
    };
  }

  /*
   * Forms that ask no qualifying questions get a neutral verdict, not [DQ].
   * A listing enquiry is high intent by definition, and marking it
   * "not qualified" would train Carole to skip exactly the wrong emails.
   */
  if (formType === "listing-inquiry") {
    return { qualified: true, label: "Asked about a specific property", tag: "NEW" };
  }
  if (formType === "contact") {
    return { qualified: true, label: "General enquiry", tag: "NEW" };
  }
  if (formType === "newsletter") {
    return { qualified: false, label: "Newsletter signup", tag: "NEW" };
  }
  return { qualified: false, label: "No qualifying answers given", tag: "NEW" };
}
