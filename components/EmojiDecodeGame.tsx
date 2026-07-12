import React, { useState } from 'react';
import { EmojiDecodeQ } from '../types';

export const EmojiDecodeGame: React.FC<{
  data: EmojiDecodeQ;
  onAnswer: (isCorrect: boolean) => void;
  isSubmitted: boolean;
}> = ({ data, onAnswer, isSubmitted }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleClick = (opt: string) => {
    if (isSubmitted) return;
    setSelected(opt);
    onAnswer(opt === data.answer);
  };

  return (
    <div className="p-4 sm:p-8 bg-white rounded-3xl border-4 border-slate-100 text-center">
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-500 uppercase tracking-widest mb-4">Mật mã Emoji</h3>
        <div className="text-5xl sm:text-7xl tracking-widest bg-slate-50 py-8 rounded-2xl border-2 border-slate-100">
          {data.emojis}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {data.options.map((opt, idx) => {
          const isCorrectAns = opt === data.answer;
          const isSelected = selected === opt;
          
          let btnClass = 'bg-white border-brand-200 text-brand-800 hover:bg-brand-50 border-b-8';
          if (isSubmitted) {
            if (isCorrectAns) btnClass = 'bg-green-500 border-green-600 text-white';
            else if (isSelected) btnClass = 'bg-red-500 border-red-600 text-white';
            else btnClass = 'bg-slate-100 border-slate-200 text-slate-400 opacity-50';
          } else if (isSelected) {
            btnClass = 'bg-brand-500 border-brand-700 text-white border-4 translate-y-1';
          }

          return (
            <button
              key={idx}
              onClick={() => handleClick(opt)}
              disabled={isSubmitted}
              className={`p-4 sm:p-6 rounded-2xl font-black text-xl sm:text-3xl transition-all border-4 uppercase ${btnClass}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      
      {isSubmitted && (
        <div className="mt-8 p-4 bg-brand-50 border-2 border-brand-200 rounded-xl">
          <p className="font-bold text-brand-800 text-lg">
            Giải thích: {data.explanation}
          </p>
        </div>
      )}
    </div>
  );
};
