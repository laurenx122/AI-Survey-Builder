import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const { title, description, sections, questions, collectEmail, contactPerson, contactEmail, contactPhone } = await req.json()
    if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 })

    const client = await clientPromise
    const db = client.db('ai-survey-builder')
    const surveyId = uuidv4()
    const now = new Date().toISOString()

    const survey = {
      id: surveyId, title, description,
      sections: sections || (questions ? [{ title: 'Questions', questions }] : []),
      status: 'open', createdAt: now, updatedAt: now, responseCount: 0,
      collectEmail: collectEmail || false,
      contactPerson: contactPerson || '',
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
    }

    await db.collection('surveys').insertOne(survey)
    return NextResponse.json({ success: true, surveyId, shareLink: `/survey/${surveyId}` })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to publish survey' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('ai-survey-builder')
    const surveys = await db.collection('surveys').find({}).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ success: true, surveys })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 })
  }
}
