import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST(req: NextRequest) {
  try {
    const { surveyId, title, description, sections, collectEmail, contactPerson, contactEmail, contactPhone } = await req.json()
    if (!surveyId) return NextResponse.json({ error: 'Missing surveyId' }, { status: 400 })

    const client = await clientPromise
    const db = client.db('ai-survey-builder')

    await db.collection('surveys').updateOne(
      { id: surveyId },
      {
        $set: {
          title, description, sections,
          collectEmail: collectEmail || false,
          contactPerson: contactPerson || '',
          contactEmail: contactEmail || '',
          contactPhone: contactPhone || '',
          updatedAt: new Date().toISOString(),
        }
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Failed to update survey' }, { status: 500 })
  }
}
