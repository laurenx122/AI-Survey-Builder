'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { Section } from '@/lib/types'
import QuestionEditor from '@/components/QuestionEditor'

type Step = 'upload' | 'generating' | 'edit' | 'publishing' | 'done'

export default function BuilderPage() {
  const [step, setStep] = useState<Step>('upload')
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [surveyTitle, setSurveyTitle] = useState('')
  const [surveyDesc, setSurveyDesc] = useState('')
  const [sections, setSections] = useState<Section[]>([])
  const [collectEmail, setCollectEmail] = useState(false)
  const [contactPerson, setContactPerson] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [error, setError] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [surveyId, setSurveyId] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(''); setFileName(file.name); setStep('generating')
    const form = new FormData(); form.append('file', file)
    try {
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: form })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error)
      const genRes = await fetch('/api/generate-questions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: uploadData.text, fileName: file.name }),
      })
      const genData = await genRes.json()
      if (!genRes.ok) throw new Error(genData.error)
      setSurveyTitle(genData.survey.title || '')
      setSurveyDesc(genData.survey.description || '')
      setSections(genData.survey.sections || (genData.survey.questions ? [{ title: 'Questions', questions: genData.survey.questions }] : []))
      setStep('edit')
    } catch (e: any) { setError(e.message || 'Something went wrong.'); setStep('upload') }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }

  const publish = async () => {
    if (!surveyTitle.trim()) { setError('Please add a title'); return }
    setError(''); setStep('publishing')
    try {
      const res = await fetch('/api/publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: surveyTitle, description: surveyDesc, sections, collectEmail, contactPerson, contactEmail, contactPhone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShareLink(`${window.location.origin}/survey/${data.surveyId}`)
      setSurveyId(data.surveyId); setStep('done')
    } catch (e: any) { setError(e.message); setStep('edit') }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'white', padding: '0 2rem' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--sage)', textDecoration: 'none' }}>✦ SurveyAI</Link>
          <Link href="/dashboard" className="btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>My Surveys</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2.5rem 2rem' }}>
        {/* Steps */}
        {step !== 'done' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
            {['Upload', 'Edit Questions', 'Publish'].map((label, i) => {
              const isActive = (step === 'upload' || step === 'generating') && i === 0 || step === 'edit' && i === 1 || step === 'publishing' && i === 2
              const isDone = i === 0 && (step === 'edit' || step === 'publishing') || i === 1 && step === 'publishing'
              return (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: isDone ? 'var(--sage)' : isActive ? 'var(--ink)' : 'var(--border)', color: isDone || isActive ? 'white' : 'var(--slate)', fontWeight: 700, fontSize: '0.75rem' }}>{isDone ? '✓' : i + 1}</span>
                  <span style={{ color: isActive ? 'var(--ink)' : 'var(--slate)', fontWeight: isActive ? 600 : 400 }}>{label}</span>
                  {i < 2 && <span style={{ color: 'var(--border)', margin: '0 0.1rem' }}>—</span>}
                </span>
              )
            })}
          </div>
        )}

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '1rem 1.25rem', color: '#dc2626', marginBottom: '1.5rem', fontSize: '0.9rem' }}>⚠ {error}</div>}

        {/* UPLOAD */}
        {step === 'upload' && (
          <div className="fade-in">
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create a Survey</h1>
            <p style={{ color: 'var(--slate)', marginBottom: '2rem' }}>Upload your document — AI reads every section and copies questions exactly</p>
            <div onClick={() => fileRef.current?.click()} onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
              style={{ border: `2px dashed ${dragOver ? 'var(--sage)' : 'var(--border)'}`, borderRadius: 20, padding: '4rem 2rem', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'var(--sage-light)' : 'white', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Drop your file here</h2>
              <p style={{ color: 'var(--slate)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Supports PDF, DOCX, and TXT files</p>
              <button className="btn-primary" type="button" style={{ pointerEvents: 'none' }}>Browse Files</button>
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
          </div>
        )}

        {/* GENERATING */}
        {step === 'generating' && (
          <div className="fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🤖</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Reading your document…</h2>
            <p style={{ color: 'var(--slate)', marginBottom: '2rem' }}>Gemini AI is analyzing <strong>{fileName}</strong></p>
            <div style={{ width: 200, height: 6, background: 'var(--border)', borderRadius: 3, margin: '0 auto', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--sage)', borderRadius: 3, animation: 'loading 2.5s ease-in-out infinite' }} />
            </div>
            <style>{`@keyframes loading{0%{width:0}85%{width:90%}100%{width:90%}}`}</style>
          </div>
        )}

        {/* EDIT */}
        {step === 'edit' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Edit Your Survey</h1>
                <p style={{ color: 'var(--slate)', fontSize: '0.9rem' }}>{sections.length} sections from <strong>{fileName}</strong></p>
                <p style={{ color: 'var(--slate)', fontSize: '0.82rem', marginTop: '0.25rem' }}>💡 Drag to reorder · + to insert · ✕ to delete</p>
              </div>
              <button onClick={publish} className="btn-primary">Publish Survey →</button>
            </div>

            {/* Title & Description */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Survey Title</label>
              <input className="input-field" value={surveyTitle} onChange={e => setSurveyTitle(e.target.value)} placeholder="Survey title" style={{ marginBottom: '1rem' }} />
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description / Introduction</label>
              <textarea className="input-field" value={surveyDesc} onChange={e => setSurveyDesc(e.target.value)} placeholder="Brief description shown to respondents" rows={4} style={{ textAlign: 'justify' }} />
            </div>

            <QuestionEditor sections={sections} setSections={setSections} />

            {/* Settings */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--ink)' }}>⚙ Survey Settings</h3>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'var(--sage-light)', borderRadius: 12, marginBottom: '1.25rem' }}>
                <input type="checkbox" id="collectEmail" checked={collectEmail} onChange={e => setCollectEmail(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--sage)', marginTop: 2 }} />
                <div>
                  <label htmlFor="collectEmail" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Collect respondent email address</label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--slate)', marginTop: '0.2rem' }}>When enabled, an email field will appear before the survey starts</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--slate)' }}>Contact Person (optional — shown at the end of the survey)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: '0.3rem' }}>Name</label>
                    <input className="input-field" value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="e.g. Maria Santos" style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: '0.3rem' }}>Email</label>
                    <input className="input-field" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="email@example.com" style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: '0.3rem' }}>Phone</label>
                    <input className="input-field" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+63 917 123 4567" style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button onClick={publish} className="btn-primary" style={{ fontSize: '1rem', padding: '0.85rem 2rem' }}>Publish Survey →</button>
            </div>
          </div>
        )}

        {step === 'publishing' && (
          <div className="fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🚀</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Publishing your survey…</h2>
          </div>
        )}

        {step === 'done' && (
          <div className="fade-in" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎉</div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Survey is live!</h1>
            <p style={{ color: 'var(--slate)', marginBottom: '2rem' }}>Share this link with your respondents</p>
            <div style={{ background: 'white', border: '1.5px solid var(--sage)', borderRadius: 14, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: 520, margin: '0 auto 2rem', flexWrap: 'wrap' }}>
              <span style={{ flex: 1, fontSize: '0.9rem', wordBreak: 'break-all' }}>{shareLink}</span>
              <button className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }} onClick={() => { navigator.clipboard.writeText(shareLink); alert('Copied!') }}>Copy Link</button>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href={`/dashboard/${surveyId}`} className="btn-primary">View Dashboard</Link>
              <Link href="/builder" className="btn-secondary">Create Another</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
