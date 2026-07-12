import React, { useState, useEffect } from 'react';
import { PracticeContent } from '../types';
import { MemoryMatchGame } from './MemoryMatchGame';
import { OddOneOutGame } from './OddOneOutGame';
import { WordGuessGame } from './WordGuessGame';
import { EmojiDecodeGame } from './EmojiDecodeGame';

interface MegaChallengeProps {
  megaData: PracticeContent['megaTest'];
  onScoresUpdate?: (scores: { 
    mc: number, 
    memoryMatch: number, 
    oddOneOut: number, 
    wordGuess: number, 
    emojiDecode: number 
  }) => void;
}

// Collapsible Explanation Component
const CollapsibleExplanation: React.FC<{
  isCorrect: boolean;
  explanation: string;
  correctAnswer?: string;
}> = ({ isCorrect, explanation, correctAnswer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`mt-3 rounded-2xl border-l-4 overflow-hidden transition-all ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-amber-50 border-amber-500'}`}>
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{isCorrect ? '🌟' : '💡'}</span>
          <span className={`font-bold text-sm ${isCorrect ? 'text-green-700' : 'text-amber-700'}`}>
            {isCorrect ? 'Tuyệt vời! Con giỏi lắm!' : 'Chưa đúng rồi!'}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1 text-xs font-bold bg-white/50 rounded-lg hover:bg-white/80 transition-all"
        >
          {isOpen ? '▲ Thu gọn' : '▼ Xem giải thích'}
        </button>
      </div>
      <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 space-y-2">
          {!isCorrect && correctAnswer && (
            <div className="bg-white/50 p-2 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Đáp án đúng:</p>
              <p className="font-bold text-green-700 text-sm">{correctAnswer}</p>
            </div>
          )}
          {explanation && (
            <p className="text-xs italic text-slate-600 leading-relaxed">{explanation}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const MegaChallenge: React.FC<MegaChallengeProps> = ({ megaData, onScoresUpdate }) => {
  const [activeZone, setActiveZone] = useState<'mc' | 'memoryMatch' | 'oddOneOut' | 'wordGuess' | 'emojiDecode'>('mc');
  
  // State for MC quiz
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  // States for other games
  const [memoryMatchScore, setMemoryMatchScore] = useState(0);
  const [oddOneOutState, setOddOneOutState] = useState<Record<string, boolean>>({});
  const [wordGuessState, setWordGuessState] = useState<Record<string, boolean>>({});
  const [emojiDecodeState, setEmojiDecodeState] = useState<Record<string, boolean>>({});

  const handleAnswer = (qId: string, val: any) => {
    if (submitted[qId]) return;
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const checkFinal = (qId: string, isCorrect: boolean) => {
    setSubmitted(prev => ({ ...prev, [qId]: true }));
  };

  const calculateScores = () => {
    let mcCorrect = 0;
    if (megaData.multipleChoice) {
      megaData.multipleChoice.forEach(q => {
        if (submitted[q.id] && answers[q.id] === q.correctAnswer) mcCorrect++;
      });
    }

    let oddOneOutCorrect = 0;
    Object.values(oddOneOutState).forEach(isCorrect => { if (isCorrect) oddOneOutCorrect++; });

    let wordGuessCorrect = 0;
    Object.values(wordGuessState).forEach(isCorrect => { if (isCorrect) wordGuessCorrect++; });

    let emojiDecodeCorrect = 0;
    Object.values(emojiDecodeState).forEach(isCorrect => { if (isCorrect) emojiDecodeCorrect++; });

    return {
      mc: mcCorrect,
      memoryMatch: memoryMatchScore,
      oddOneOut: oddOneOutCorrect,
      wordGuess: wordGuessCorrect,
      emojiDecode: emojiDecodeCorrect
    };
  };

  useEffect(() => {
    if (onScoresUpdate) {
      onScoresUpdate(calculateScores());
    }
  }, [submitted, memoryMatchScore, oddOneOutState, wordGuessState, emojiDecodeState, megaData]);

  if (!megaData) return null;

  const scores = calculateScores();
  
  const totalAnswered = 
    Object.keys(submitted).length +
    (memoryMatchScore > 0 ? 1 : 0) + // Treat memory match as 1 big block or sum of pairs. Wait, in history we track pairs. We'll just display overall progress differently.
    Object.keys(oddOneOutState).length +
    Object.keys(wordGuessState).length +
    Object.keys(emojiDecodeState).length;

  const totalCorrect = scores.mc + scores.memoryMatch + scores.oddOneOut + scores.wordGuess + scores.emojiDecode;

  const tabs = [
    { id: 'mc', label: '📝 Trắc nghiệm', count: megaData.multipleChoice?.length || 0 },
    { id: 'wordGuess', label: '🕵️ Đoán chữ', count: megaData.wordGuess?.length || 0 },
    { id: 'memoryMatch', label: '🎴 Lật thẻ', count: megaData.memoryMatch?.length || 0 },
    { id: 'oddOneOut', label: '🔍 Tìm điểm khác', count: megaData.oddOneOut?.length || 0 },
    { id: 'emojiDecode', label: '😎 Emoji', count: megaData.emojiDecode?.length || 0 },
  ].filter(t => t.count > 0);

  return (
    <div className="bg-brand-900 rounded-[3rem] shadow-xl border-[8px] border-brand-800 overflow-hidden mb-12 font-sans">
      <div className="bg-brand-800 p-6 text-center border-b-2 border-brand-700">
        <h2 className="text-xl md:text-2xl font-black text-white uppercase italic mb-4 tracking-tighter">🚀 THỬ THÁCH ĐẶC BIỆT 🚀</h2>
        
        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveZone(tab.id as any)}
              className={`px-4 py-2 rounded-xl font-bold text-sm sm:text-base transition-all ${
                activeZone === tab.id 
                  ? 'bg-brand-500 text-white shadow-lg scale-105' 
                  : 'bg-white/10 text-brand-200 hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {totalAnswered > 0 && (
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
            <span className="text-white font-bold text-sm">Điểm tích luỹ: {totalCorrect}</span>
          </div>
        )}
      </div>

      <div className="p-4 md:p-8 bg-white/5 min-h-[400px]">
        {activeZone === 'mc' && (
          <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {megaData.multipleChoice?.map((q, idx) => (
              <div key={q.id} className="bg-white p-4 md:p-6 rounded-[2rem] shadow-lg border-2 border-slate-50 transition-all hover:border-brand-200">
                <div className="mb-4">
                  <p className="font-black text-base md:text-lg text-slate-800 flex gap-3 leading-tight">
                    <span className="bg-brand-100 text-brand-600 px-3 py-0.5 rounded-lg h-fit text-sm shrink-0">Q{idx + 1}</span>
                    <span className="break-words">{q.question}</span>
                  </p>
                  {q.vietnameseHint && (
                    <p className="text-sm text-brand-600 italic mt-1 ml-[3.25rem] bg-brand-50 p-2 rounded-lg border border-brand-100">
                      💡 {q.vietnameseHint}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(q.options || []).map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => { handleAnswer(q.id, i); checkFinal(q.id, i === q.correctAnswer); }}
                      disabled={submitted[q.id]}
                      className={`p-4 rounded-xl border-2 font-bold text-left text-sm md:text-base transition-all ${submitted[q.id]
                        ? i === q.correctAnswer
                          ? 'bg-green-100 border-green-500 text-green-700'
                          : answers[q.id] === i
                            ? 'bg-red-100 border-red-500 text-red-700'
                            : 'bg-slate-50 opacity-50'
                        : 'bg-white border-slate-50 hover:border-brand-300 hover:bg-brand-50 active:scale-[0.98]'
                      }`}
                    >
                      <span className="mr-3 text-slate-300">{String.fromCharCode(65 + i)}.</span> {opt}
                    </button>
                  ))}
                </div>
                {submitted[q.id] && (
                  <CollapsibleExplanation
                    isCorrect={answers[q.id] === q.correctAnswer}
                    explanation={q.explanation || ''}
                    correctAnswer={`${String.fromCharCode(65 + q.correctAnswer)}. ${q.options[q.correctAnswer]}`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {activeZone === 'memoryMatch' && megaData.memoryMatch && (
          <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            {megaData.memoryMatch.map((q, idx) => (
              <MemoryMatchGame 
                key={q.id || idx} 
                data={q} 
                onCorrect={() => setMemoryMatchScore(prev => prev + 1)} 
              />
            ))}
          </div>
        )}

        {activeZone === 'oddOneOut' && (
          <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            {megaData.oddOneOut?.map((q, idx) => (
              <OddOneOutGame 
                key={q.id || idx} 
                data={q} 
                isSubmitted={oddOneOutState[q.id] !== undefined}
                onAnswer={(isCorrect) => setOddOneOutState(prev => ({ ...prev, [q.id]: isCorrect }))}
                idx={idx}
              />
            ))}
          </div>
        )}

        {activeZone === 'wordGuess' && (
          <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            {megaData.wordGuess?.map((q, idx) => (
              <WordGuessGame 
                key={q.id || idx} 
                data={q} 
                isSubmitted={wordGuessState[q.id] !== undefined}
                onAnswer={(isCorrect) => setWordGuessState(prev => ({ ...prev, [q.id]: isCorrect }))} 
              />
            ))}
          </div>
        )}

        {activeZone === 'emojiDecode' && (
          <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            {megaData.emojiDecode?.map((q, idx) => (
              <EmojiDecodeGame 
                key={q.id || idx} 
                data={q} 
                isSubmitted={emojiDecodeState[q.id] !== undefined}
                onAnswer={(isCorrect) => setEmojiDecodeState(prev => ({ ...prev, [q.id]: isCorrect }))} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
