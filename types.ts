
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  detailedText?: string;
  learnMoreState?: 'show_button' | 'button_clicked';
  feedbackStatus?: 'positive' | 'negative' | null;
  feedbackComment?: string;
}

export interface BotResponse {
  summary: string;
  detailedExplanation: string;
}

export interface FeedbackPayload {
  messageId: string;
  userQuery: string;
  botResponse: string;
  isPositive?: boolean;
  comment?: string;
  timestamp: string;
}
