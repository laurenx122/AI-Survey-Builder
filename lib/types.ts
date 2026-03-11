export type QuestionType = 'multiple_choice' | 'multiple_select' | 'likert' | 'open_ended' | 'yes_no' | 'matrix' | 'scale_info'

export interface ScaleLabel {
  value: number
  label: string
}

export interface MatrixColumn {
  key: string
  label: string
  scale: ScaleLabel[]
}

export interface Question {
  id: string;
  type: 'open_ended' | 'multiple_choice' | 'multiple_select' | 'likert' | 'yes_no' | 'matrix' | 'scale_info';
  text: string;
  required: boolean;
  options?: string[];
  scale?: number; 
  scaleLabels?: { value: number; label: string }[];
  columns?: any[]; 
}

export interface Section {
  title: string
  questions: Question[]
}

export interface Survey {
  _id?: string
  id: string
  title: string
  description: string
  sections?: Section[]
  questions?: Question[]
  status: 'open' | 'closed'
  createdAt: string
  updatedAt: string
  responseCount: number
  collectEmail?: boolean
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
}

export interface SurveyResponse {
  _id?: string
  surveyId: string
  respondentEmail?: string
  answers: Record<string, string | string[] | Record<string, string>>
  submittedAt: string
}
