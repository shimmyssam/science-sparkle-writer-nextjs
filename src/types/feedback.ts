// Type definitions for feedback data structure

export interface Rating {
  stars: number;
  comment: string;
}

export interface Ratings {
  content: Rating;
  logicalFlow: Rating;
  sentenceExpression: Rating;
  scientificKnowledge: Rating;
  readerAwareness: Rating;
}

export interface ImprovedSentence {
  original: string;
  improved: string;
}

export interface ScientificKnowledge {
  present: string[];
  missing: string[];
  suggestions: string;
}

export interface LogicalFlow {
  rating: number;
  comment: string;
}

export interface FeedbackData {
  studentName: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
  tips: string[];
  ratings: Ratings;
  improvedSentences?: ImprovedSentence[];
  scientificKnowledge?: ScientificKnowledge;
  logicalFlow?: LogicalFlow;
}

export interface StudentFeedbackRow {
  id: string;
  student_name: string;
  essay: string;
  feedback_data: FeedbackData;
  teacher_modified_feedback?: FeedbackData | null;
  created_at: string;
  updated_at: string;
}