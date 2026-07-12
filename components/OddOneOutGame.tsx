import React, { useState } from 'react';
import { OddOneOutQ } from '../types';

export const OddOneOutGame: React.FC<{
  data: OddOneOutQ;
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
    <div className="p-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {data.options.map((opt, idx) => {
          const isCorrectAns = opt === data.answer;
          const isSelected = selected === opt;
          
          let btnClass = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 border-b-8';
          if (isSubmitted) {
            if (isCorrectAns) btnClass = 'bg-green-500 border-green-600 text-white';
            else if (isSelected) btnClass = 'bg-red-500 border-red-600 text-white';
            else btnClass = 'bg-slate-100 border-slate-200 text-slate-400 opacity-50';
          } else if (isSelected) {
            btnClass = 'bg-brand-100 border-brand-500 text-brand-800 border-4 translate-y-1';
          }

          return (
            <button
              key={idx}
              onClick={() => handleClick(opt)}
              disabled={isSubmitted}
              className={`p-4 sm:p-6 rounded-2xl font-black text-lg sm:text-2xl transition-all border-4 ${btnClass}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      
      {isSubmitted && (
        <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <p className="font-bold text-blue-800 flex items-center gap-2">
            <span className="text-xl">💡</span> Giải thích: {data.explanation}
          </p>
        </div>
      )}
    </div>
  );
};
