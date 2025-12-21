
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  detailedText?: string;
  learnMoreState?: 'show_button' | 'button_clicked';
}

export interface BotResponse {
  summary: string;
  detailedExplanation: string;
}
