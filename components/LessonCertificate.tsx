
import React, { useRef, useEffect, useState } from 'react';
import { toPng } from 'html-to-image';

interface LessonCertificateProps {
  studentName: string;
  topic: string;
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  evaluation: { text: string; emoji: string; praise: string };
  onClose: () => void;
}

/* ── SVG inline helpers ─────────────────────────────────── */

const GoldMedal = () => (
  <svg width="90" height="110" viewBox="0 0 90 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Ribbon */}
    <path d="M30 0 L45 40 L60 0" fill="#1d4ed8" stroke="#1e40af" strokeWidth="1"/>
    <path d="M25 0 L40 35 L45 40 L50 35 L65 0" fill="#2563eb" opacity="0.7"/>
    {/* Medal circle */}
    <circle cx="45" cy="60" r="30" fill="url(#medalGold)" stroke="#b8860b" strokeWidth="3"/>
    <circle cx="45" cy="60" r="24" fill="none" stroke="#daa520" strokeWidth="1.5" strokeDasharray="4 3"/>
    {/* Star in center */}
    <path d="M45 42 L49 53 L61 53 L51 60 L55 71 L45 64 L35 71 L39 60 L29 53 L41 53 Z" fill="#fff8dc" stroke="#b8860b" strokeWidth="0.5"/>
    <defs>
      <radialGradient id="medalGold" cx="0.4" cy="0.35" r="0.6">
        <stop offset="0%" stopColor="#ffd700"/>
        <stop offset="50%" stopColor="#daa520"/>
        <stop offset="100%" stopColor="#b8860b"/>
      </radialGradient>
    </defs>
  </svg>
);

const TrophyIcon = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 8h24v16c0 8-5 14-12 14s-12-6-12-14V8z" fill="url(#trophyGrad)" stroke="#b8860b" strokeWidth="1.5"/>
    <path d="M14 12H8c0 6 3 10 6 12" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round"/>
    <path d="M38 12h6c0 6-3 10-6 12" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round"/>
    <rect x="22" y="38" width="8" height="4" rx="1" fill="#daa520"/>
    <rect x="18" y="42" width="16" height="4" rx="2" fill="#b8860b"/>
    <defs>
      <linearGradient id="trophyGrad" x1="14" y1="8" x2="38" y2="38">
        <stop offset="0%" stopColor="#ffd700"/>
        <stop offset="100%" stopColor="#daa520"/>
      </linearGradient>
    </defs>
  </svg>
);

const LaurelLeft = () => (
  <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g opacity="0.85">
      <path d="M50 75 C45 65 35 60 30 50 C25 40 28 30 35 25" stroke="#daa520" strokeWidth="2" fill="none"/>
      <ellipse cx="32" cy="28" rx="8" ry="5" transform="rotate(-30 32 28)" fill="#ffd700" opacity="0.6"/>
      <ellipse cx="28" cy="38" rx="8" ry="5" transform="rotate(-20 28 38)" fill="#ffd700" opacity="0.6"/>
      <ellipse cx="27" cy="48" rx="8" ry="5" transform="rotate(-10 27 48)" fill="#ffd700" opacity="0.6"/>
      <ellipse cx="30" cy="58" rx="8" ry="5" transform="rotate(5 30 58)" fill="#ffd700" opacity="0.6"/>
      <ellipse cx="38" cy="66" rx="8" ry="5" transform="rotate(15 38 66)" fill="#ffd700" opacity="0.6"/>
    </g>
  </svg>
);

const LaurelRight = () => (
  <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scaleX(-1)' }}>
    <g opacity="0.85">
      <path d="M50 75 C45 65 35 60 30 50 C25 40 28 30 35 25" stroke="#daa520" strokeWidth="2" fill="none"/>
      <ellipse cx="32" cy="28" rx="8" ry="5" transform="rotate(-30 32 28)" fill="#ffd700" opacity="0.6"/>
      <ellipse cx="28" cy="38" rx="8" ry="5" transform="rotate(-20 28 38)" fill="#ffd700" opacity="0.6"/>
      <ellipse cx="27" cy="48" rx="8" ry="5" transform="rotate(-10 27 48)" fill="#ffd700" opacity="0.6"/>
      <ellipse cx="30" cy="58" rx="8" ry="5" transform="rotate(5 30 58)" fill="#ffd700" opacity="0.6"/>
      <ellipse cx="38" cy="66" rx="8" ry="5" transform="rotate(15 38 66)" fill="#ffd700" opacity="0.6"/>
    </g>
  </svg>
);

/* Decorative corner ornament */
const CornerOrnament = ({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const transforms: Record<string, string> = {
    tl: 'rotate(0)',
    tr: 'rotate(90)',
    br: 'rotate(180)',
    bl: 'rotate(270)',
  };
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" style={{ transform: transforms[position] }}>
      <path d="M0 0 Q25 5 25 25 Q5 25 0 0Z" fill="url(#cornerGrad)" opacity="0.7"/>
      <path d="M0 0 Q15 3 18 18 Q3 15 0 0Z" fill="#ffd700" opacity="0.4"/>
      <defs>
        <linearGradient id="cornerGrad" x1="0" y1="0" x2="25" y2="25">
          <stop offset="0%" stopColor="#daa520"/>
          <stop offset="100%" stopColor="#ffd700" stopOpacity="0.3"/>
        </linearGradient>
      </defs>
    </svg>
  );
};




/* ── Alarm clock icon ── */
const AlarmClockIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="16" r="9" stroke="#f59e0b" strokeWidth="2" fill="#fef3c7"/>
    <circle cx="14" cy="16" r="6.5" stroke="#f59e0b" strokeWidth="1"/>
    <line x1="14" y1="16" x2="14" y2="11" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="14" y1="16" x2="18" y2="16" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="6" y1="8" x2="9" y2="10" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="22" y1="8" x2="19" y2="10" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="6" cy="7" r="2" fill="#fbbf24"/>
    <circle cx="22" cy="7" r="2" fill="#fbbf24"/>
  </svg>
);



export const LessonCertificate: React.FC<LessonCertificateProps> = ({
  studentName,
  topic,
  score,
  totalCorrect,
  totalQuestions,
  evaluation,
  onClose
}) => {
  const certRef = useRef<HTMLDivElement>(null);
  const [fullDateStr, setFullDateStr] = useState('');

  useEffect(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    setFullDateStr(`${day}/${month}/${year}`);
  }, []);

  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const downloadCert = async () => {
    if (!certRef.current) return;
    try {
      const originalTransform = certRef.current.style.transform;
      certRef.current.style.transform = 'none';

      const dataUrl = await toPng(certRef.current, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        width: 620,
        height: 877
      });

      certRef.current.style.transform = originalTransform;

      const link = document.createElement('a');
      link.download = `ChungNhan-${studentName || 'HocSinh'}-${fullDateStr}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert("Lỗi tải chứng nhận, vui lòng thử lại!");
    }
  };

  /* Color scheme based on evaluation level */
  const getThemeColors = () => {
    if (score >= 9) return { badge: '#fbbf24', badgeBg: '#fef3c7', badgeBorder: '#f59e0b', badgeText: '#92400e' };
    if (score >= 8) return { badge: '#f59e0b', badgeBg: '#fff7ed', badgeBorder: '#fb923c', badgeText: '#9a3412' };
    if (score >= 7) return { badge: '#60a5fa', badgeBg: '#eff6ff', badgeBorder: '#3b82f6', badgeText: '#1e40af' };
    if (score >= 6) return { badge: '#34d399', badgeBg: '#ecfdf5', badgeBorder: '#10b981', badgeText: '#065f46' };
    return { badge: '#a3e635', badgeBg: '#f7fee7', badgeBorder: '#84cc16', badgeText: '#3f6212' };
  };

  const theme = getThemeColors();

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      {/* Control Bar */}
      <div className="w-full max-w-[640px] flex justify-between items-center mb-4">
        <h2 className="text-white font-bold text-xl">📜 Giấy chứng nhận</h2>
        <div className="flex gap-3">
          <button onClick={downloadCert} className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-400 transition-all flex items-center gap-2">
            💾 Tải về
          </button>
          <button onClick={onClose} className="bg-rose-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-rose-600 transition-all">
            ✕
          </button>
        </div>
      </div>

      {/* Certificate - A4-like portrait ratio */}
      <div className="relative flex items-center justify-center w-full overflow-hidden">
        <div
          ref={certRef}
          style={{
            width: '620px',
            height: '877px',
            background: 'linear-gradient(145deg, #1a2980 0%, #1e40af 30%, #1d4ed8 60%, #1a237e 100%)',
            fontFamily: "'Nunito', 'Roboto', sans-serif",
            position: 'relative',
            overflow: 'hidden',
          }}
          className="rounded-lg shadow-2xl shrink-0 origin-center scale-[0.4] sm:scale-[0.55] md:scale-[0.7] lg:scale-[0.85] xl:scale-[0.95]"
        >
          {/* Background decorative circles */}
          <div style={{
            position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px',
            borderRadius: '50%', background: 'rgba(255,255,255,0.05)'
          }}/>
          <div style={{
            position: 'absolute', bottom: '-40px', left: '-40px', width: '150px', height: '150px',
            borderRadius: '50%', background: 'rgba(255,255,255,0.03)'
          }}/>

          {/* Inner white card */}
          <div style={{
            position: 'absolute',
            top: '14px', left: '14px', right: '14px', bottom: '14px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '3px solid #daa520',
            overflow: 'hidden',
          }}>
            {/* Gold inner border */}
            <div style={{
              position: 'absolute',
              top: '6px', left: '6px', right: '6px', bottom: '6px',
              border: '1.5px solid rgba(218,165,32,0.3)',
              borderRadius: '8px',
              pointerEvents: 'none',
            }}/>

            {/* Corner ornaments */}
            <div style={{ position: 'absolute', top: '8px', left: '8px' }}><CornerOrnament position="tl" /></div>
            <div style={{ position: 'absolute', top: '8px', right: '8px' }}><CornerOrnament position="tr" /></div>
            <div style={{ position: 'absolute', bottom: '8px', right: '8px' }}><CornerOrnament position="br" /></div>
            <div style={{ position: 'absolute', bottom: '8px', left: '8px' }}><CornerOrnament position="bl" /></div>

            {/* Content */}
            <div style={{
              position: 'relative', height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '30px 28px 18px',
            }}>

              {/* ──── Medal at top ──── */}
              <div style={{ position: 'absolute', top: '-8px', right: '40px', zIndex: 10 }}>
                <GoldMedal />
              </div>

              {/* ──── Center name + Header ──── */}
              <div style={{ textAlign: 'center', marginBottom: '6px', marginTop: '12px' }}>
                <p style={{
                  fontSize: '11px', fontWeight: 800, color: '#1d4ed8',
                  textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '6px',
                }}>
                  TRUNG TÂM NGOẠI NGỮ CÔ PHƯỢNG UYÊN
                </p>
              </div>

              {/* ──── Title: GIẤY CHỨNG NHẬN ──── */}
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <h1 style={{
                  fontSize: '36px', fontWeight: 900, color: '#1e40af',
                  textTransform: 'uppercase', letterSpacing: '4px',
                  textShadow: '2px 2px 4px rgba(30,64,175,0.15)',
                  fontFamily: "'Nunito', sans-serif",
                  lineHeight: 1.1,
                }}>
                  GIẤY CHỨNG NHẬN
                </h1>
                <div style={{
                  width: '200px', height: '3px', margin: '6px auto 0',
                  background: 'linear-gradient(90deg, transparent, #daa520, transparent)',
                  borderRadius: '2px',
                }}/>
              </div>

              {/* ──── Subtitle ──── */}
              <p style={{
                fontSize: '13px', color: '#64748b', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '3px',
                marginBottom: '10px',
              }}>
                VINH DANH HỌC VIÊN
              </p>

              {/* ──── Student Name ──── */}
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <h2 style={{
                  fontSize: '34px', fontWeight: 900, color: '#1e293b',
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  letterSpacing: '1px', lineHeight: 1.2,
                }}>
                  {studentName || "Học sinh giỏi"}
                </h2>
                <div style={{
                  width: '180px', height: '2px', margin: '4px auto 0',
                  background: 'linear-gradient(90deg, transparent, #daa520, #daa520, transparent)',
                  borderRadius: '2px',
                }}/>
              </div>

              {/* ──── Challenge description ──── */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <p style={{
                  fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '3px',
                }}>
                  Đã hoàn thành thử thách
                </p>
                <p style={{
                  fontSize: '16px', fontWeight: 800, color: '#1e40af',
                  fontStyle: 'italic', maxWidth: '400px', lineHeight: 1.3,
                }}>
                  {topic}
                </p>
              </div>

              {/* ──── KẾT QUẢ banner ──── */}
              <div style={{
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'white', padding: '4px 32px', borderRadius: '6px',
                fontSize: '13px', fontWeight: 900, letterSpacing: '3px',
                textTransform: 'uppercase', marginBottom: '14px',
                boxShadow: '0 2px 8px rgba(220,38,38,0.3)',
              }}>
                KẾT QUẢ
              </div>

              {/* ──── Stats Row ──── */}
              <div style={{
                display: 'flex', justifyContent: 'center', gap: '12px',
                marginBottom: '16px', width: '100%',
              }}>
                {/* Điểm số */}
                <div style={{
                  background: '#f0f9ff', border: '2px solid #bfdbfe',
                  borderRadius: '12px', padding: '10px 14px', textAlign: 'center',
                  minWidth: '110px', flex: '1', maxWidth: '130px',
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 4px', border: '1.5px solid #93c5fd',
                  }}>
                    <span style={{ fontSize: '14px' }}>📊</span>
                  </div>
                  <p style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                    Điểm số
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: 900, color: '#1e40af', lineHeight: 1 }}>
                    {score.toFixed(1)}
                    <span style={{ fontSize: '12px', color: '#93c5fd', fontWeight: 700 }}>/10</span>
                  </p>
                </div>

                {/* Số câu đúng */}
                <div style={{
                  background: '#f0fdf4', border: '2px solid #bbf7d0',
                  borderRadius: '12px', padding: '10px 14px', textAlign: 'center',
                  minWidth: '110px', flex: '1', maxWidth: '130px',
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 4px', border: '1.5px solid #86efac',
                  }}>
                    <span style={{ fontSize: '14px' }}>✅</span>
                  </div>
                  <p style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                    Số câu đúng
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: 900, color: '#166534', lineHeight: 1 }}>
                    {totalCorrect}
                    <span style={{ fontSize: '12px', color: '#86efac', fontWeight: 700 }}>/{totalQuestions}</span>
                  </p>
                </div>

                {/* Độ chính xác */}
                <div style={{
                  background: '#fefce8', border: '2px solid #fde68a',
                  borderRadius: '12px', padding: '10px 14px', textAlign: 'center',
                  minWidth: '110px', flex: '1', maxWidth: '130px',
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 4px', border: '1.5px solid #fcd34d',
                  }}>
                    <span style={{ fontSize: '14px' }}>🎯</span>
                  </div>
                  <p style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                    Độ chính xác
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: 900, color: '#854d0e', lineHeight: 1 }}>
                    {accuracy}
                    <span style={{ fontSize: '12px', color: '#fcd34d', fontWeight: 700 }}>%</span>
                  </p>
                </div>
              </div>

              {/* ──── Achievement Badge ──── */}
              <div style={{
                background: theme.badgeBg,
                border: `3px solid ${theme.badgeBorder}`,
                borderRadius: '16px',
                padding: '12px 28px',
                textAlign: 'center',
                marginTop: '10px',
                marginBottom: '24px',
                position: 'relative',
                boxShadow: `0 4px 15px ${theme.badgeBorder}40`,
                minWidth: '340px',
              }}>
                {/* Laurels flanking */}
                <div style={{ position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)' }}>
                  <LaurelLeft />
                </div>
                <div style={{ position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)' }}>
                  <LaurelRight />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '20px' }}>{evaluation.emoji}</span>
                  <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Thành tích
                  </span>
                  <span style={{ fontSize: '20px' }}>{evaluation.emoji}</span>
                </div>

                <h3 style={{
                  fontSize: '22px', fontWeight: 900, color: theme.badgeText,
                  textTransform: 'uppercase', letterSpacing: '2px', lineHeight: 1.2,
                  marginBottom: '6px',
                }}>
                  {evaluation.text}
                </h3>

                <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', lineHeight: 1.4 }}>
                  {evaluation.praise.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>

              {/* ──── Motivational Quote ──── */}
              <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '4px', maxWidth: '420px' }}>
                <p style={{
                  fontSize: '11px', fontWeight: 700, color: '#1e40af',
                  fontStyle: 'italic', lineHeight: 1.5, marginBottom: '2px',
                }}>
                  Học bằng đam mê – Lớn lên bằng tri thức – Thành công bằng sự kiên trì.
                </p>
                <p style={{
                  fontSize: '10px', fontWeight: 600, color: '#64748b',
                  fontStyle: 'italic', lineHeight: 1.4,
                }}>
                  Learn with Passion – Grow with Knowledge – Succeed through Perseverance.
                </p>
              </div>

              {/* ──── Footer: Icon + Date + Signature ──── */}
              <div style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                paddingLeft: '12px', paddingRight: '12px',
                marginTop: 'auto',
              }}>
                {/* Left: Footer Icon + Date */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <img 
                    src="https://i.postimg.cc/fb4BH1rF/cf0e6918-00a9-4b75-8bee-65d4e67fa7bf.png" 
                    alt="Footer Icon" 
                    style={{ width: '130px', height: '130px', objectFit: 'contain' }} 
                  />
                  <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, fontStyle: 'italic' }}>
                    Ngày cấp: {fullDateStr}
                  </p>
                </div>

                {/* Right: Signature block */}
                <div style={{ textAlign: 'center', minWidth: '210px' }}>
                  {/* Title - on top */}
                  <p style={{
                    fontSize: '13px', fontWeight: 700, color: '#1d4ed8',
                    fontStyle: 'italic', marginBottom: '0px',
                  }}>
                    Giám đốc Trung tâm
                  </p>
                  {/* Signature image - in middle */}
                  <div style={{ marginTop: '-6px', marginBottom: '-14px', display: 'flex', justifyContent: 'center' }}>
                    <img 
                      src="https://i.postimg.cc/yYvMb6mb/Untitled-(460-x-460-px).png" 
                      alt="Chữ ký" 
                      style={{ width: '120px', height: '120px', objectFit: 'contain' }} 
                    />
                  </div>
                  {/* Full name - at bottom, same blue color */}
                  <p style={{
                    fontSize: '15px', fontWeight: 800, color: '#1d4ed8',
                    fontFamily: "'Georgia', serif",
                    whiteSpace: 'nowrap',
                  }}>
                    Võ Thùy Phượng Uyên
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
