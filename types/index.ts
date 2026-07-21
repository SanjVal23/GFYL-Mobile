export interface User {
  id?: string;
  name: string;
  email: string;
  isGuest?: boolean;
  language?: string;
  notifications?: boolean;
  role?: 'student' | 'parent' | 'teacher';
  accessTier?: 'free' | 'paid';
  avatarUrl?: string;
}

export interface Chapter {
  id: number;
  name: string;
  verses: number;
  isBookmarked?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  lessons: number;
  progress: number;
  icon: string;
  completed?: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: number;
  score?: number;
  hasStarRating?: boolean;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  sender?: 'user' | 'bot';
}

export interface BotResponse {
  summary: string;
  detailedExplanation: string;
}

export interface Suggestion {
  id: string;
  text: string;
}

export type Screen =
  | 'home'
  | 'bhagavad-gita'
  | 'ai-buddy'
  | 'courses'
  | 'community'
  | 'quizzes'
  | 'videos'
  | 'ai-video'
  | 'profile';

// ── Gita Warriors — Shloka Pronunciation Coach ──────────────────────────

export type StressLevel = 'high' | 'mid' | 'low';

export interface Syllable {
  text: string;
  stress: StressLevel;
}

export interface Shloka {
  id: string;
  reference: string;
  title: string;
  devanagari: string;
  roman: string;
  meaning: string;
  audioUrl: string | null;
  tip: string;
  syllables: Syllable[][];
}

export type WordFeedbackStatus = 'correct' | 'close' | 'retry';

export interface WordFeedback {
  word: string;
  status: WordFeedbackStatus;
  note: string;
}

export type ScoreLabel = 'Excellent' | 'Good Job' | 'Keep Going';

export interface CoachFeedback {
  score: number;
  scoreLabel: ScoreLabel;
  title: string;
  summary: string;
  strength: string;
  improve: string;
  tip: string;
  wordFeedback: WordFeedback[];
}

export interface PhonemeScore {
  phoneme: string;
  accuracyScore: number;
}

export interface AzurePronunciationResult {
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronunciationScore: number;
  words: {
    word: string;
    accuracyScore: number;
    errorType: string;
  }[];
  phonemes?: PhonemeScore[];
}

export interface GitaAttempt {
  id: string;
  userId: string;
  shlokaId: string;
  score: number;
  scoreLabel: ScoreLabel;
  feedback: CoachFeedback;
  createdAt: string;
}

export interface TeacherStudentRow {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  scoresByShloka: Record<string, number | null>;
  lastPracticedAt: string | null;
  needsHelp: boolean;
}
