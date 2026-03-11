import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST(req: NextRequest) {
  try {
    const { surveyId, status } = await req.json()

    if (!surveyId || !status) {
      return NextResponse.json({ error: 'Missing surveyId or status' }, { status: 400 })
    }

    if (status !== 'open' && status !== 'closed') {
      return NextResponse.json({ error: 'Status must be "open" or "closed"' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('ai-survey-builder')
    const collection = db.collection('surveys')

    const result = await collection.updateOne(
      { id: surveyId },
      {
        $set: {
          status,
          updatedAt: new Date().toISOString(),
        },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('Toggle status error:', error)
    return NextResponse.json({ error: 'Failed to update survey status' }, { status: 500 })
  }
}
