import React, { useState, useRef, useEffect } from 'react';
import { generateLessonPlan, fileToBase64, hasApiKey } from './services/geminiService';
import { LessonPlan } from './types';
import { VocabularySection } from './components/VocabularySection';
import { MegaChallenge } from './components/MegaChallenge';
import { UploadZone } from './components/UploadZone';
import { LessonCertificate } from './components/LessonCertificate';
import { LearningHistory } from './components/LearningHistory';
import { ApiKeySettingsModal } from './components/ApiKeySettingsModal';
import { saveLessonRecord, generateRecordId } from './services/historyService';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

interface LogoProps {
  className?: string;
  color?: string;
}

const CoPhuongUyenLogo = ({ className = "w-16 h-16", color = "currentColor" }: LogoProps) => (<div className={`relative ${className} flex items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-md bg-white`}><img src="https://i.postimg.cc/L4nGqs4D/650361495-1628861905304764-7370063187505837857-n.jpg" className="w-full h-full object-cover" alt="Cô Phượng Uyên Logo" /></div>);

function App() {
  // Simplified - only keeping the planner/learning tab
  const [plannerMode, setPlannerMode] = useState<'topic' | 'text' | 'image'>('topic');
  const [topic, setTopic] = useState('');
  const [lessonText, setLessonText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [megaScores, setMegaScores] = useState({ mc: 0, memoryMatch: 0, oddOneOut: 0, wordGuess: 0, emojiDecode: 0 });
  const [showCertificate, setShowCertificate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const savedRef = useRef(false);

  // Auto-open API Key modal if no key is set
  useEffect(() => {
    if (!hasApiKey()) {
      setShowApiKeyModal(true);
    }
  }, []);



  const totalCorrectCount = megaScores.mc + megaScores.memoryMatch + megaScores.oddOneOut + megaScores.wordGuess + megaScores.emojiDecode;
  const totalQuestions = (lesson?.practice?.megaTest?.multipleChoice?.length || 0) +
    (lesson?.practice?.megaTest?.memoryMatch?.[0]?.pairs?.length || 0) +
    (lesson?.practice?.megaTest?.oddOneOut?.length || 0) +
    (lesson?.practice?.megaTest?.wordGuess?.length || 0) +
    (lesson?.practice?.megaTest?.emojiDecode?.length || 0);

  const handleGenerate = async () => {

    if (plannerMode === 'topic' && !topic.trim()) { setError("Hãy nhập chủ đề bài học con nhé!"); return; }
    if (plannerMode === 'text' && !lessonText.trim()) { setError("Hãy dán nội dung bài học vào đây!"); return; }
    if (plannerMode === 'image' && selectedFiles.length === 0) { setError("Hãy chọn ít nhất một tấm ảnh tài liệu!"); return; }

    setLoading(true);
    setError(null);
    setLesson(null);
    setShowCertificate(false);
    savedRef.current = false;

    try {
      let base64Images: string[] = [];
      if (plannerMode === 'image' && selectedFiles.length > 0) {
        base64Images = await Promise.all(selectedFiles.map(file => fileToBase64(file)));
      }
      const data = await generateLessonPlan(
        plannerMode === 'topic' ? topic : undefined,
        plannerMode === 'text' ? lessonText : undefined,
        base64Images
      );
      setLesson(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      const rawError = err.message || "Lỗi không xác định";
      if (rawError.includes("API_KEY_REQUIRED")) {
        setError("Chưa có API Key! Vui lòng nhập API Key để sử dụng.");
        setShowApiKeyModal(true);
      } else if (rawError.includes("429") || rawError.includes("RESOURCE_EXHAUSTED")) {
        setError("LỖI 429: Hết hạn mức sử dụng (Quota Exhausted). Cô hãy đổi API Key khác nhé!");
      } else if (rawError.includes("401") || rawError.includes("API_KEY_INVALID")) {
        setError("LỖI 401: Mã API Key không hợp lệ! Cô hãy kiểm tra lại nhé!");
      } else {
        setError(`LỖI HỆ THỐNG: ${rawError}`);
      }
    } finally {
      setLoading(false);
    }
  };

  function calculateTotalScore() {
    const total = totalQuestions || 1;
    const raw = (totalCorrectCount / total) * 10;
    return Math.round(raw * 10) / 10;
  }

  function formatScore(score: number): string {
    return score.toFixed(1).replace('.', ',');
  }

  const totalScore = calculateTotalScore();

  function getEvaluation(score: number) {
    const s = score || 0;
    if (s >= 9) return { text: "HOÀN THÀNH XUẤT SẮC", emoji: "🌟", level: "EXCELLENT", praise: "Con là một ngôi sao sáng nhất lớp CÔ PHƯỢNG UYÊN!" };
    if (s >= 8) return { text: "HOÀN THÀNH TIÊU BIỂU", emoji: "🥇", level: "OUTSTANDING", praise: "Con đã làm rất tốt!\nHãy tiếp tục học tập và chinh phục nhiều thử thách mới nhé!" };
    if (s >= 7) return { text: "HOÀN THÀNH TỐT", emoji: "⭐", level: "GREAT JOB", praise: "Con làm bài rất tuyệt vời, tiếp tục phát huy nhé!" };
    if (s >= 6) return { text: "HOÀN THÀNH", emoji: "👍", level: "GOOD EFFORT", praise: "Con đã nỗ lực rất nhiều, CÔ PHƯỢNG UYÊN tự hào về con!" };
    return { text: "CẦN CỐ GẮNG HƠN NỮA", emoji: "🌱", level: "KEEP IT UP", praise: "Đừng nản lòng con nhé, bài sau mình làm tốt hơn nào!" };
  }

  const evaluation = getEvaluation(totalScore);

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col font-serif text-slate-900">
      <header className="bg-brand-700 border-b-4 border-brand-800 sticky top-0 z-50 shadow-xl">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 h-16 sm:h-24 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 cursor-pointer">
            <CoPhuongUyenLogo className="w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-lg" color="#2563eb" />
            <div className="flex flex-col">
              <h1 className="text-base sm:text-xl md:text-3xl font-black text-highlight-400 uppercase tracking-tighter font-display">CÔ PHƯỢNG UYÊN</h1>
              <span className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-[0.1em] sm:tracking-[0.2em] opacity-90 font-sans hidden xs:block">Learn today, better tomorrow</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1 sm:gap-2 bg-white/10 hover:bg-white/20 px-2 sm:px-3 py-1 sm:py-2 rounded-lg transition-all"
            >
              <span className="text-base sm:text-lg">📋</span>
              <span className="text-white text-xs sm:text-sm font-bold hidden sm:block">Lịch sử</span>
            </button>

            <button
              onClick={() => setShowApiKeyModal(true)}
              className="flex items-center gap-1 sm:gap-2 bg-white/10 hover:bg-white/20 px-2 sm:px-3 py-1 sm:py-2 rounded-lg transition-all relative"
            >
              <span className="text-base sm:text-lg">⚙️</span>
              <span className="text-white text-xs sm:text-sm font-bold hidden sm:block">API Key</span>
              {!hasApiKey() && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Red warning when no API key */}
      {!hasApiKey() && (
        <div
          onClick={() => setShowApiKeyModal(true)}
          className="bg-red-50 border-b-2 border-red-200 py-2 px-4 text-center cursor-pointer hover:bg-red-100 transition-all"
        >
          <p className="text-red-600 text-sm font-bold flex items-center justify-center gap-2">
            <span className="animate-pulse">🔴</span>
            Lấy API Key để sử dụng app — Bấm vào đây để thiết lập
            <span className="text-xs">→</span>
          </p>
        </div>
      )}

      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-10 flex-grow w-full relative">
        <div>
          <div className="space-y-8 sm:space-y-16">
            {!lesson ? (
              <div className="bg-white rounded-2xl sm:rounded-[3rem] shadow-xl border-b-4 sm:border-b-[12px] border-r-4 sm:border-r-[12px] border-brand-100 p-4 sm:p-8 md:p-16 max-w-4xl mx-auto animate-fade-in text-center relative overflow-hidden ring-2 sm:ring-4 ring-white">
                <div className="absolute top-0 left-0 w-full h-3 bg-brand-500"></div>
                <CoPhuongUyenLogo className="w-20 h-20 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-8 drop-shadow-xl" color="#2563eb" />
                <h2 className="text-lg sm:text-2xl md:text-4xl font-black text-brand-800 mb-2 uppercase tracking-tighter font-display">Học Tiếng Anh cùng CÔ PHƯỢNG UYÊN</h2>
                <p className="text-xs sm:text-sm font-black text-slate-400 mb-4 sm:mb-8 uppercase italic opacity-60">"Learn today, better tomorrow"</p>

                <div className="space-y-8 text-left">
                  <div className="flex bg-slate-100 p-2 rounded-2xl gap-2 shadow-inner">
                    {[{ id: 'topic', label: 'Chủ đề', icon: '📝' }, { id: 'text', label: 'Văn bản', icon: '📄' }, { id: 'image', label: 'Hình ảnh', icon: '📸' }].map(m => (
                      <button key={m.id} onClick={() => { setPlannerMode(m.id as any); setTopic(''); setLessonText(''); setSelectedFiles([]); setError(null); }} className={`flex-1 py-3 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all ${plannerMode === m.id ? 'bg-brand-500 text-white shadow-lg scale-105' : 'text-slate-500 hover:bg-white'}`}>{m.icon} {m.label}</button>
                    ))}
                  </div>
                  <div className="min-h-[150px]">
                    {plannerMode === 'topic' && <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Nhập chủ đề (VD: Animals, My Family...)" className="w-full p-6 text-2xl rounded-2xl border-4 border-brand-50 font-black bg-brand-50/50 outline-none text-brand-900" />}
                    {plannerMode === 'text' && <textarea value={lessonText} onChange={e => setLessonText(e.target.value)} placeholder="Dán nội dung bài học vào đây..." rows={6} className="w-full p-6 text-lg rounded-2xl border-4 border-brand-50 bg-brand-50/50 resize-none font-black text-slate-700 outline-none" />}
                    {plannerMode === 'image' && <UploadZone onFilesSelect={setSelectedFiles} isLoading={loading} fileCount={selectedFiles.length} />}
                  </div>
                  <button onClick={handleGenerate} disabled={loading} className="w-full py-6 bg-brand-500 border-b-8 border-brand-700 text-white rounded-3xl font-black text-2xl shadow-xl transform active:translate-y-2 active:border-b-0 uppercase tracking-tighter">
                    {loading ? 'ĐANG SOẠN BÀI SIÊU TỐC...' : '🚀 BẮT ĐẦU NGAY!'}
                  </button>
                  {error && <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 font-black text-lg text-center animate-bounce shadow-md">⚠️ {error}</div>}
                </div>
              </div>
            ) : (
              <div className="space-y-8 sm:space-y-16 animate-fade-in">
                <div className="text-center relative py-6 sm:py-10 bg-white rounded-2xl sm:rounded-[4rem] shadow-xl border-2 sm:border-4 border-brand-50 ring-2 sm:ring-4 ring-white overflow-hidden">
                  <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                    <button
                      onClick={() => {
                        setLesson(null);
                        setTopic('');
                        setLessonText('');
                        setSelectedFiles([]);
                        setStudentName('');
                        setMegaScores({ mc: 0, memoryMatch: 0, oddOneOut: 0, wordGuess: 0, emojiDecode: 0 });
                        setShowCertificate(false);
                        setError(null);
                      }}
                      className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-3 py-2 sm:px-5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-95"
                    >
                      <span className="text-base sm:text-lg">✨</span>
                      <span className="hidden sm:inline">Tạo bài học mới</span>
                      <span className="sm:hidden">Bài mới</span>
                    </button>
                  </div>

                  <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-brand-800 uppercase font-display mb-4 sm:mb-6 px-4 break-words">{lesson.topic}</h1>
                  <div className="flex flex-col items-center gap-4">
                    <label className="text-brand-600 font-black uppercase tracking-[0.2em] text-base font-sans">Chào mừng con:</label>
                    <input type="text" placeholder="Nhập tên của con nhé..." value={studentName} onChange={e => setStudentName(e.target.value)} className="p-4 w-full max-w-xl rounded-2xl border-4 border-brand-50 font-black text-2xl text-center outline-none bg-brand-50/50" />
                  </div>
                </div>

                <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-lg border border-brand-100">
                  <VocabularySection items={lesson.vocabulary} />
                </div>

                <div className="bg-highlight-400 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border-4 border-white">
                  <h2 className="text-base sm:text-xl font-bold text-brand-900 uppercase tracking-tight mb-3 sm:mb-4 flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">📖</span> Ngữ pháp quan trọng
                  </h2>
                  <div className="bg-white/95 p-3 sm:p-5 rounded-lg sm:rounded-xl shadow-md">
                    <h3 className="text-base sm:text-xl font-bold text-brand-700 mb-2">{lesson.grammar?.topic}</h3>
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-4 border-l-3 border-brand-500 pl-3">{lesson.grammar?.explanation}</p>
                    <div className="space-y-2">
                      <h4 className="text-xs sm:text-sm font-bold text-brand-600 uppercase">Ví dụ:</h4>
                      <div className="grid gap-2">
                        {(lesson.grammar?.examples || []).map((ex, i) => (
                          <div key={i} className="bg-brand-50 p-2 sm:p-3 rounded-lg border border-brand-100 flex items-center gap-2">
                            <span className="text-lg">✏️</span>
                            <p className="text-sm sm:text-base text-slate-700 italic">"{ex}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {lesson.practice?.megaTest && <MegaChallenge megaData={lesson.practice.megaTest} onScoresUpdate={setMegaScores} />}

                <div className="text-center py-8 sm:py-12 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-brand-100 flex flex-col items-center gap-4 sm:gap-6 relative overflow-hidden">
                  <CoPhuongUyenLogo className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg" color="#2563eb" />
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl sm:text-6xl font-bold text-brand-600 leading-none">{formatScore(totalScore)}</span>
                      <span className="text-xl sm:text-2xl font-bold text-slate-300">/10</span>
                    </div>
                    <div className="text-sm sm:text-base font-semibold text-brand-500 bg-brand-50 px-4 py-1 rounded-full">
                      Số câu đúng: <span className="text-brand-700 font-bold">{totalCorrectCount}/{totalQuestions}</span>
                    </div>
                    <div className={`px-6 py-2 sm:px-8 sm:py-3 rounded-full font-bold text-base sm:text-xl shadow-lg ${totalScore >= 5 ? 'bg-brand-500 text-white' : 'bg-orange-500 text-white'}`}>
                      {evaluation.emoji} {evaluation.text}
                    </div>

                    <button
                      onClick={() => {
                        setShowCertificate(true);
                        if (!savedRef.current && lesson) {
                          savedRef.current = true;
                          saveLessonRecord({
                            id: generateRecordId(),
                            date: new Date().toISOString(),
                            topic: lesson.topic,
                            score: totalScore,
                            totalCorrect: totalCorrectCount,
                            totalQuestions: totalQuestions,
                            skillScores: { ...megaScores },
                            studentName: studentName || 'Ẩn danh',
                          });
                        }
                      }}
                      className="mt-4 px-6 py-3 sm:px-8 sm:py-4 bg-emerald-500 text-white rounded-xl font-bold text-sm sm:text-base shadow-lg hover:bg-emerald-400 transition-all"
                    >
                      🏆 Xuất chứng nhận
                    </button>
                  </div>
                </div>

                {showCertificate && (
                  <LessonCertificate
                    studentName={studentName}
                    topic={lesson.topic}
                    score={totalScore}
                    totalCorrect={totalCorrectCount}
                    totalQuestions={totalQuestions}
                    evaluation={evaluation}
                    onClose={() => setShowCertificate(false)}
                  />
                )}
              </div>
            )}

            {showHistory && <LearningHistory onClose={() => setShowHistory(false)} />}
          </div>
        </div>
      </main>

      <footer className="bg-gradient-to-b from-blue-900 to-[#1a1c3d] text-white pt-16 pb-8 border-t-[8px] border-blue-800 font-sans">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 items-start mb-16">
            {/* Column 1 */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-2xl w-[88px] h-[88px] flex-shrink-0 flex items-center justify-center shadow-lg">
                  <CoPhuongUyenLogo className="w-16 h-16" />
                </div>
                <div>
                  <h3 className="font-black text-xl md:text-2xl uppercase leading-tight text-white mb-1">Trung tâm Ngoại ngữ Cô Phượng Uyên</h3>
                  <p className="text-blue-200 font-bold text-xs uppercase tracking-wider">LEARN TODAY, BETTER TOMORROW 🌟</p>
                </div>
              </div>
              <p className="text-blue-100 text-sm md:text-base leading-relaxed italic">
                Truyền cảm hứng yêu thích tiếng Anh – Xây nền tảng vững chắc – Học hiệu quả – Hiểu sâu – Sử dụng thành thạo.
              </p>
            </div>

            {/* Column 2 */}
            <div className="space-y-6">
              <h4 className="font-black text-white text-lg uppercase tracking-widest flex items-center gap-3 border-l-4 border-blue-400 pl-3">
                <span className="text-red-400">📍</span> THÔNG TIN ĐÀO TẠO
              </h4>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <span className="text-2xl mt-1">🏛️</span>
                  <div>
                    <p className="font-bold text-blue-200 text-xs uppercase tracking-widest mb-1">GIÁM ĐỐC TRUNG TÂM:</p>
                    <p className="font-bold text-white text-base">Võ Thùy Phượng Uyên</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-2xl mt-1">✨</span>
                  <div>
                    <p className="font-bold text-blue-200 text-xs uppercase tracking-widest mb-1">Phương châm:</p>
                    <p className="font-bold text-white text-sm leading-relaxed">
                      Học vững từ gốc- ứng dụng thực tế- tự tin hội nhập toàn cầu
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="space-y-6">
              <h4 className="font-black text-white text-lg uppercase tracking-widest flex items-center gap-3 border-l-4 border-yellow-400 pl-3">
                <span className="text-yellow-400">✨</span> LIÊN HỆ ĐĂNG KÝ
              </h4>
              <div className="space-y-4">
                <a href="tel:0985846325" className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl transition-all group">
                  <span className="text-3xl group-hover:scale-110 transition-transform">📱</span>
                  <div>
                    <p className="font-bold text-blue-200 text-[10px] uppercase tracking-widest mb-1">HOTLINE / ZALO CÔ PHƯỢNG UYÊN</p>
                    <p className="font-black text-white text-xl">0985.846.325</p>
                  </div>
                </a>
                <a href="https://www.facebook.com/profile.php?id=100045429101693" target="_blank" className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl transition-all group">
                  <span className="text-3xl group-hover:scale-110 transition-transform">🌐</span>
                  <div>
                    <p className="font-bold text-blue-200 text-[10px] uppercase tracking-widest mb-1">FACEBOOK</p>
                    <p className="font-bold text-white text-sm">Ghé thăm fanpage của Trung Tâm.</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-blue-200 text-sm font-medium">© 2026 Trung Tâm Ngoại Ngữ Cô Phượng Uyên. Learn today, better tomorrow.</p>
            <div className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-3 hover:bg-white/10 transition-colors">
              <span>👑</span>
              <span className="text-blue-100 text-sm font-bold">Chăm chỉ rèn luyện – Chinh phục tiếng Anh</span>
            </div>
          </div>
        </div>
      </footer>

      {/* API Key Settings Modal */}
      <ApiKeySettingsModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        mandatory={!hasApiKey()}
      />
    </div>
  );
}
export default App;
