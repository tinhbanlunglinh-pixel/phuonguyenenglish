import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MemoryMatchQ } from '../types';

interface MemoryMatchGameProps {
  data: MemoryMatchQ;
  onComplete: (score: number) => void;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ data, onComplete }) => {
  const [cards, setCards] = useState<{ id: string; text: string; type: 'en' | 'vi'; isMatched: boolean; displayIndex: number }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds = 1 minute
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const completedRef = useRef(false);

  const totalPairs = data.pairs.length;

  // Initialize cards
  useEffect(() => {
    const newCards: any[] = [];
    data.pairs.forEach((p, idx) => {
      newCards.push({ id: `en_${idx}`, text: p.english, type: 'en', isMatched: false });
      newCards.push({ id: `vi_${idx}`, text: p.vietnamese, type: 'vi', isMatched: false });
    });
    // Shuffle and assign display index
    const shuffled = newCards.sort(() => Math.random() - 0.5).map((card, i) => ({
      ...card,
      displayIndex: i + 1,
    }));
    setCards(shuffled);
    setFlipped([]);
    setMatchedPairs(0);
    setTimeLeft(60);
    setGameStarted(false);
    setGameFinished(false);
    completedRef.current = false;
  }, [data]);

  // Timer countdown
  useEffect(() => {
    if (gameStarted && !gameFinished && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    // Time's up
    if (gameStarted && timeLeft === 0 && !gameFinished) {
      setGameFinished(true);
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete(matchedPairs);
      }
    }
  }, [gameStarted, gameFinished, timeLeft, matchedPairs, onComplete]);

  // Check if all pairs are matched
  useEffect(() => {
    if (matchedPairs === totalPairs && totalPairs > 0 && gameStarted && !gameFinished) {
      setGameFinished(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!completedRef.current) {
        completedRef.current = true;
        // Completed all pairs within time!
        onComplete(totalPairs);
      }
    }
  }, [matchedPairs, totalPairs, gameStarted, gameFinished, onComplete]);

  const handleFlip = (idx: number) => {
    if (gameFinished) return;
    if (flipped.length === 2 || cards[idx].isMatched || flipped.includes(idx)) return;
    
    // Start timer on first flip
    if (!gameStarted) {
      setGameStarted(true);
    }

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const card1 = cards[newFlipped[0]];
      const card2 = cards[newFlipped[1]];
      
      const isPair = card1.id.split('_')[1] === card2.id.split('_')[1] && card1.type !== card2.type;

      setTimeout(() => {
        if (isPair) {
          setCards(prev => prev.map((c, i) => newFlipped.includes(i) ? { ...c, isMatched: true } : c));
          setMatchedPairs(prev => prev + 1);
        }
        setFlipped([]);
      }, 800);
    }
  };

  // Timer display formatting
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timerPercent = (timeLeft / 60) * 100;
  const isUrgent = timeLeft <= 15;

  return (
    <div className="p-4 sm:p-6 bg-white rounded-3xl shadow-inner border-4 border-slate-100">
      {/* Header with Timer */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎴</span>
          <div>
            <h3 className="font-bold text-slate-700 text-lg">Memory Match</h3>
            <p className="text-xs text-slate-400">Match {totalPairs} pairs • {totalPairs} points</p>
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg transition-all ${
          gameFinished 
            ? matchedPairs === totalPairs ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            : isUrgent ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-brand-100 text-brand-700'
        }`}>
          <span className="text-xl">{gameFinished ? (matchedPairs === totalPairs ? '✅' : '⏰') : '⏱️'}</span>
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full mb-4 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            isUrgent ? 'bg-red-500' : 'bg-brand-500'
          }`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Progress */}
      <div className="flex justify-center gap-1 mb-4">
        {Array.from({ length: totalPairs }).map((_, i) => (
          <div key={i} className={`w-8 h-2 rounded-full transition-all ${
            i < matchedPairs ? 'bg-green-500' : 'bg-slate-200'
          }`} />
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
        {cards.map((c, idx) => (
          <div
            key={idx}
            onClick={() => handleFlip(idx)}
            className={`aspect-square sm:aspect-auto sm:h-28 flex flex-col items-center justify-center p-2 rounded-2xl cursor-pointer text-center font-black transition-all transform relative ${
              c.isMatched ? 'bg-green-100 border-green-400 text-green-700 opacity-50 scale-95 border-2' :
              flipped.includes(idx) ? 'bg-brand-100 border-brand-400 text-brand-800 scale-105 border-4' :
              gameFinished ? 'bg-slate-200 border-slate-300 text-slate-400 border-b-4 cursor-not-allowed' :
              'bg-slate-200 border-slate-300 text-transparent border-b-8 hover:-translate-y-1'
            }`}
          >
            {/* Card content */}
            {(flipped.includes(idx) || c.isMatched) 
              ? <>
                  <span className={`text-[10px] sm:text-xs uppercase font-bold mb-1 ${c.type === 'en' ? 'text-blue-400' : 'text-orange-400'}`}>
                    {c.type === 'en' ? 'EN' : 'VI'}
                  </span>
                  <span className="text-xs sm:text-base leading-tight">{c.text}</span>
                </>
              : <span className="text-xl sm:text-2xl font-black text-slate-500">{c.displayIndex}</span>
            }
          </div>
        ))}
      </div>

      {/* Game Result */}
      {gameFinished && (
        <div className={`mt-4 p-4 rounded-xl text-center ${
          matchedPairs === totalPairs ? 'bg-green-50 border-2 border-green-200' : 'bg-amber-50 border-2 border-amber-200'
        }`}>
          {matchedPairs === totalPairs ? (
            <p className="font-bold text-green-700 text-lg">
              🎉 Excellent! All {totalPairs} pairs matched! +{totalPairs} points
            </p>
          ) : (
            <p className="font-bold text-amber-700 text-lg">
              ⏰ Time's up! Matched {matchedPairs}/{totalPairs} pairs. +{matchedPairs} points
            </p>
          )}
        </div>
      )}

      {/* Start hint */}
      {!gameStarted && !gameFinished && (
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-400 italic animate-pulse">👆 Flip a card to start the timer!</p>
        </div>
      )}
    </div>
  );
};
