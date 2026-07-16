
import React, { useState, useEffect } from 'react';
import { getApiKey, setApiKey, hasApiKey, getSelectedModel, setSelectedModel, AVAILABLE_MODELS } from '../services/geminiService';

interface ApiKeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** If true, the modal cannot be dismissed (first-time setup) */
  mandatory?: boolean;
}

export const ApiKeySettingsModal: React.FC<ApiKeySettingsModalProps> = ({
  isOpen,
  onClose,
  mandatory = false,
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const existingKey = getApiKey();
      setKeyInput(existingKey || '');
      setSelectedModelId(getSelectedModel());
      setSaved(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      setError('Vui lòng nhập API Key!');
      return;
    }
    if (!trimmed.startsWith('AIza')) {
      setError('API Key không hợp lệ! Key Gemini thường bắt đầu bằng "AIza..."');
      return;
    }
    setApiKey(trimmed);
    setSelectedModel(selectedModelId);
    setSaved(true);
    setError('');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (mandatory) return; // Can't dismiss mandatory modal
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-in"
        style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 50%, #1a237e 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl backdrop-blur-sm">
              ⚙️
            </div>
            <div>
              <h2 className="text-white font-black text-lg">Thiết lập API Key</h2>
              <p className="text-blue-200 text-xs font-semibold">Cấu hình Model & API Key Gemini</p>
            </div>
          </div>
          {!mandatory && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all text-lg font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              🔑 API Key <span className="text-red-500 text-xs font-black">*Bắt buộc</span>
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => { setKeyInput(e.target.value); setError(''); }}
              placeholder="Dán API Key vào đây (AIza...)"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-base font-semibold transition-all bg-slate-50"
            />
            {error && (
              <p className="mt-2 text-red-500 text-sm font-bold flex items-center gap-1">
                ⚠️ {error}
              </p>
            )}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
            >
              <span>🔗</span>
              <span className="underline underline-offset-2">Lấy API Key miễn phí tại Google AI Studio</span>
              <span className="text-xs">↗</span>
            </a>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              🤖 Chọn Model AI
            </label>
            <div className="grid gap-2">
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModelId(model.id)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                    selectedModelId === model.id
                      ? 'border-brand-500 bg-brand-50 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedModelId === model.id
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-slate-300'
                  }`}>
                    {selectedModelId === model.id && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-slate-800 text-sm">{model.name}</span>
                    <span className="text-slate-400 text-xs ml-2">({model.id})</span>
                  </div>
                  {model.isDefault && (
                    <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-black rounded-full uppercase">
                      Mặc định
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {!mandatory && (
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-all"
            >
              Hủy
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saved}
            className={`flex-1 max-w-[200px] px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-brand-600 hover:bg-brand-700 text-white active:scale-95'
            }`}
          >
            {saved ? (
              <>✅ Đã lưu!</>
            ) : (
              <>💾 Lưu cài đặt</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
