import type { SiteContent } from "@/content/site";

/*
 * First-visit intro: a 3-second brand moment (O Group ring, the agent's name,
 * the brokerage wordmark) over a glowing red orb, after Delphi's loading
 * screen on Mobbin.
 *
 * The markup ships in every page's HTML but is display:none until
 * INTRO_SCRIPT (inlined in <head>) sets html[data-intro="play"] before first
 * paint. The script owns the whole timeline, so the intro never waits on
 * React hydration, and a visitor who has seen it once never gets a flash of
 * it. It is skipped for prefers-reduced-motion, on /client-portal, and when
 * storage is unavailable (better no intro than one on every page). Any click
 * or key press skips it. Append ?intro=1 to any URL to replay it.
 */

const STORAGE_KEY = "ad-intro-seen";
const LEAVE_AT_MS = 2400; // fade-out starts; the page's own load-in resumes
const DONE_AT_MS = 3000; // overlay removed

export const INTRO_SCRIPT = `(function(){try{
var d=document.documentElement,l=location;
if(l.pathname.indexOf("/client-portal")===0)return;
var force=/[?&]intro=1(&|$)/.test(l.search);
if(!force&&(localStorage.getItem("${STORAGE_KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches))return;
localStorage.setItem("${STORAGE_KEY}","1");
d.setAttribute("data-intro","play");
function leave(){if(d.getAttribute("data-intro")==="play"){d.setAttribute("data-intro","leaving");setTimeout(done,${DONE_AT_MS - LEAVE_AT_MS});}}
function done(){d.setAttribute("data-intro","done");}
setTimeout(leave,${LEAVE_AT_MS});
addEventListener("pointerdown",leave,{once:true});
addEventListener("keydown",leave,{once:true});
}catch(e){}})();`;

export default function IntroSplash({ content }: { content: SiteContent }) {
  const { brand } = content;
  return (
    <div className="intro" aria-hidden="true">
      <div className="intro__orb" />
      <div className="intro__lines" />
      <div className="intro__content">
        {brand.emblem && <img className="intro__emblem" src={brand.emblem} alt="" width={400} height={376} />}
        <p className="intro__name">{brand.name}</p>
        {brand.brokerageLogo && (
          <img className="intro__wordmark" src={brand.brokerageLogo.light} alt="" width={1148} height={97} />
        )}
      </div>
    </div>
  );
}
