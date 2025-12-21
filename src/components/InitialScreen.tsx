
import React from 'react';

interface InitialScreenProps {
  onStartChat: () => void;
  onDeclineChat: () => void;
  showGoodbye: boolean;
}

const InitialScreen: React.FC<InitialScreenProps> = ({ onStartChat, onDeclineChat, showGoodbye }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-black/40 backdrop-blur-md rounded-2xl p-8 text-white text-center shadow-2xl">
      <div className="flex-grow flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-purple-600 rounded-full mb-6 flex items-center justify-center text-4xl shadow-2xl animate-pulse">🦚</div>
        <h1 className="text-4xl font-black mb-4 animate-fade-in-down bg-gradient-to-r from-amber-200 to-indigo-300 bg-clip-text text-transparent uppercase tracking-wider">Gita Guide</h1>
        <p className="text-lg max-w-md animate-fade-in-up font-medium text-slate-200 leading-relaxed">
            {showGoodbye 
              ? "May your path be peaceful and your mind remain steady. Radhey Radhey!" 
              : "Radhey Radhey! Are you ready to see how ancient wisdom can clear the noise of your modern world? I am Krishna, your friend. Let us begin."}
        </p>
      </div>
      {!showGoodbye && (
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs animate-fade-in">
          <button
            onClick={onStartChat}
            className="flex-1 bg-white text-indigo-900 font-black uppercase tracking-widest py-3 px-6 rounded-full hover:bg-indigo-50 transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            I am ready
          </button>
          <button
            onClick={onDeclineChat}
            className="flex-1 bg-transparent border-2 border-white/40 text-white font-black uppercase tracking-widest py-3 px-6 rounded-full hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
          >
            Not now
          </button>
        </div>
      )}
    </div>
  );
};

export default InitialScreen;
