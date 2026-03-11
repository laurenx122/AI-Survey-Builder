'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Survey, Section, Question, SurveyResponse } from '@/lib/types'
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InsightSection {
  title: string
  avgKnowledge: number
  avgPractice: number
  insight: string
  keyGap: string
}
interface Analysis {
  executiveSummary: string
  overallESGScore: number
  scoreInterpretation: string
  sections: InsightSection[]
  topStrengths: { title: string; description: string }[]
  areasForImprovement: { title: string; description: string }[]
  recommendations: { number: number; title: string; description: string }[]
  qualitativeThemes: { theme: string; summary: string }[]
  researchObjectiveAnswer: string
}

const SECTION_COLORS = ['#4a7c6f', '#2563eb', '#7c3aed', '#b45309', '#dc2626']
const SECTION_LIGHT = ['#e8f0ee', '#dbeafe', '#ede9fe', '#fef3c7', '#fee2e2']


function ScoreBar({ value, max = 4, color = '#4a7c6f' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ flex: 1, height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 1s ease' }} />
      </div>
      <span style={{ fontSize: '0.875rem', fontWeight: 700, color, minWidth: 36 }}>{value.toFixed(1)}</span>
    </div>
  )
}

function RadialScore({ score, max = 4 }: { score: number; max?: number }) {
  const pct = score / max
  const r = 54
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  const color = score >= 3 ? '#4a7c6f' : score >= 2 ? '#d4852a' : '#ef4444'
  const label = score >= 3 ? 'Good' : score >= 2 ? 'Fair' : 'Needs Work'
  return (
    <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto' }}>
      <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={70} cy={70} r={r} fill="none" stroke="#f1f5f9" strokeWidth={12} />
        <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={12}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 800, color, lineHeight: 1 }}>{score.toFixed(1)}</span>
        <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>out of 4</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color, marginTop: 2 }}>{label}</span>
      </div>
    </div>
  )
}

function KPBar({ label, knowledge, practice, color, lightColor }: { label: string; knowledge: number; practice: number; color: string; lightColor: string }) {
  const gap = Math.abs(knowledge - practice)
  return (
    <div style={{ background: lightColor, borderRadius: 14, padding: '1.1rem 1.25rem', border: `1px solid ${color}30` }}>
      <p style={{ fontWeight: 700, fontSize: '0.875rem', color, marginBottom: '0.75rem' }}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
          <span style={{ width: 90, color: '#475569', fontWeight: 600 }}>Knowledge</span>
          <div style={{ flex: 1, height: 8, background: 'white', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${(knowledge / 4) * 100}%`, height: '100%', background: color, borderRadius: 99 }} />
          </div>
          <span style={{ fontWeight: 700, color, minWidth: 28 }}>{knowledge.toFixed(1)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
          <span style={{ width: 90, color: '#475569', fontWeight: 600 }}>Practice</span>
          <div style={{ flex: 1, height: 8, background: 'white', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${(practice / 4) * 100}%`, height: '100%', background: color + 'aa', borderRadius: 99 }} />
          </div>
          <span style={{ fontWeight: 700, color: color + 'cc', minWidth: 28 }}>{practice.toFixed(1)}</span>
        </div>
        {gap > 0.3 && (
          <div style={{ marginTop: '0.3rem', fontSize: '0.73rem', color: '#b45309', background: '#fef3c7', borderRadius: 6, padding: '0.2rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            ⚠ Gap of {gap.toFixed(1)} — knowledge exceeds practice
          </div>
        )}
      </div>
    </div>
  )
}



export default function SurveyDashboardPage({ params }: { params: { id: string } }) {
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [activeTab, setActiveTab] = useState<'responses' | 'insights'>('responses')
  const [insightError, setInsightError] = useState('')
  const [responsePage, setResponsePage] = useState(1)
  const RESPONSES_PER_PAGE = 5

  useEffect(() => {
    fetch(`/api/responses?surveyId=${params.id}`)
      .then(r => r.json())
      .then(data => { setSurvey(data.survey); setResponses(data.responses || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  const saveAsPDF = async () => {
  const reportElement = document.getElementById('insights-report');
  if (!reportElement || !survey) return;

  const pdf = new jsPDF('p', 'px', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 30; 
  const contentWidth = pdfWidth - (margin * 2);
  
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  
  const splitTitle = pdf.splitTextToSize(survey.title.toUpperCase(), contentWidth);
  pdf.text(splitTitle, margin, margin + 10);
  
  const titleHeight = splitTitle.length * 20; 

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  const dateStr = `Report Generated: ${new Date().toLocaleString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  })}`;
  
  pdf.text(dateStr, margin, margin + titleHeight + 5);
  
  pdf.setDrawColor(200);
  pdf.line(margin, margin + titleHeight + 15, pdfWidth - margin, margin + titleHeight + 15);

  let currentY = margin + titleHeight + 30; 

  const sections = Array.from(reportElement.children);

  for (const section of sections) {
    if (section.classList.contains('no-print')) continue;

    const canvas = await html2canvas(section as HTMLElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const scaledHeight = (imgHeight * contentWidth) / imgWidth;

    // 3. Page Break Logic for Section Integrity
    if (currentY + scaledHeight > pdfHeight - margin) {
      pdf.addPage();
      currentY = margin; 
    }

    pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, scaledHeight);
    currentY += scaledHeight + 15; 
  }

  pdf.save(`${survey.title.replace(/\s+/g, '-')}-AI-Analysis.pdf`);
};

  const getSections = (): Section[] => {
    if (!survey) return []
    if (survey.sections?.length) return survey.sections
    if (survey.questions) return [{ title: 'Questions', questions: survey.questions }]
    return []
  }

  const getAllQuestions = (): Question[] =>
    getSections().flatMap(s => s.questions.filter(q => q.type !== 'scale_info'))

  const toggleStatus = async () => {
    if (!survey) return
    setToggling(true)
    const newStatus = survey.status === 'open' ? 'closed' : 'open'
    try {
      await fetch('/api/toggle-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ surveyId: params.id, status: newStatus }) })
      setSurvey(prev => prev ? { ...prev, status: newStatus } : prev)
    } catch { alert('Failed to update') } finally { setToggling(false) }
  }

  const generateInsights = async () => {
    setLoadingInsights(true)
    setInsightError('')
    setActiveTab('insights')
    try {
      const res = await fetch('/api/insights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ surveyId: params.id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnalysis(data.analysis)
      setChartData(data.chartData || [])
    } catch (e: any) {
      setInsightError(e.message || 'Failed to generate insights')
    } finally { setLoadingInsights(false) }
  }

  const downloadExcel = async () => {
    if (!survey || responses.length === 0) return
    const XLSX = await import('xlsx')
    const allQuestions = getAllQuestions()
    const headers: string[] = ['Response #', 'Submitted At']
    allQuestions.forEach(q => {
      if (q.type === 'matrix' && q.columns) q.columns.forEach(col => headers.push(`${q.text.substring(0, 40)}… [${col.label}]`))
      else headers.push(q.text.substring(0, 60))
    })
    const rows = responses.map((r, i) => {
      const row: any[] = [i + 1, new Date(r.submittedAt).toLocaleString()]
      allQuestions.forEach(q => {
        const ans = r.answers[q.id]
        if (q.type === 'matrix' && q.columns) q.columns.forEach(col => row.push(ans && typeof ans === 'object' ? (ans as any)[col.key] || '' : ''))
        else row.push(Array.isArray(ans) ? ans.join(', ') : (ans as string) || '')
      })
      return row
    })
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Responses')
    XLSX.writeFile(wb, `${survey.title.replace(/\s+/g, '-')}-responses.xlsx`)
  }

  const copyLink = () => { navigator.clipboard.writeText(`${window.location.origin}/survey/${params.id}`); alert('Link copied!') }

  const formatAnswer = (q: Question, ans: any): string => {
    if (!ans) return '—'
    if (q.type === 'matrix' && q.columns && typeof ans === 'object') {
      return q.columns.map(col => {
        const val = ans[col.key]
        const label = col.scale?.find((s: any) => String(s.value) === String(val))?.label || val
        return `${col.label}: ${val} (${label})`
      }).join(' · ')
    }
    if (Array.isArray(ans)) return ans.join(', ')
    return String(ans)
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}><p style={{ color: 'var(--slate)' }}>Loading…</p></div>
  if (!survey) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', flexDirection: 'column', gap: '1rem' }}><h1>Survey not found</h1><Link href="/dashboard" className="btn-primary">Back</Link></div>

  return (
    <main style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'white', padding: '0 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--sage)', textDecoration: 'none' }}>✦ SurveyAI</Link>
          <Link href="/dashboard" className="btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>← All Surveys</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.75rem' }}>{survey.title}</h1>
              {survey.status === 'open' ? <span className="badge-open"><span className="dot-open" />Accepting Responses</span> : <span className="badge-closed">🔒 Closed</span>}
            </div>
            <p style={{ color: 'var(--slate)', fontSize: '0.9rem' }}>Created {new Date(survey.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={copyLink} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>🔗 Copy Link</button>
            <Link href={`/edit/${params.id}`} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>✏️ Edit Survey</Link>
            <button onClick={toggleStatus} disabled={toggling} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${survey.status === 'open' ? '#fecaca' : '#bbf7d0'}`, background: survey.status === 'open' ? '#fef2f2' : '#f0fdf4', color: survey.status === 'open' ? '#dc2626' : '#16a34a', fontWeight: 500, opacity: toggling ? 0.6 : 1 }}>
              {toggling ? '…' : survey.status === 'open' ? '🔒 Close Survey' : '🔓 Open Survey'}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Responses', value: responses.length, icon: '👥' },
            { label: 'Sections', value: getSections().filter(s => s.title).length, icon: '📂' },
            { label: 'Questions', value: getAllQuestions().length, icon: '📝' },
            { label: 'Status', value: survey.status === 'open' ? 'Open' : 'Closed', icon: survey.status === 'open' ? '🟢' : '🔴' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--slate)', marginTop: '0.2rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
          {(['responses', 'insights'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === tab ? 'var(--ink)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--slate)', fontWeight: activeTab === tab ? 600 : 400, fontSize: '0.9rem', transition: 'all 0.15s' }}>
              {tab === 'responses' ? `📋 Responses (${responses.length})` : '📊 AI Insights'}
            </button>
          ))}
          {activeTab === 'responses' && responses.length > 0 && (
            <button onClick={downloadExcel} className="btn-secondary" style={{ marginLeft: 'auto', fontSize: '0.85rem', padding: '0.4rem 1rem' }}>⬇ Download Excel</button>
          )}
          {activeTab === 'insights' && (
            <button onClick={generateInsights} disabled={loadingInsights || responses.length === 0} className="btn-primary" style={{ marginLeft: 'auto', fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
              {loadingInsights ? '…Analyzing' : analysis ? '↺ Regenerate' : '✦ Generate Insights'}
            </button>
          )}
        </div>

        {/* RESPONSES TAB */}
        {activeTab === 'responses' && (
          <div className="fade-in">
            {responses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
                <p>No responses yet. Share your survey link!</p>
                <button onClick={copyLink} className="btn-primary" style={{ marginTop: '1rem' }}>Copy Share Link</button>
              </div>
            ) : (() => {
              const totalPages = Math.ceil(responses.length / RESPONSES_PER_PAGE)
              const paged = responses.slice((responsePage - 1) * RESPONSES_PER_PAGE, responsePage * RESPONSES_PER_PAGE)
              return (
                <div>
                  {/* Pagination top */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--slate)' }}>
                      Showing {(responsePage - 1) * RESPONSES_PER_PAGE + 1}–{Math.min(responsePage * RESPONSES_PER_PAGE, responses.length)} of {responses.length} responses
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button onClick={() => setResponsePage(p => Math.max(1, p - 1))} disabled={responsePage === 1}
                        style={{ padding: '0.35rem 0.85rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'white', cursor: responsePage === 1 ? 'not-allowed' : 'pointer', opacity: responsePage === 1 ? 0.4 : 1, fontSize: '0.875rem' }}>← Prev</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setResponsePage(p)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${p === responsePage ? 'var(--sage)' : 'var(--border)'}`, background: p === responsePage ? 'var(--sage)' : 'white', color: p === responsePage ? 'white' : 'var(--ink)', cursor: 'pointer', fontWeight: p === responsePage ? 700 : 400, fontSize: '0.875rem' }}>{p}</button>
                      ))}
                      <button onClick={() => setResponsePage(p => Math.min(totalPages, p + 1))} disabled={responsePage === totalPages}
                        style={{ padding: '0.35rem 0.85rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'white', cursor: responsePage === totalPages ? 'not-allowed' : 'pointer', opacity: responsePage === totalPages ? 0.4 : 1, fontSize: '0.875rem' }}>Next →</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {paged.map((response, rIdx) => {
                      const globalIdx = (responsePage - 1) * RESPONSES_PER_PAGE + rIdx
                      return (
                        <div key={String(response._id)} className="card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600 }}>Response #{responses.length - globalIdx}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--slate)' }}>{new Date(response.submittedAt).toLocaleString()}</span>
                          </div>
                          {(response as any).respondentEmail && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--slate)', marginBottom: '0.75rem' }}>✉ {(response as any).respondentEmail}</p>
                          )}
                          {getSections().map((section, sIdx) => (
                            <div key={sIdx} style={{ marginBottom: '1rem' }}>
                              {section.title && <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{section.title}</p>}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {section.questions.filter(q => q.type !== 'scale_info').map(q => (
                                  <div key={q.id} style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                                    <div style={{ fontWeight: 600, color: 'var(--slate)', fontSize: '0.73rem', marginBottom: '0.2rem' }}>{q.text}</div>
                                    <div style={{ color: 'var(--ink)' }}>{formatAnswer(q, response.answers[q.id])}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                  {/* Pagination bottom */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                      <button onClick={() => setResponsePage(p => Math.max(1, p - 1))} disabled={responsePage === 1}
                        style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'white', cursor: responsePage === 1 ? 'not-allowed' : 'pointer', opacity: responsePage === 1 ? 0.4 : 1 }}>← Prev</button>
                      <button onClick={() => setResponsePage(p => Math.min(totalPages, p + 1))} disabled={responsePage === totalPages}
                        style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'white', cursor: responsePage === totalPages ? 'not-allowed' : 'pointer', opacity: responsePage === totalPages ? 0.4 : 1 }}>Next →</button>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === 'insights' && (
          <div className="fade-in">
            {/* Loading state */}
            {loadingInsights && (
              <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>📊</div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>Analyzing your responses…</h2>
                <p style={{ color: 'var(--slate)', marginBottom: '2rem' }}>Gemini AI is computing scores, finding patterns, and building your report</p>
                <div style={{ width: 220, height: 6, background: 'var(--border)', borderRadius: 3, margin: '0 auto', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--sage)', borderRadius: 3, animation: 'loading 2.5s ease-in-out infinite' }} />
                </div>
                <style>{`@keyframes loading{0%{width:0}85%{width:90%}100%{width:90%}}`}</style>
              </div>
            )}

            {/* Error */}
            {insightError && !loadingInsights && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '1.5rem', color: '#dc2626', textAlign: 'center' }}>
                <p style={{ fontWeight: 600 }}>Could not generate insights</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>{insightError}</p>
                <button onClick={generateInsights} className="btn-primary" style={{ marginTop: '1rem' }}>Try Again</button>
              </div>
            )}

            {/* Empty prompt */}
            {!loadingInsights && !analysis && !insightError && (
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>Ready to generate your report</h2>
                <p style={{ color: 'var(--slate)', marginBottom: '2rem', maxWidth: 420, margin: '0 auto 2rem' }}>
                  {responses.length === 0 ? 'You need at least one response before generating insights.' : `Click below to analyze all ${responses.length} response${responses.length > 1 ? 's' : ''} with AI and get charts, scores, and recommendations.`}
                </p>
                {responses.length > 0 && <button onClick={generateInsights} className="btn-primary" style={{ fontSize: '1rem', padding: '0.85rem 2rem' }}>Generate AI Report</button>}
              </div>
            )}

            {/* THE REPORT */}
            {!loadingInsights && analysis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Export bar */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={saveAsPDF}
                    className="btn-secondary no-print" 
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1.1rem' }}
                  >
                    📥 Save Analysis as PDF
                  </button>
                  <button onClick={generateInsights} className="btn-secondary no-print" style={{ fontSize: '0.875rem', padding: '0.5rem 1.1rem' }}>
                    ↺ Regenerate
                  </button>
                </div>
                <div id="insights-report">

                {/* Top strip — overall score + executive summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', flexWrap: 'wrap' }} className="card">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', borderRight: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Overall ESG Score</p>
                    <RadialScore score={analysis.overallESGScore} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--slate)', textAlign: 'center', marginTop: '0.75rem', lineHeight: 1.5 }}>{analysis.scoreInterpretation}</p>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <div style={{ width: 4, height: 24, background: 'var(--sage)', borderRadius: 2 }} />
                      <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Executive Summary</h2>
                    </div>
                    <p style={{ color: 'var(--ink)', lineHeight: 1.8, fontSize: '0.95rem' }}>{analysis.executiveSummary}</p>
                  </div>
                </div>

                {/* ESG Section scores — bar charts */}
                {analysis.sections && analysis.sections.length > 0 && (
                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      <div style={{ width: 4, height: 24, background: '#3b82f6', borderRadius: 2 }} />
                      <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Knowledge vs Practice — By Section</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                      {analysis.sections.map((sec, i) => (
                        <KPBar
                          key={i}
                          label={sec.title}
                          knowledge={sec.avgKnowledge || 0}
                          practice={sec.avgPractice || 0}
                          color={SECTION_COLORS[i % SECTION_COLORS.length]}
                          lightColor={SECTION_LIGHT[i % SECTION_LIGHT.length]}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Section findings */}
                {analysis.sections && analysis.sections.length > 0 && (
                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      <div style={{ width: 4, height: 24, background: '#7c3aed', borderRadius: 2 }} />
                      <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Section-by-Section Findings</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {analysis.sections.map((sec, i) => (
                        <div key={i} style={{ borderLeft: `3px solid ${SECTION_COLORS[i % SECTION_COLORS.length]}`, paddingLeft: '1rem' }}>
                          <p style={{ fontWeight: 700, color: SECTION_COLORS[i % SECTION_COLORS.length], marginBottom: '0.3rem', fontSize: '0.9rem' }}>{sec.title}</p>
                          <p style={{ color: 'var(--ink)', fontSize: '0.875rem', lineHeight: 1.7 }}>{sec.insight}</p>
                          {sec.keyGap && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', background: '#fef3c7', borderRadius: 6, padding: '0.2rem 0.6rem', fontSize: '0.78rem', color: '#92400e' }}>
                              ⚠ {sec.keyGap}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths + Improvements side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {analysis.topStrengths?.length > 0 && (
                    <div className="card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <div style={{ width: 4, height: 24, background: '#16a34a', borderRadius: 2 }} />
                        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Top Strengths</h2>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {analysis.topStrengths.map((s, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <span style={{ width: 24, height: 24, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0, marginTop: 1 }}>✓</span>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.15rem' }}>{s.title}</p>
                              <p style={{ fontSize: '0.82rem', color: 'var(--slate)', lineHeight: 1.6 }}>{s.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.areasForImprovement?.length > 0 && (
                    <div className="card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <div style={{ width: 4, height: 24, background: '#ef4444', borderRadius: 2 }} />
                        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Areas for Improvement</h2>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {analysis.areasForImprovement.map((a, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <span style={{ width: 24, height: 24, background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#dc2626', flexShrink: 0, marginTop: 1 }}>!</span>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.15rem' }}>{a.title}</p>
                              <p style={{ fontSize: '0.82rem', color: 'var(--slate)', lineHeight: 1.6 }}>{a.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                {analysis.recommendations?.length > 0 && (
                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      <div style={{ width: 4, height: 24, background: '#d4852a', borderRadius: 2 }} />
                      <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Recommendations</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                      {analysis.recommendations.map((rec, i) => (
                        <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '0.9rem 1rem', background: '#fef9f0', borderRadius: 12, border: '1px solid #fde68a' }}>
                          <span style={{ width: 30, height: 30, background: '#d4852a', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>{rec.number}</span>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem', color: '#92400e' }}>{rec.title}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.7 }}>{rec.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Qualitative themes */}
                {analysis.qualitativeThemes?.length > 0 && (
                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      <div style={{ width: 4, height: 24, background: '#0891b2', borderRadius: 2 }} />
                      <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Qualitative Themes</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                      {analysis.qualitativeThemes.map((t, i) => (
                        <div key={i} style={{ background: '#f0f9ff', borderRadius: 12, padding: '1rem', border: '1px solid #bae6fd' }}>
                          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0369a1', marginBottom: '0.35rem' }}>💬 {t.theme}</p>
                          <p style={{ fontSize: '0.82rem', color: 'var(--slate)', lineHeight: 1.6 }}>{t.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Research objective answer */}
                {analysis.researchObjectiveAnswer && (
                  <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2d3561 100%)', borderRadius: 20, padding: '2rem', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>🎯</span>
                      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white' }}>Research Objective — What This Survey Found</h2>
                    </div>
                    <p style={{ lineHeight: 1.85, fontSize: '0.95rem', color: '#e2e8f0' }}>{analysis.researchObjectiveAnswer}</p>
                  </div>
                )}

                </div>{/* end insights-report */}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
