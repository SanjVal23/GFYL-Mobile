
import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  onLearnMore?: (messageId: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onLearnMore }) => {
  const isUser = message.sender === 'user';
  
  const createMarkup = (text: string) => {
    // Basic markdown-ish formatting for Gita flavor
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-300 font-bold">$1</strong>')
      .replace(/^- (.*)$/gm, '<li class="ml-4 list-disc text-slate-200 mt-1">$1</li>')
      .replace(/^\* (.*)$/gm, '<li class="ml-4 list-disc text-slate-200 mt-1">$1</li>');
    
    return { __html: formatted };
  };

  return (
    <div className={`flex flex-col w-full mb-2 animate-fade-in ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-start gap-3 w-full max-w-[92%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isUser && (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-blue-700 flex-shrink-0 flex items-center justify-center text-2xl shadow-xl border border-white/20">
            🦚
          </div>
        )}
        <div
          className={`px-4 py-3 rounded-2xl text-white shadow-2xl border border-white/10 ${
            isUser
              ? 'bg-indigo-700/80 backdrop-blur-sm rounded-tr-none'
              : 'bg-slate-800/95 backdrop-blur-md rounded-tl-none'
          }`}
        >
          <div className="text-[15px] md:text-base leading-relaxed whitespace-pre-wrap font-medium" dangerouslySetInnerHTML={createMarkup(message.text)} />
        </div>
      </div>
      
      {!isUser && message.learnMoreState === 'show_button' && onLearnMore && (
        <div className="pl-14 mt-2">
          <button
            onClick={() => onLearnMore(message.id)}
            className="group flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/30 text-amber-200 text-[10px] uppercase tracking-widest font-black py-2 px-5 rounded-full border border-amber-500/40 transition-all duration-300 shadow-lg"
          >
            <span>Deeper Insight</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
