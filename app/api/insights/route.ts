import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import clientPromise from '@/lib/mongodb'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)

export async function POST(req: NextRequest) {
  try {
    const { surveyId } = await req.json()
    const client = await clientPromise
    const db = client.db('ai-survey-builder')

    const [survey, responses] = await Promise.all([
      db.collection('surveys').findOne({ id: surveyId }),
      db.collection('responses').find({ surveyId }).toArray(),
    ])

    if (!survey) return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    if (responses.length === 0) return NextResponse.json({ error: 'No responses to analyze yet' }, { status: 400 })

    // ── 1. Pre-compute chart data from raw responses ──────────────────────────
    const sections = survey.sections || []
    const chartData: any[] = []

    for (const section of sections) {
      for (const q of section.questions) {
        if (q.type === 'scale_info') continue

        if (q.type === 'matrix' && q.columns) {
          // For each column (e.g. Knowledge, Practice), compute average rating
          const colAverages: Record<string, number> = {}
          for (const col of q.columns) {
            const vals = responses
              .map((r: any) => {
                const ans = r.answers?.[q.id]
                if (!ans || typeof ans !== 'object') return null
                const v = parseFloat(ans[col.key])
                return isNaN(v) ? null : v
              })
              .filter((v): v is number => v !== null)
            colAverages[col.label] = vals.length > 0
              ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100
              : 0
          }
          chartData.push({
            questionId: q.id,
            sectionTitle: section.title,
            questionText: q.text,
            type: 'matrix_averages',
            data: colAverages,
          })
        } else if (q.type === 'open_ended') {
          // Collect text responses
          const texts = responses
            .map((r: any) => r.answers?.[q.id])
            .filter((v: any) => typeof v === 'string' && v.trim().length > 0)
          chartData.push({
            questionId: q.id,
            sectionTitle: section.title,
            questionText: q.text,
            type: 'open_ended_responses',
            data: texts,
          })
        } else if (q.options) {
          // Multiple choice / likert / yes_no — count per option
          const counts: Record<string, number> = {}
          for (const opt of q.options) counts[opt] = 0
          for (const r of responses as any[]) {
            const ans = r.answers?.[q.id]
            if (ans && counts[ans] !== undefined) counts[ans]++
          }
          chartData.push({
            questionId: q.id,
            sectionTitle: section.title,
            questionText: q.text,
            type: 'option_counts',
            data: counts,
          })
        }
      }
    }

    // ── 2. Build a clean, human-readable summary for the AI ──────────────────
    const dataSummary = chartData.map(cd => {
      if (cd.type === 'matrix_averages') {
        const vals = Object.entries(cd.data).map(([k, v]) => `${k}: ${v}/4`).join(', ')
        return `[${cd.sectionTitle}] "${cd.questionText}" — Avg ratings: ${vals}`
      }
      if (cd.type === 'option_counts') {
        const vals = Object.entries(cd.data).map(([k, v]) => `${k}: ${v}`).join(', ')
        return `[${cd.sectionTitle}] "${cd.questionText}" — Counts: ${vals}`
      }
      if (cd.type === 'open_ended_responses') {
        return `[${cd.sectionTitle}] "${cd.questionText}" — Responses: ${cd.data.slice(0, 5).join(' | ')}`
      }
      return ''
    }).join('\n')

    // ── 3. Ask Gemini for structured JSON analysis ────────────────────────────
    const prompt = `You are a professional business researcher analyzing ESG survey results for medium-sized food processing businesses in Cebu City. Analyze the data below and return a structured JSON report.

Survey: ${survey.title}
Total Responses: ${responses.length}

Pre-computed data summary:
${dataSummary}

Return ONLY valid JSON (no markdown, no backticks) in this EXACT structure:
{
  "executiveSummary": "2-3 sentence professional summary of overall findings",
  "overallESGScore": 2.8,
  "scoreInterpretation": "One sentence explaining what the overall score means",
  "sections": [
    {
      "title": "Environmental",
      "avgKnowledge": 2.5,
      "avgPractice": 2.1,
      "insight": "One paragraph finding for this section, no apostrophes",
      "keyGap": "Specific gap between knowledge and practice if any"
    }
  ],
  "topStrengths": [
    { "title": "Strength title", "description": "Description without apostrophes" }
  ],
  "areasForImprovement": [
    { "title": "Area title", "description": "Description without apostrophes" }
  ],
  "recommendations": [
    { "number": 1, "title": "Recommendation title", "description": "Actionable description without apostrophes" }
  ],
  "qualitativeThemes": [
    { "theme": "Theme name", "summary": "Summary of what respondents said" }
  ],
  "researchObjectiveAnswer": "A paragraph directly answering what the survey set out to find — the relationship between ESG factors and business sustainability"
}

RULES:
- Use actual numbers from the data summary above
- Do NOT use apostrophes anywhere (write cannot instead of can not, does not instead of doesn not, etc)
- Be specific and professional
- If data is limited, still provide meaningful analysis based on what is available
- overallESGScore should be average of all matrix ratings (1-4 scale)
- Return ONLY valid JSON`

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt)
    const raw = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const analysis = JSON.parse(raw)

    return NextResponse.json({ success: true, analysis, chartData })
  } catch (error) {
    console.error('Insights error:', error)
    return NextResponse.json({ error: 'Failed to generate insights. Please try again.' }, { status: 500 })
  }
}
