import type { SiteContent } from "@/content/site";

/* ==========================================================================
   Parameterized legal boilerplate. Structure and coverage mirror the
   production legal pages on the reference sites (privacy, terms,
   accessibility, fair housing). Per-client values come from site.legal;
   sensible generic fallbacks keep every page valid before customization.
   ========================================================================== */

export interface LegalSection {
  heading?: string;
  paragraphs: string[];
  list?: string[];
}

export interface LegalDoc {
  slug: string;
  title: string;
  updated?: string;
  sections: LegalSection[];
}

export const GENERIC_MLS_DISCLAIMER =
  "The information contained on this website is derived from sources deemed reliable, including MLS Internet Data Exchange (IDX) data, but is not guaranteed and should be independently verified. All properties are subject to prior sale, change, or withdrawal without notice. IDX information is provided exclusively for consumers' personal, non-commercial use and may not be used for any purpose other than to identify prospective properties consumers may be interested in purchasing. Listings held by brokerage firms other than the brokerage represented on this site may be marked with the IDX logo, and detailed information about those properties will include the name of the listing broker when required by the MLS.";

export const FAIR_HOUSING_PLEDGE =
  "We are pledged to the letter and spirit of U.S. policy for the achievement of equal housing opportunity throughout the Nation. We encourage and support an affirmative advertising and marketing program in which there are no barriers to obtaining housing because of race, color, religion, sex, handicap, familial status, or national origin.";

export const REALTOR_MARK_NOTICE =
  "REALTOR® is a registered trademark of the National Association of REALTORS® and identifies real estate professionals who are members of the National Association of REALTORS® and subscribe to its strict Code of Ethics.";

function brand(content: SiteContent): string {
  return content.footer.brokerage || content.brand.name;
}

export function mlsDisclaimerFor(content: SiteContent): string {
  return content.legal?.mlsDisclaimer ?? GENERIC_MLS_DISCLAIMER;
}

export function legalDocs(content: SiteContent): LegalDoc[] {
  const name = brand(content);
  const agent = content.footer.agentName;
  const updated = content.legal?.lastUpdated;
  const mls = content.legal?.mlsName ?? "the local MLS";
  const law = content.legal?.governingLaw ?? "the state in which the brokerage is licensed";
  const agency = content.legal?.stateCivilRightsAgency;
  const email = content.contact?.email;
  const phone = content.contact?.phone;
  const contactLine = [
    `Questions about this policy can be directed to ${agent}, ${name}`,
    email ? `by email at ${email}` : null,
    phone ? `or by phone at ${phone}` : null,
  ]
    .filter(Boolean)
    .join(" ") + ".";

  return [
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      updated,
      sections: [
        {
          paragraphs: [
            `This Privacy Policy describes how ${name} ("we," "us") collects, uses, and protects information when you use this website. By using the site you agree to the collection and use of information in accordance with this policy.`,
          ],
        },
        {
          heading: "Information We Collect",
          paragraphs: ["We collect information you provide directly and information collected automatically:"],
          list: [
            "Contact details you submit through forms: name, email address, phone number, and the content of your messages.",
            "Real estate preferences: saved searches, saved properties, price ranges, and areas of interest.",
            "Usage data collected automatically: pages visited, time on site, referring pages, browser type, device information, and IP address.",
            "Cookies and similar technologies used for analytics and to remember your preferences.",
          ],
        },
        {
          heading: "How We Use Information",
          paragraphs: ["We use collected information to:"],
          list: [
            "Respond to your inquiries and provide requested real estate services.",
            "Send listing updates, market information, and service communications you have requested or consented to receive.",
            "Improve the website, understand how visitors use it, and measure marketing effectiveness.",
            "Comply with legal obligations, including record-keeping requirements applicable to real estate brokerages.",
          ],
        },
        {
          heading: "Analytics and Advertising",
          paragraphs: [
            "This site may use analytics services (such as Google Analytics) to understand site usage. Analytics providers may set cookies and receive usage data as described in their own privacy policies. Where advertising measurement is used, it is configured to respect applicable consent requirements.",
          ],
        },
        {
          heading: "Sharing of Information",
          paragraphs: [
            `We do not sell your personal information. Information may be shared with service providers who assist in operating this website and our business (such as customer relationship management and email platforms), with ${mls} and related real estate services as necessary to fulfill your requests, and where required by law.`,
          ],
        },
        {
          heading: "Text Messaging and Calls",
          paragraphs: [
            "Where you provide a phone number and consent, we may contact you by call or text about listings and related real estate services. Message and data rates may apply, and message frequency may vary. You can opt out at any time by replying STOP, or reply HELP for assistance. Consent to receive messages is not a condition of purchasing any property or service.",
          ],
        },
        {
          heading: "Your Rights and Choices",
          paragraphs: [
            "You may request access to, correction of, or deletion of the personal information we hold about you, and you may opt out of marketing communications at any time using the unsubscribe link in our emails or by contacting us directly. Where state privacy laws such as the California Consumer Privacy Act (CCPA) apply, you have the right to know what personal information we collect, request its deletion, and opt out of any sale of personal information; as stated above, we do not sell personal information.",
          ],
        },
        {
          heading: "Children's Privacy",
          paragraphs: [
            "This website is not directed to children, and we do not knowingly collect personal information from anyone under 18. If you believe a minor has provided us personal information, contact us and we will delete it.",
          ],
        },
        {
          heading: "Data Security and Retention",
          paragraphs: [
            "We use commercially reasonable safeguards to protect personal information and retain it only as long as needed for the purposes described here or as required by law. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
          ],
        },
        {
          heading: "Changes and Contact",
          paragraphs: [
            "We may update this policy from time to time; the current version will always be posted on this page.",
            contactLine,
          ],
        },
      ],
    },
    {
      slug: "terms-and-conditions",
      title: "Terms and Conditions",
      updated,
      sections: [
        {
          paragraphs: [
            `These Terms and Conditions govern your use of this website, operated by ${name}. By accessing or using the site you accept these terms in full. If you disagree with any part of these terms, do not use this website.`,
          ],
        },
        {
          heading: "Use of the Website",
          paragraphs: ["You agree to use this website only for lawful purposes. You must not:"],
          list: [
            "Use the site in any way that violates applicable laws or regulations.",
            "Scrape, harvest, or systematically extract listing data or other content.",
            "Use IDX/MLS listing information for any purpose other than identifying prospective properties you may be interested in purchasing.",
            "Attempt to gain unauthorized access to any portion of the site or its systems.",
          ],
        },
        {
          heading: "Intellectual Property",
          paragraphs: [
            `Except for MLS listing content (which remains the property of its respective owners), the content, design, and branding of this website are the property of ${name} or its licensors and may not be reproduced without permission. ${REALTOR_MARK_NOTICE}`,
          ],
        },
        {
          heading: "Property Listings and MLS/IDX Data",
          paragraphs: [
            `Listing information on this site is provided in part through the Internet Data Exchange (IDX) program of ${mls}. ${mlsDisclaimerFor(content)}`,
          ],
        },
        {
          heading: "No Professional Advice",
          paragraphs: [
            "Content on this website is for general informational purposes only and does not constitute legal, tax, financial, or investment advice. Consult appropriate professionals before making real estate decisions.",
          ],
        },
        {
          heading: "Limitation of Liability",
          paragraphs: [
            `To the fullest extent permitted by law, ${name} shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of this website or reliance on its content.`,
          ],
        },
        {
          heading: "Governing Law",
          paragraphs: [
            `These terms are governed by the laws of ${law}, without regard to conflict-of-law principles.`,
          ],
        },
        {
          heading: "Contact",
          paragraphs: [contactLine],
        },
      ],
    },
    {
      slug: "accessibility",
      title: "Accessibility Statement",
      updated,
      sections: [
        {
          paragraphs: [
            `${name} is committed to providing a website that is accessible to the widest possible audience, regardless of technology or ability. We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA.`,
          ],
        },
        {
          heading: "Measures We Take",
          paragraphs: ["Accessibility practices on this site include:"],
          list: [
            "Semantic HTML landmarks and a logical heading structure.",
            "Text alternatives for meaningful images.",
            "Sufficient color contrast between text and backgrounds.",
            "Keyboard operability for interactive elements.",
            "Reduced-motion support that honors your operating system preference.",
          ],
        },
        {
          heading: "Known Limitations",
          paragraphs: [
            "Some content is supplied by third parties, including MLS listing data and photographs, and may not fully meet accessibility standards. We work to remediate issues within our control as they are identified.",
          ],
        },
        {
          heading: "Feedback",
          paragraphs: [
            `If you experience difficulty accessing any part of this website, please contact us${content.contact?.phone ? ` at ${content.contact.phone}` : ""}${content.contact?.email ? ` or ${content.contact.email}` : ""}. Please describe the issue and any assistive technology you use. We aim to respond within 2-3 business days and to provide the information you need through an alternative method where possible.`,
          ],
        },
      ],
    },
    {
      slug: "fair-housing",
      title: "Fair Housing Statement",
      updated,
      sections: [
        {
          paragraphs: [
            `${name} supports and complies with the Fair Housing Act (Title VIII of the Civil Rights Act of 1968), as amended, which prohibits discrimination in the sale, rental, and financing of housing based on race, color, religion, sex, disability, familial status, or national origin.`,
            FAIR_HOUSING_PLEDGE,
          ],
        },
        {
          heading: "Our Practices",
          paragraphs: [
            "We provide equal professional service to every client and customer without regard to any protected characteristic, honor requests for reasonable accommodations and modifications, and present all available options in a client's chosen areas and price range.",
          ],
        },
        {
          heading: "Reporting Discrimination",
          paragraphs: [
            `If you believe you have experienced housing discrimination, you may file a complaint with the U.S. Department of Housing and Urban Development (HUD) at hud.gov/fairhousing or 1-800-669-9777${agency ? `, or with the ${agency}` : ""}. Complaints must generally be filed within one year of the alleged discrimination.`,
          ],
        },
        {
          heading: "MLS and Listing Data",
          paragraphs: [mlsDisclaimerFor(content)],
        },
      ],
    },
  ];
}
