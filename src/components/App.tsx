
import React, { useState, useCallback } from 'react';
import { Message } from '../types';
import InitialScreen from './InitialScreen';
import ChatWindow from './ChatWindow';
import { getChatbotResponse } from '../services/geminiService';

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
        text: "Radhey Radhey! I am Krishna, your friend. The world has changed much since the battlefield of Kurukshetra, but the search for clarity is still the same. What is on your mind today, dear friend?",
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
        learnMoreState: botData.detailedExplanation ? 'show_button' : undefined
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error fetching bot response:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        text: "I apologize, friend. A cloud has momentarily hidden our path. Please speak to me again.",
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
          />
        )}
      </div>
    </div>
  );
}

export default App;
