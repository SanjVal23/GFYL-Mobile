
import React, { useState, useCallback } from 'react';
import { Message, FeedbackPayload } from './types';
import InitialScreen from './components/InitialScreen';
import ChatWindow from './components/ChatWindow';
import { getChatbotResponse } from './services/geminiService';

const backgroundUrl = 'https://images.unsplash.com/photo-1605704330219-35a091938a49?q=80&w=1964&auto=format&fit=crop';

function App() {
  const [chatStarted, setChatStarted] = useState(false);
  const [showGoodbye, setShowGoodbye] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartChat = useCallback(() => {
    setMessages([
      {
        id: 'initial-bot-message',
        sender: 'bot',
        text: "Radhey Radhey! I am Krishna, your friend. I have been waiting for you. Sometimes life feels like a big, loud storm. I have some simple secrets to help you feel calm. What is on your mind?",
      },
    ]);
    setChatStarted(true);
    setShowGoodbye(false);
  }, []);

  const handleDeclineChat = useCallback(() => {
    setShowGoodbye(true);
  }, []);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const botData = await getChatbotResponse(text, messages);
      const botMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        sender: 'bot', 
        text: botData.summary,
        detailedText: botData.detailedExplanation,
        learnMoreState: botData.detailedExplanation ? 'show_button' : undefined,
        feedbackStatus: null
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        text: "I missed that, friend. Like a flickering candle. Can you ask me again?",
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const handleLearnMore = useCallback((messageId: string) => {
    setMessages(prev => {
      const msg = prev.find(m => m.id === messageId);
      if (!msg || !msg.detailedText) return prev;

      const updatedMessages = prev.map(m => 
        m.id === messageId ? { ...m, learnMoreState: 'button_clicked' } as Message : m
      );

      return [...updatedMessages, {
        id: `${messageId}-detailed`,
        sender: 'bot',
        text: msg.detailedText,
      }];
    });
  }, []);

  const handleFeedback = useCallback(async (messageId: string, isPositive?: boolean, comment?: string) => {
    const msg = messages.find(m => m.id === messageId);
    const msgIndex = messages.findIndex(m => m.id === messageId);
    const userMsg = msgIndex > 0 ? messages[msgIndex - 1] : null;
    
    if (!msg) return;

    setMessages(prev => prev.map(m => 
      m.id === messageId ? { 
        ...m, 
        feedbackStatus: isPositive !== undefined ? (isPositive ? 'positive' : 'negative') : m.feedbackStatus,
        feedbackComment: comment !== undefined ? comment : m.feedbackComment
      } : m
    ));

    const payload: FeedbackPayload = {
      messageId,
      userQuery: userMsg?.text || 'Direct Greeting',
      botResponse: msg.text,
      isPositive,
      comment,
      timestamp: new Date().toISOString()
    };

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn("Feedback captured for developer review.");
    }
  }, [messages]);

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen font-sans p-2 md:p-4 bg-cover bg-fixed bg-center"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div className="w-full max-w-2xl h-[95vh] max-h-[850px] flex flex-col relative z-10">
        <div className="absolute inset-0 bg-black/60 rounded-2xl -z-10 backdrop-blur-[4px]" />
        {!chatStarted ? (
          <InitialScreen onStartChat={handleStartChat} onDeclineChat={handleDeclineChat} showGoodbye={showGoodbye} />
        ) : (
          <ChatWindow 
            messages={messages} 
            isLoading={isLoading} 
            onSendMessage={handleSendMessage}
            onLearnMore={handleLearnMore}
            onFeedback={handleFeedback}
          />
        )}
      </div>
    </div>
  );
}

export default App;
