'use client'
import { Question, Section } from '@/lib/types'

const TYPE_LABEL: Record<string, string> = {
  multiple_choice: 'Single Answer',
  multiple_select: 'Multiple Answer',
  likert: 'Likert Scale',
  open_ended: 'Open Ended',
  yes_no: 'Yes / No',
}

const TYPE_COLOR: Record<string, string> = {
  multiple_choice: '#3b82f6',
  multiple_select: '#0891b2',
  likert: '#8b5cf6',
  open_ended: '#f59e0b',
  yes_no: '#10b981',
}

interface Props {
  sections: Section[]
  setSections: (s: Section[]) => void
}

function InsertButton({ onClick }: { onClick: () => void }) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '4px 0', opacity: 0, transition: 'opacity 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0' }}
    >
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <button onClick={onClick} style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid var(--sage)', background: 'white', color: 'var(--sage)', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>+</button>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

export default function QuestionEditor({ sections, setSections }: Props) {

  const updateQ = (sIdx: number, qIdx: number, updates: Partial<Question>) => {
    setSections(sections.map((s, si) => si !== sIdx ? s : {
      ...s, questions: s.questions.map((q, qi) => qi !== qIdx ? q : { ...q, ...updates })
    }))
  }

  const handleTypeChange = (sIdx: number, qIdx: number, newType: Question['type']) => {
    const updates: Partial<Question> = { type: newType }
    if (newType === 'likert') {
      updates.options = ['1', '2', '3', '4']; // Matches your ESG midterm scale
      updates.scale = 4;
    } else if (newType === 'yes_no') {
      updates.options = ['Yes', 'No'];
    } else if (newType === 'multiple_choice' || newType === 'multiple_select') {
      updates.options = ['Option 1', 'Option 2'];
    } else {
      updates.options = undefined;
      updates.scale = undefined;
    }
    updateQ(sIdx, qIdx, updates);
  }

  const updateOption = (sIdx: number, qIdx: number, oIdx: number, value: string) => {
    const q = sections[sIdx].questions[qIdx];
    const opts = [...(q.options || [])];
    opts[oIdx] = value;
    updateQ(sIdx, qIdx, { options: opts });
  }

  const addOption = (sIdx: number, qIdx: number) => {
    const q = sections[sIdx].questions[qIdx];
    const newOpts = [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`];
    updateQ(sIdx, qIdx, { options: newOpts, scale: newOpts.length });
  }

  const removeOption = (sIdx: number, qIdx: number, oIdx: number) => {
    const q = sections[sIdx].questions[qIdx];
    const newOpts = (q.options || []).filter((_, i) => i !== oIdx);
    updateQ(sIdx, qIdx, { options: newOpts, scale: newOpts.length });
  }

  return (
    <div>
      {sections.map((section, sIdx) => (
        <div key={sIdx} style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--sage)', marginBottom: '1rem' }}>{section.title}</h2>
          {section.questions.map((q, qIdx) => (
            <div key={q.id}>
              <div className="card" style={{ borderLeft: `4px solid ${TYPE_COLOR[q.type]}`, padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Question Text</label>
                  <textarea className="input-field" value={q.text} onChange={e => updateQ(sIdx, qIdx, { text: e.target.value })} rows={2} />
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Answer Type</label>
                    <select className="input-field" value={q.type} onChange={e => handleTypeChange(sIdx, qIdx, e.target.value as any)}>
                      {Object.keys(TYPE_LABEL).map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                    </select>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', paddingBottom: '0.5rem' }}>
                    <input type="checkbox" checked={q.required} onChange={e => updateQ(sIdx, qIdx, { required: e.target.checked })} />
                    <span style={{ fontSize: '0.85rem' }}>Required</span>
                  </label>
                </div>
                {q.options && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>CHOICES</span>
                      <button onClick={() => addOption(sIdx, qIdx)} style={{ color: 'var(--sage)', cursor: 'pointer', background: 'none', border: '1px solid var(--sage)', borderRadius: '4px', padding: '2px 8px' }}>+ Add</button>
                    </div>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input className="input-field" value={opt} onChange={e => updateOption(sIdx, qIdx, oIdx, e.target.value)} />
                        <button onClick={() => removeOption(sIdx, qIdx, oIdx)} disabled={q.options!.length <= 2} style={{ color: '#fca5a5', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <InsertButton onClick={() => {}} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}