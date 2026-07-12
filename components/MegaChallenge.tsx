import React, { useState, useEffect } from 'react';
import { PracticeContent } from '../types';

interface MegaChallengeProps {
  megaData: PracticeContent['megaTest'];
  onScoresUpdate?: (scores: { mc: number }) => void;
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
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  const handleAnswer = (qId: string, val: any) => {
    if (submitted[qId]) return;
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const checkFinal = (qId: string, isCorrect: boolean) => {
    setSubmitted(prev => ({ ...prev, [qId]: true }));
  };

  const calculateMcScore = () => {
    let correct = 0;
    if (!megaData) return 0;
    (megaData.multipleChoice || []).forEach(q => {
      if (submitted[q.id] && answers[q.id] === q.correctAnswer) correct++;
    });
    return correct;
  };

  useEffect(() => {
    if (onScoresUpdate) {
      onScoresUpdate({ mc: calculateMcScore() });
    }
  }, [submitted, megaData]);

  if (!megaData) return null;

  const mcQuestions = megaData.multipleChoice || [];
  const totalAnswered = Object.keys(submitted).length;
  const totalCorrect = calculateMcScore();

  return (
    <div className="bg-brand-900 rounded-[3rem] shadow-xl border-[8px] border-brand-800 overflow-hidden mb-12 font-sans">
      <div className="bg-brand-800 p-6 text-center border-b-2 border-brand-700">
        <h2 className="text-xl md:text-2xl font-black text-white uppercase italic mb-2 tracking-tighter">📝 QUIZ - KIỂM TRA KIẾN THỨC 📝</h2>
        <p className="text-brand-200 text-sm">{mcQuestions.length} câu hỏi trắc nghiệm</p>
        {totalAnswered > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
            <span className="text-white font-bold text-sm">Kết quả: {totalCorrect}/{totalAnswered}</span>
          </div>
        )}
      </div>

      <div className="p-4 md:p-8 bg-white/5">
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
          {mcQuestions.map((q, idx) => (
            <div key={q.id} className="bg-white p-4 md:p-6 rounded-[2rem] shadow-lg border-2 border-slate-50 transition-all hover:border-brand-200">
              <p className="font-black text-base md:text-lg text-slate-800 mb-4 flex gap-3 leading-tight">
                <span className="bg-brand-100 text-brand-600 px-3 py-0.5 rounded-lg h-fit text-sm shrink-0">Q{idx + 1}</span>
                <span className="break-words">{q.question}</span>
              </p>
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
      </div>
    </div>
  );
};
