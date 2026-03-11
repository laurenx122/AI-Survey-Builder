import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST(req: NextRequest) {
  try {
    const { surveyId, answers, respondentEmail } = await req.json()
    if (!surveyId || !answers) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const client = await clientPromise
    const db = client.db('ai-survey-builder')

    const survey = await db.collection('surveys').findOne({ id: surveyId })
    if (!survey) return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    if (survey.status === 'closed') return NextResponse.json({ error: 'This survey is no longer accepting responses.' }, { status: 403 })

    await db.collection('responses').insertOne({ surveyId, answers, respondentEmail: respondentEmail || '', submittedAt: new Date().toISOString() })
    await db.collection('surveys').updateOne({ id: surveyId }, { $inc: { responseCount: 1 } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const surveyId = searchParams.get('surveyId')
    if (!surveyId) return NextResponse.json({ error: 'Missing surveyId' }, { status: 400 })

    const client = await clientPromise
    const db = client.db('ai-survey-builder')

    const [survey, responses] = await Promise.all([
      db.collection('surveys').findOne({ id: surveyId }),
      db.collection('responses').find({ surveyId }).sort({ submittedAt: -1 }).toArray(),
    ])

    if (!survey) return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    return NextResponse.json({ success: true, survey, responses })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
  }
}
