export interface User {
  id?: string;
  name: string;
  email: string;
  isGuest?: boolean;
  language?: string;
  notifications?: boolean;
  role?: 'student' | 'parent';
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
