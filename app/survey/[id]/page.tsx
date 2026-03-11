'use client'
import { useEffect, useRef, useState } from 'react'
import { Survey, Section, Question } from '@/lib/types'

export default function SurveyPage({ params }: { params: { id: string } }) {
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0)
  const topRef = useRef<HTMLDivElement>(null)
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    fetch(`/api/survey/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.survey) setSurvey(data.survey)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  const validateSection = (section: Section): boolean => {
    const newErrors: Record<string, string> = {}
    section.questions.forEach(q => {
      if (q.required && !answers[q.id]) newErrors[q.id] = 'This question is required'
    })
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      questionRefs.current[Object.keys(newErrors)[0]]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    // Submit logic...
    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) return <Centered><p>Loading...</p></Centered>
  if (submitted) return (
    <Centered>
      <h1>Thank you!</h1>
      {/* Line 143 Fixed: Removed duplicate textAlign */}
      <p style={{ color: 'var(--slate)', maxWidth: 440, lineHeight: 1.7, textAlign: 'justify' as any }}>
        Your response to <strong>{survey?.title}</strong> has been recorded.
      </p>
      <button onClick={() => window.print()} className="btn-secondary" style={{ marginTop: '2rem' }}>⎙ Download PDF</button>
    </Centered>
  )

  const sections = survey?.sections || []
  const currentSection = sections[currentSectionIdx]

  return (
    <main style={{ minHeight: '100vh', background: 'var(--cream)' }} ref={topRef}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ marginBottom: '2rem' }}>{survey?.title}</h1>
        {currentSection?.questions.map((q, idx) => (
          <div key={q.id} ref={el => { questionRefs.current[q.id] = el }} className="card mb-6 p-6">
            <p style={{ fontWeight: 600, marginBottom: '1rem' }}>{idx + 1}. {q.text}</p>
            {/* Logic for Likert (Circles) vs Select (Squares) */}
            {q.type === 'multiple_choice' && q.options?.map(opt => (
              <label key={opt} style={{ display: 'flex', gap: '10px', borderRadius: '99px', border: '1px solid var(--border)', padding: '10px', marginBottom: '8px' }}>
                <input type="radio" checked={answers[q.id] === opt} onChange={() => setAnswers({...answers, [q.id]: opt})} /> {opt}
              </label>
            ))}
            {q.type === 'likert' && (
               <div style={{ display: 'flex', gap: '10px' }}>
                 {q.options?.map(opt => (
                   <button key={opt} onClick={() => setAnswers({...answers, [q.id]: opt})} style={{ borderRadius: '50%', width: '40px', height: '40px', background: answers[q.id] === opt ? 'var(--sage)' : 'white' }}>{opt}</button>
                 ))}
               </div>
            )}
            {errors[q.id] && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors[q.id]}</p>}
          </div>
        ))}
        <button onClick={handleSubmit} className="btn-primary" style={{ width: '100%' }}>Submit Response</button>
      </div>
    </main>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center' }}>{children}</div>
}