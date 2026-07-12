import React, { useState } from 'react';
import { WordGuessQ } from '../types';

export const WordGuessGame: React.FC<{
  data: WordGuessQ;
  onAnswer: (isCorrect: boolean) => void;
  isSubmitted: boolean;
}> = ({ data, onAnswer, isSubmitted }) => {
  const word = data.word.toUpperCase();
  const [guesses, setGuesses] = useState<string[]>([]);
  const mistakes = guesses.filter(g => !word.includes(g)).length;
  
  const handleGuess = (letter: string) => {
    if (isSubmitted || guesses.includes(letter) || mistakes >= 5) return;
    const newGuesses = [...guesses, letter];
    setGuesses(newGuesses);
    
    // Check win/loss
    const isWin = word.split('').every(char => char === ' ' || newGuesses.includes(char));
    const newMistakes = newGuesses.filter(g => !word.includes(g)).length;
    
    if (isWin) onAnswer(true);
    else if (newMistakes >= 5) onAnswer(false);
  };

  const keyboard = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="p-4 sm:p-8 bg-white rounded-3xl border-4 border-slate-100 flex flex-col items-center">
      <p className="text-xl sm:text-2xl font-bold text-brand-800 mb-6 text-center">💡 Gợi ý: {data.hint}</p>
      
      {/* Flower/Hearts indicator instead of hangman */}
      <div className="flex gap-2 mb-8">
        {[0, 1, 2, 3, 4].map(i => (
          <span key={i} className={`text-4xl transition-all ${i < mistakes ? 'opacity-20 grayscale' : ''}`}>❤️</span>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {word.split('').map((char, idx) => (
          <div key={idx} className="w-10 h-14 sm:w-12 sm:h-16 flex items-center justify-center bg-slate-100 border-b-4 border-slate-300 rounded-xl font-black text-2xl">
            {char === ' ' ? ' ' : (guesses.includes(char) || isSubmitted ? char : '')}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {keyboard.map(char => {
          const isGuessed = guesses.includes(char);
          const isCorrect = isGuessed && word.includes(char);
          const isWrong = isGuessed && !word.includes(char);
          
          let btnClass = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 border-b-4';
          if (isCorrect) btnClass = 'bg-green-500 border-green-600 text-white';
          else if (isWrong) btnClass = 'bg-red-500 border-red-600 text-white opacity-50';

          return (
            <button
              key={char}
              onClick={() => handleGuess(char)}
              disabled={isGuessed || isSubmitted || mistakes >= 5}
              className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl font-black text-lg sm:text-xl transition-all border-2 ${btnClass}`}
            >
              {char}
            </button>
          );
        })}
      </div>
      
      {isSubmitted && (
        <div className="mt-8 text-center">
          <p className="font-black text-2xl text-slate-700">
            Từ đúng là: <span className="text-green-600">{word}</span>
          </p>
        </div>
      )}
    </div>
  );
};
