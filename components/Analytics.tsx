"use client";

import Script from "next/script";
import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";
import { trackEvent } from "@/lib/analytics";
import { site } from "@/content/site";

// Env wins, config is the default: the Ads/GA ids are public values that ship
// in the page source anyway, so keeping them in config means tracking works on
// deploy without anyone editing Vercel.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || site.analytics?.ga4Id;
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || site.analytics?.googleAdsId;

/**
 * Tag loading + the site-wide conversion listeners.
 *
 * Nothing loads unless an id is configured, so a client repo with no ad account
 * ships zero third-party script and no cookie banner obligation.
 */
export default function Analytics() {
  useEffect(() => {
    // Must run before any form can submit, so the gclid is already stored
    captureAttribution();
  }, []);

  useEffect(() => {
    /*
     * One delegated listener instead of an onClick on every phone/email link.
     * Three separate widget surfaces each needing their own copy of the same
     * handler is exactly how the last tracking gap happened.
     *
     * composedPath() is the important part: IDX renders its widgets inside
     * shadow roots, and a click there arrives with event.target retargeted to
     * the custom element, so `closest("a")` on target finds nothing. The
     * composed path still contains the real anchor.
     */
    const onClick = (event: MouseEvent) => {
      const path = event.composedPath?.() ?? [];
      const anchor = path.find(
        (node): node is HTMLAnchorElement =>
          node instanceof HTMLAnchorElement && !!node.getAttribute("href"),
      );
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";

      if (href.startsWith("tel:")) {
        trackEvent("phone_click", {
          link_url: href,
          page_path: window.location.pathname,
        });
        return;
      }
      if (href.startsWith("mailto:")) {
        trackEvent("email_click", {
          link_url: href,
          page_path: window.location.pathname,
        });
        return;
      }
      // A listing card click inside an IDX widget: high-intent browsing, and
      // the only signal we get from inside the widget's shadow root.
      if (/^\/listing\//.test(href)) {
        const insideWidget = path.some(
          (node) =>
            node instanceof HTMLElement && node.tagName.toLowerCase().startsWith("idx-"),
        );
        trackEvent("listing_view", {
          listing_path: href,
          source: insideWidget ? "idx_widget" : "site",
        });
      }
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  if (!GTM_ID && !GA4_ID && !ADS_ID) return null;

  return (
    <>
      {GTM_ID && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      )}

      {/* Direct gtag, for setups that skip GTM. Safe alongside it: gtag and the
          GTM container both read the same dataLayer. */}
      {(GA4_ID || ADS_ID) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID || ADS_ID}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
${GA4_ID ? `gtag('config', '${GA4_ID}');` : ""}
${ADS_ID ? `gtag('config', '${ADS_ID}', { allow_enhanced_conversions: true });` : ""}`}
          </Script>
        </>
      )}

      {GTM_ID && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
      )}
    </>
  );
}
