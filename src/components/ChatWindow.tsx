
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onLearnMore?: (messageId: string) => void;
}

const SUGGESTIONS = [
  { label: "Navigating Anxiety", text: "How did Arjun respond when he first felt overwhelmed?" },
  { label: "Who Am I?", text: "Please explain the difference between the soul and the body." },
  { label: "Peace in Action", text: "How can I focus on my work without worrying about the result?" },
  { label: "Mastering Anger", text: "What is the 'Science of Anger' Krishna teaches?" }
];

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onSendMessage, onLearnMore }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10">
      <div className="p-4 bg-slate-900/80 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-inner">🦚</div>
          <div>
            <h2 className="text-base font-black bg-gradient-to-r from-amber-200 to-purple-300 bg-clip-text text-transparent uppercase tracking-tight">Krishna - Your Guide</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">A Living Friend</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onLearnMore={onLearnMore} />
        ))}
        {isLoading && (
          <div className="flex justify-start items-center space-x-3 mb-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-purple-500/50 flex items-center justify-center text-xl">🦚</div>
            <div className="px-4 py-2 rounded-2xl bg-slate-800/50 text-slate-300 italic text-sm border border-white/5">
              Krishna is reflecting...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 pt-2 pb-1 shrink-0 overflow-hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => !isLoading && onSendMessage(s.text)}
              disabled={isLoading}
              className="whitespace-nowrap px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs font-bold hover:bg-indigo-500/30 hover:text-white hover:border-indigo-400 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      
      <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatWindow;
