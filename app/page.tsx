'use client'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Nav */}
      <nav style={{ 
        borderBottom: '1px solid var(--border)', 
        background: 'white',
        padding: '0 2rem'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--sage)' }}>
            ✦ SurveyAI
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/dashboard" className="btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
              Dashboard
            </Link>
            <Link href="/builder" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
              Create Survey
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '6rem 2rem 4rem', textAlign: 'center' }}>
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--sage-light)', color: 'var(--sage)',
          padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 500,
          marginBottom: '2rem'
        }}>
          <span>✦</span> AI-Powered Survey Generation
        </div>

        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginBottom: '1.5rem', color: 'var(--ink)' }}>
          Upload a doc.<br />
          <span style={{ color: 'var(--sage)', fontStyle: 'italic' }}>Get a survey instantly.</span>
        </h1>

        <p style={{ fontSize: '1.15rem', color: 'var(--slate)', maxWidth: 560, margin: '0 auto 3rem', lineHeight: 1.7 }}>
          Upload any PDF or Word document. Our AI reads it and generates professional survey questions automatically. Share the link. Collect responses. Get AI-powered insights.
        </p>

        <Link href="/builder" className="btn-primary" style={{ fontSize: '1.05rem', padding: '0.85rem 2.5rem' }}>
          Start Building →
        </Link>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 2rem 6rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: '3rem', color: 'var(--ink)' }}>
          How it works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {[
            { step: '01', icon: '📄', title: 'Upload Document', desc: 'Drop in any PDF, Word doc, or text file about your topic' },
            { step: '02', icon: '🤖', title: 'AI Generates Questions', desc: 'Claude AI reads your doc and creates relevant survey questions' },
            { step: '03', icon: '✏️', title: 'Edit & Customize', desc: 'Review, edit, add or remove questions before publishing' },
            { step: '04', icon: '🔗', title: 'Share the Link', desc: 'Get a unique shareable link — open or close it anytime' },
            { step: '05', icon: '📊', title: 'Analyze Results', desc: 'View responses, download Excel, get AI insights' },
          ].map(item => (
            <div key={item.step} className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{item.icon}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sage)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                STEP {item.step}
              </div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--slate)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem', textAlign: 'center', color: 'var(--slate)', fontSize: '0.875rem' }}>
        Built with Next.js · MongoDB · Claude AI
      </footer>
    </main>
  )
}
