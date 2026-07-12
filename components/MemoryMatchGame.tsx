import React, { useState, useEffect } from 'react';
import { MemoryMatchQ } from '../types';

export const MemoryMatchGame: React.FC<{
  data: MemoryMatchQ;
  onCorrect: () => void;
}> = ({ data, onCorrect }) => {
  const [cards, setCards] = useState<{ id: string; text: string; type: 'en' | 'vi'; isMatched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);

  useEffect(() => {
    const newCards: any[] = [];
    data.pairs.forEach((p, idx) => {
      newCards.push({ id: `en_${idx}`, text: p.english, type: 'en', isMatched: false });
      newCards.push({ id: `vi_${idx}`, text: p.vietnamese, type: 'vi', isMatched: false });
    });
    // Shuffle
    setCards(newCards.sort(() => Math.random() - 0.5));
    setFlipped([]);
    setMatchedPairs(0);
  }, [data]);

  const handleFlip = (idx: number) => {
    if (flipped.length === 2 || cards[idx].isMatched || flipped.includes(idx)) return;
    
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const card1 = cards[newFlipped[0]];
      const card2 = cards[newFlipped[1]];
      
      const isPair = card1.id.split('_')[1] === card2.id.split('_')[1];

      setTimeout(() => {
        if (isPair) {
          setCards(prev => prev.map((c, i) => newFlipped.includes(i) ? { ...c, isMatched: true } : c));
          setMatchedPairs(prev => {
            const next = prev + 1;
            if (next === data.pairs.length) onCorrect();
            return next;
          });
        }
        setFlipped([]);
      }, 1000);
    }
  };

  return (
    <div className="p-4 bg-white rounded-3xl shadow-inner border-4 border-slate-100">
      <div className="grid grid-cols-4 gap-3">
        {cards.map((c, idx) => (
          <div
            key={idx}
            onClick={() => handleFlip(idx)}
            className={`aspect-square sm:aspect-auto sm:h-32 flex items-center justify-center p-2 rounded-2xl cursor-pointer text-center text-sm sm:text-lg font-black transition-all transform ${
              c.isMatched ? 'bg-green-100 border-green-400 text-green-700 opacity-50 scale-95 border-2' :
              flipped.includes(idx) ? 'bg-brand-100 border-brand-400 text-brand-800 scale-105 border-4' :
              'bg-slate-200 border-slate-300 text-transparent border-b-8 hover:-translate-y-1'
            }`}
          >
            {(flipped.includes(idx) || c.isMatched) ? c.text : '?'}
          </div>
        ))}
      </div>
    </div>
  );
};
