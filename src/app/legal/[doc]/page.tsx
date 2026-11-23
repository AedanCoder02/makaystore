import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Footer from '@/components/Footer';
import '@/styles/legal.css';

const DOCS = ['privacy', 'terms', 'cookies'] as const;
type Doc = (typeof DOCS)[number];
interface Section { h: string; p: string[] }

export function generateStaticParams() {
  return DOCS.map(doc => ({ doc }));
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  if (!DOCS.includes(doc as Doc)) notFound();
  const t = await getTranslations('legal');
  const sections = t.raw(`${doc}.sections`) as Section[];

  return (
    <>
      <main className="legal">
        <header className="legal-head">
          <p className="legal-eyebrow">Makay Beach Club</p>
          <h1>{t(`${doc}.title`)}</h1>
          <p className="legal-updated">{t('updated', { date: t('updatedDate') })}</p>
          <p className="legal-intro">{t(`${doc}.intro`)}</p>
        </header>

        <div className="legal-body">
          <nav className="legal-toc" aria-label={t('tocLabel')}>
            <ol>
              {sections.map((s, i) => <li key={i}><a href={`#s${i + 1}`}>{s.h}</a></li>)}
            </ol>
            <div className="legal-switch">
              {DOCS.filter(d => d !== doc).map(d => <Link key={d} href={`/legal/${d}`}>{t(`${d}.title`)}</Link>)}
            </div>
          </nav>
          <article>
            {sections.map((s, i) => (
              <section key={i} id={`s${i + 1}`} className="legal-section" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                <h2><span>{String(i + 1).padStart(2, '0')}</span>{s.h}</h2>
                {s.p.map((para, j) => <p key={j}>{para}</p>)}
              </section>
            ))}
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
