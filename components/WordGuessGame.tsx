import React, { useState, useMemo } from 'react';
import { WordGuessQ } from '../types';

// Generate 2 decoy words from the correct word
const generateDecoys = (correctWord: string): string[] => {
  const word = correctWord.toUpperCase();
  const len = word.length;
  const decoys: string[] = [];
  
  // Strategy: swap/replace letters to create plausible wrong answers
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  for (let d = 0; d < 3; d++) {
    let decoy = word.split('');
    // Replace 1-2 random letters
    const positions = Array.from({ length: len }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.max(1, Math.floor(len * 0.4)));
    
    for (const pos of positions) {
      let newChar = alphabet[Math.floor(Math.random() * 26)];
      while (newChar === decoy[pos]) {
        newChar = alphabet[Math.floor(Math.random() * 26)];
      }
      decoy[pos] = newChar;
    }
    
    const decoyStr = decoy.join('');
    if (decoyStr !== word && !decoys.includes(decoyStr)) {
      decoys.push(decoyStr);
    } else {
      // Fallback: just reverse the word
      const fallback = word.split('').reverse().join('');
      decoys.push(fallback !== word ? fallback : word + 'S');
    }
  }
  
  return decoys;
};

export const WordGuessGame: React.FC<{
  data: WordGuessQ;
  onAnswer: (isCorrect: boolean) => void;
  isSubmitted: boolean;
}> = ({ data, onAnswer, isSubmitted }) => {
  const word = data.word.toUpperCase();
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  // Generate shuffled options: 1 correct + 2 decoys
  const options = useMemo(() => {
    const decoys = generateDecoys(word);
    const allOptions = [word, ...decoys];
    // Shuffle
    return allOptions
      .map((opt, i) => ({ text: opt, isCorrect: i === 0 }))
      .sort(() => Math.random() - 0.5);
  }, [word]);

  const handleSelect = (idx: number) => {
    if (answered || isSubmitted) return;
    setSelected(idx);
    setAnswered(true);
    onAnswer(options[idx].isCorrect);
  };

  const labels = ['A', 'B', 'C', 'D'];

  return (
    <div className="p-4 sm:p-8 bg-white rounded-3xl border-4 border-slate-100 flex flex-col items-center">
      <p className="text-xl sm:text-2xl font-bold text-brand-800 mb-6 text-center">💡 Gợi ý: {data.hint}</p>
      
      {/* Word display with blanks */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {word.split('').map((char, idx) => (
          <div key={idx} className="w-10 h-14 sm:w-12 sm:h-16 flex items-center justify-center bg-slate-100 border-b-4 border-slate-300 rounded-xl font-black text-2xl">
            {char === ' ' ? ' ' : (answered || isSubmitted ? char : '?')}
          </div>
        ))}
      </div>

      {/* ABC options */}
      <div className="w-full max-w-lg space-y-3">
        {options.map((opt, idx) => {
          const isSelected = selected === idx;
          const showResult = answered || isSubmitted;

          let btnClass = 'bg-white border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-brand-50';
          if (showResult) {
            if (opt.isCorrect) {
              btnClass = 'bg-green-100 border-green-500 text-green-700';
            } else if (isSelected && !opt.isCorrect) {
              btnClass = 'bg-red-100 border-red-500 text-red-700';
            } else {
              btnClass = 'bg-slate-50 border-slate-200 text-slate-400 opacity-50';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered || isSubmitted}
              className={`w-full p-4 rounded-xl border-2 font-bold text-left text-base sm:text-lg transition-all flex items-center gap-4 active:scale-[0.98] ${btnClass}`}
            >
              <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${
                showResult && opt.isCorrect ? 'bg-green-500 text-white' :
                showResult && isSelected && !opt.isCorrect ? 'bg-red-500 text-white' :
                'bg-brand-100 text-brand-600'
              }`}>
                {labels[idx]}
              </span>
              <span className="tracking-[0.3em] text-xl">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {(answered || isSubmitted) && (
        <div className="mt-6 text-center">
          <p className="font-black text-xl text-slate-700">
            {selected !== null && options[selected].isCorrect 
              ? <span className="text-green-600">🌟 Chính xác! Đáp án là: {word}</span>
              : <span className="text-amber-600">💡 Đáp án đúng là: <span className="text-green-600">{word}</span></span>
            }
          </p>
        </div>
      )}
    </div>
  );
};
