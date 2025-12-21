
import React, { useState } from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  onLearnMore?: (messageId: string) => void;
  onFeedback?: (messageId: string, isPositive?: boolean, comment?: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onLearnMore, onFeedback }) => {
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const isUser = message.sender === 'user';
  
  const createMarkup = (text: string) => {
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-300 font-bold">$1</strong>')
      .replace(/^> (.*)$/gm, '<div class="pl-4 border-l-4 border-amber-400/60 italic text-indigo-50 my-4 py-2 bg-white/5 rounded-r-lg font-medium leading-relaxed">"$1"</div>')
      .replace(/^---$/gm, '<div class="w-full border-t border-white/10 my-6"></div>')
      .replace(/^- (.*)$/gm, '<div class="flex items-start gap-2 mt-3"><span class="text-amber-400 text-lg">•</span><span class="text-slate-200">$1</span></div>')
      .replace(/^\* (.*)$/gm, '<div class="flex items-start gap-2 mt-3"><span class="text-amber-400 text-lg">•</span><span class="text-slate-200">$1</span></div>');
    
    return { __html: formatted };
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onFeedback?.(message.id, undefined, comment);
      setComment('');
      setSubmitted(true);
    }
  };

  return (
    <div className={`flex flex-col w-full mb-6 animate-fade-in ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-start gap-3 w-full max-w-[95%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isUser && (
          <div className="w-10 h-10 rounded-full bg-indigo-700 flex-shrink-0 flex items-center justify-center text-2xl shadow-lg border border-white/20">
            🦚
          </div>
        )}
        <div
          className={`px-4 py-3 rounded-2xl text-white shadow-xl border border-white/5 ${
            isUser
              ? 'bg-indigo-600/90 rounded-tr-none'
              : 'bg-slate-800/95 rounded-tl-none'
          }`}
        >
          <div className="text-[15px] md:text-base leading-relaxed whitespace-pre-wrap font-medium" dangerouslySetInnerHTML={createMarkup(message.text)} />
          
          {!isUser && !message.id.includes('-detailed') && (
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Was this helpful, friend?</span>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => onFeedback?.(message.id, true)}
                    className={`text-xl transition-all hover:scale-125 p-1 rounded-full hover:bg-white/5 ${message.feedbackStatus === 'positive' ? 'opacity-100 scale-125 text-amber-300' : 'opacity-40 grayscale'}`}
                  >👍</button>
                  <button 
                    onClick={() => onFeedback?.(message.id, false)}
                    className={`text-xl transition-all hover:scale-125 p-1 rounded-full hover:bg-white/5 ${message.feedbackStatus === 'negative' ? 'opacity-100 scale-125 text-red-400' : 'opacity-40 grayscale'}`}
                  >👎</button>
                </div>
              </div>

              {!submitted ? (
                <form onSubmit={handleCommentSubmit} className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Any specific feedback for devs?</span>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Enter a sentence or more..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 min-h-[60px]"
                  />
                  <button 
                    type="submit"
                    className="self-end px-3 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 text-[9px] uppercase font-bold rounded-md border border-amber-500/30 transition-all"
                  >
                    Send Dev Feedback
                  </button>
                </form>
              ) : (
                <span className="text-[10px] text-amber-200/70 italic animate-pulse font-bold">
                  Feedback recorded for devs. Thank you!
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {!isUser && message.learnMoreState === 'show_button' && onLearnMore && (
        <div className="pl-14 mt-3">
          <button
            onClick={() => onLearnMore(message.id)}
            className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 text-[11px] uppercase tracking-widest font-black py-2.5 px-6 rounded-full border border-amber-500/30 transition-all shadow-md group"
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
