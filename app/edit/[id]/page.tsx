'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Section, Survey } from '@/lib/types'
import QuestionEditor from '@/components/QuestionEditor'

export default function EditSurveyPage({ params }: { params: { id: string } }) {
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [sections, setSections] = useState<Section[]>([])
  const [surveyTitle, setSurveyTitle] = useState('')
  const [surveyDesc, setSurveyDesc] = useState('')
  const [collectEmail, setCollectEmail] = useState(false)
  const [contactPerson, setContactPerson] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  useEffect(() => {
    fetch(`/api/survey/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.survey) {
          const s = data.survey
          setSurvey(s)
          setSurveyTitle(s.title || '')
          setSurveyDesc(s.description || '')
          setSections(s.sections || (s.questions ? [{ title: 'Questions', questions: s.questions }] : []))
          setCollectEmail(s.collectEmail || false)
          setContactPerson(s.contactPerson || '')
          setContactEmail(s.contactEmail || '')
          setContactPhone(s.contactPhone || '')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  const save = async () => {
    if (!surveyTitle.trim()) { setError('Please add a title'); return }
    setSaving(true); setError(''); setSaved(false)
    try {
      const res = await fetch('/api/survey-update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId: params.id, title: surveyTitle, description: surveyDesc, sections, collectEmail, contactPerson, contactEmail, contactPhone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}><p style={{ color: 'var(--slate)' }}>Loading survey…</p></div>
  if (!survey) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', flexDirection: 'column', gap: '1rem' }}><h1>Survey not found</h1><Link href="/dashboard" className="btn-primary">Back</Link></div>

  return (
    <main style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'white', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--sage)', textDecoration: 'none' }}>✦ SurveyAI</Link>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--slate)' }}>Editing: <strong style={{ color: 'var(--ink)' }}>{survey.title}</strong></span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {saved && <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>✓ Saved!</span>}
            <Link href={`/dashboard/${params.id}`} className="btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>← Back to Dashboard</Link>
            <button onClick={save} disabled={saving} className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2.5rem 2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Edit Survey</h1>
          <p style={{ color: 'var(--slate)', fontSize: '0.875rem' }}>Changes are saved when you click Save Changes. Respondents who already submitted are not affected.</p>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '1rem', color: '#dc2626', marginBottom: '1.5rem', fontSize: '0.9rem' }}>⚠ {error}</div>}

        {/* Title & Description */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Survey Title</label>
          <input className="input-field" value={surveyTitle} onChange={e => setSurveyTitle(e.target.value)} placeholder="Survey title" style={{ marginBottom: '1rem' }} />
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description / Introduction</label>
          <textarea className="input-field" value={surveyDesc} onChange={e => setSurveyDesc(e.target.value)} placeholder="Description shown to respondents" rows={4} style={{ textAlign: 'justify' }} />
        </div>

        <QuestionEditor sections={sections} setSections={setSections} />

        {/* Settings */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>⚙ Survey Settings</h3>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'var(--sage-light)', borderRadius: 12, marginBottom: '1.25rem' }}>
            <input type="checkbox" id="collectEmail2" checked={collectEmail} onChange={e => setCollectEmail(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--sage)', marginTop: 2 }} />
            <div>
              <label htmlFor="collectEmail2" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Collect respondent email address</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate)', marginTop: '0.2rem' }}>When enabled, an email field appears before the survey starts</p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--slate)' }}>Contact Person (optional)</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              {[['Name', contactPerson, setContactPerson, 'e.g. Maria Santos'], ['Email', contactEmail, setContactEmail, 'email@example.com'], ['Phone', contactPhone, setContactPhone, '+63 917 123 4567']].map(([label, val, setter, ph]) => (
                <div key={label as string}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: '0.3rem' }}>{label as string}</label>
                  <input className="input-field" value={val as string} onChange={e => (setter as any)(e.target.value)} placeholder={ph as string} style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <Link href={`/dashboard/${params.id}`} className="btn-secondary">Cancel</Link>
          <button onClick={save} disabled={saving} className="btn-primary" style={{ fontSize: '1rem', padding: '0.85rem 2rem', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </main>
  )
}
