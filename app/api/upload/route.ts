import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = file.name.toLowerCase()

    let extractedText = ''

    if (fileName.endsWith('.docx')) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else if (fileName.endsWith('.pdf')) {
      // Dynamic import for pdf-parse
      const pdfParse = (await import('pdf-parse')).default
      const data = await pdfParse(buffer)
      extractedText = data.text
    } else if (fileName.endsWith('.txt')) {
      extractedText = buffer.toString('utf-8')
    } else {
      return NextResponse.json(
        { error: 'Please upload a PDF, DOCX, or TXT file' },
        { status: 400 }
      )
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'Could not extract text from this file. Make sure it is not a scanned image.' },
        { status: 400 }
      )
    }

    // Limit text to 8000 chars to keep within AI token limits
    const trimmedText = extractedText.trim().substring(0, 8000)

    return NextResponse.json({
      success: true,
      text: trimmedText,
      fileName: file.name,
      charCount: trimmedText.length,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process file. Please try again.' },
      { status: 500 }
    )
  }
}
