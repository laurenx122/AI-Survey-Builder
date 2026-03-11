'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Survey } from '@/lib/types'

export default function DashboardPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchSurveys = () => {
    fetch('/api/publish')
      .then(r => r.json())
      .then(data => { setSurveys(data.surveys || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchSurveys() }, [])

  const toggleStatus = async (survey: Survey) => {
    setToggling(survey.id)
    const newStatus = survey.status === 'open' ? 'closed' : 'open'
    try {
      await fetch('/api/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId: survey.id, status: newStatus }),
      })
      setSurveys(prev => prev.map(s => s.id === survey.id ? { ...s, status: newStatus } : s))
    } catch (e) {
      alert('Failed to update status')
    } finally {
      setToggling(null)
    }
  }

  const copyLink = (surveyId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/survey/${surveyId}`)
    alert('Link copied!')
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'white', padding: '0 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--sage)', textDecoration: 'none' }}>
            ✦ SurveyAI
          </Link>
          <Link href="/builder" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
            + Create Survey
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2.5rem 2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>My Surveys</h1>
          <p style={{ color: 'var(--slate)' }}>{surveys.length} survey{surveys.length !== 1 ? 's' : ''} created</p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--slate)' }}>Loading your surveys…</div>
        )}

        {!loading && surveys.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>No surveys yet</h2>
            <p style={{ color: 'var(--slate)', marginBottom: '1.5rem' }}>Upload a document to create your first AI-generated survey</p>
            <Link href="/builder" className="btn-primary">Create Your First Survey</Link>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {surveys.map(survey => (
            <div key={survey.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{survey.title}</h3>
                  {survey.status === 'open' ? (
                    <span className="badge-open">
                      <span className="dot-open" />
                      Accepting Responses
                    </span>
                  ) : (
                    <span className="badge-closed">
                      🔒 Closed
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate)', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <span>📝 {survey.questions?.length || 0} questions</span>
                  <span>👥 {survey.responseCount || 0} responses</span>
                  <span>📅 {new Date(survey.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
                <button
                  onClick={() => copyLink(survey.id)}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  🔗 Copy Link
                </button>

                <Link href={`/dashboard/${survey.id}`} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  📊 Results
                </Link>

                <Link href={`/edit/${survey.id}`} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  ✏️ Edit
                </Link>

                <button
                  onClick={() => toggleStatus(survey)}
                  disabled={toggling === survey.id}
                  style={{
                    padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: 10, cursor: 'pointer',
                    border: '1.5px solid',
                    borderColor: survey.status === 'open' ? '#fecaca' : '#bbf7d0',
                    background: survey.status === 'open' ? '#fef2f2' : '#f0fdf4',
                    color: survey.status === 'open' ? '#dc2626' : '#16a34a',
                    fontWeight: 500, transition: 'all 0.15s',
                    opacity: toggling === survey.id ? 0.6 : 1,
                  }}
                >
                  {toggling === survey.id ? '…' : survey.status === 'open' ? '🔒 Close Survey' : '🔓 Open Survey'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
