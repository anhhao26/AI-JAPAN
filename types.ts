export type FeatureTab = 'compose' | 'tutor' | 'practice' | 'qa';

export interface TutorExample {
  japanese: string;
  romaji: string;
  vietnamese: string;
}

export interface TutorQuiz {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface TutorResponse {
  concept: string;
  explanation: string;
  examples: TutorExample[];
  commonMistakes?: string;
  quiz: TutorQuiz;
}


export interface ChatMessage {
  role: 'user' | 'model';
  content: string | TutorResponse;
}