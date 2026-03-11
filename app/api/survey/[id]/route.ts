import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const client = await clientPromise
    const db = client.db('ai-survey-builder')

    const survey = await db.collection('surveys').findOne({ id })

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, survey })
  } catch (error) {
    console.error('Get survey error:', error)
    return NextResponse.json({ error: 'Failed to fetch survey' }, { status: 500 })
  }
}
