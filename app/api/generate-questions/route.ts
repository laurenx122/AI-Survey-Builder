import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)

export async function POST(req: NextRequest) {
  try {
    const { text, fileName } = await req.json()
    if (!text) return NextResponse.json({ error: 'No document text provided' }, { status: 400 })

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert survey digitizer. Read the survey document below carefully and reconstruct it as a structured JSON object. Copy ALL content exactly as written — do not paraphrase, skip, or invent questions.

DOCUMENT:
"""
${text}
"""

Output a JSON object with this EXACT structure. Return ONLY valid JSON, no markdown, no backticks, no explanation.

{
  "title": "Survey title from the document",
  "description": "The full introduction paragraph from the document",
  "sections": [
    {
      "title": "Section 1: Respondent & Company Information",
      "questions": [
        { "id": "s1q1", "type": "open_ended", "text": "Respondent's Role in the Company", "required": true },
        { "id": "s1q2", "type": "open_ended", "text": "Company Name", "required": true },
        { "id": "s1q3", "type": "open_ended", "text": "Number of Employees", "required": true },
        { "id": "s1q4", "type": "open_ended", "text": "Years of Operation", "required": true },
        { "id": "s1q5", "type": "open_ended", "text": "Type of Food Products Manufactured", "required": true }
      ]
    },
    {
      "title": "Section 2: Scales",
      "questions": [
        {
          "id": "s2q1",
          "type": "scale_info",
          "text": "Level of Knowledge",
          "required": false,
          "scaleLabels": [
            { "value": 4, "label": "Very Knowledgeable: Deep understanding of concepts, regulations, or practices." },
            { "value": 3, "label": "Knowledgeable: Good understanding with some practical awareness." },
            { "value": 2, "label": "Less Knowledgeable: Basic or limited understanding." },
            { "value": 1, "label": "Not Knowledgeable: Little to no understanding." }
          ]
        },
        {
          "id": "s2q2",
          "type": "scale_info",
          "text": "Level of Practice",
          "required": false,
          "scaleLabels": [
            { "value": 4, "label": "Highly Practiced: Consistently implemented with measurable outcomes." },
            { "value": 3, "label": "Practiced: Regularly implemented but may lack consistency or measurement." },
            { "value": 2, "label": "Less Practiced: Occasionally implemented or in early stages." },
            { "value": 1, "label": "Not Practiced at All: No implementation or action taken." }
          ]
        },
        {
          "id": "s2q3",
          "type": "scale_info",
          "text": "Level of Sustainability",
          "required": false,
          "scaleLabels": [
            { "value": 4, "label": "Very Sustainable: Strong resilience, consistent growth, and well-integrated ESG practices." },
            { "value": 3, "label": "Sustainable: Moderate resilience, partial ESG integration, and occasional growth." },
            { "value": 2, "label": "Less Sustainable: Limited resilience, weak ESG adoption, and inconsistent growth." },
            { "value": 1, "label": "Not Sustainable: Financially unstable, no ESG adoption, and declining or stagnant growth." }
          ]
        }
      ]
    },
    {
      "title": "Section 3: ESG Statements - Environmental",
      "questions": [
        {
          "id": "s3q1",
          "type": "matrix",
          "text": "I understand and our company complies with environmental regulations relevant to the food industry (e.g., waste disposal, packaging standards).",
          "required": true,
          "columns": [
            {
              "key": "knowledge",
              "label": "Level of Knowledge",
              "scale": [
                { "value": 4, "label": "Very Knowledgeable" },
                { "value": 3, "label": "Knowledgeable" },
                { "value": 2, "label": "Less Knowledgeable" },
                { "value": 1, "label": "Not Knowledgeable" }
              ]
            },
            {
              "key": "practice",
              "label": "Level of Practice",
              "scale": [
                { "value": 4, "label": "Highly Practiced" },
                { "value": 3, "label": "Practiced" },
                { "value": 2, "label": "Less Practiced" },
                { "value": 1, "label": "Not Practiced at All" }
              ]
            }
          ]
        }
      ]
    }
  ]
}

STRICT RULES — follow exactly:
1. Section 1 questions are ALL open_ended type — copy each row from the table as a separate question
2. Section 2 questions are ALL scale_info type — copy ALL scale definitions with their exact labels, include ALL three scales (Knowledge, Practice, Sustainability)
3. Section 3 matrix questions: each statement gets TWO columns — knowledge (1-4) and practice (1-4). Copy EVERY statement word-for-word. Create separate sub-sections for Environmental, Social, Governance
4. Business Sustainability statements: matrix type but with ONE column — sustainability (1-4)
5. Section 4 qualitative questions are open_ended type — copy each question word-for-word
6. Use id format s1q1, s1q2, s2q1, s3q1, s4q1 etc.
7. Return ONLY valid JSON — no extra text, no markdown backticks`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const surveyData = JSON.parse(cleanJson)

    return NextResponse.json({ success: true, survey: surveyData })
  } catch (error) {
    console.error('Question generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate questions. Please check your Gemini API key and try again.' },
      { status: 500 }
    )
  }
}
