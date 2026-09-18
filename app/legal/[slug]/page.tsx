import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteChrome from "@/components/SiteChrome";
import { site } from "@/content/site";
import { legalDocs } from "@/lib/legal";

export function generateStaticParams() {
  return legalDocs(site).map((doc) => ({ slug: doc.slug }));
}

export const dynamicParams = false;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const doc = legalDocs(site).find((d) => d.slug === slug);
  return { title: doc ? `${doc.title} – ${site.brand.name}` : site.meta.title };
}

export default async function LegalPage({ params }: Params) {
  const { slug } = await params;
  const doc = legalDocs(site).find((d) => d.slug === slug);
  if (!doc) notFound();

  return (
    <SiteChrome content={site}>
      <article className="legal-doc">
        <header className="legal-doc__head">
          <div className="lp-container">
            <h1 className="lp-h2">{doc.title}</h1>
            {doc.updated && <p className="legal-doc__updated">Last updated {doc.updated}</p>}
          </div>
        </header>
        <div className="lp-container legal-doc__body">
          {doc.sections.map((section, i) => (
            <section key={i}>
              {section.heading && <h2>{section.heading}</h2>}
              {section.paragraphs.map((text, j) => (
                <p key={j}>{text}</p>
              ))}
              {section.list && (
                <ul>
                  {section.list.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>
    </SiteChrome>
  );
}
