
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LessonPlan, MindMapData, MindMapMode, PresentationScript, ContentResult, CharacterProfile, AppMode, ImageRatio, SpeechEvaluation } from "../types";

// ===== API KEY MANAGEMENT =====
// Priority: localStorage > environment variable
const API_KEY_STORAGE = 'co_phuong_uyen_api_key';
const OLD_API_KEY_STORAGE = 'nextgen_english_api_key';
const MODEL_STORAGE = 'co_phuong_uyen_selected_model';
const OLD_MODEL_STORAGE = 'nextgen_english_selected_model';

// Model fallback order (Updated July 2026)
// Default: gemini-3.6-flash (GA, best stability)
// Fallback: gemini-3.6-flash → gemini-3.5-flash-lite → gemini-3.1-pro
export const AVAILABLE_MODELS = [
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash ⚡', isDefault: true },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite' },
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro' },
];

export const getApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    const newKey = localStorage.getItem(API_KEY_STORAGE);
    if (newKey) return newKey;
    const oldKey = localStorage.getItem(OLD_API_KEY_STORAGE);
    if (oldKey) {
      localStorage.setItem(API_KEY_STORAGE, oldKey);
      return oldKey;
    }
  }
  return process.env.API_KEY || null;
};

export const setApiKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(API_KEY_STORAGE, key);
  }
};

export const getSelectedModel = (): string => {
  if (typeof window !== 'undefined') {
    const newModel = localStorage.getItem(MODEL_STORAGE);
    if (newModel) {
      // Check if saved model is still available; if not, reset to default
      const isValid = AVAILABLE_MODELS.some(m => m.id === newModel);
      if (isValid) return newModel;
      // Deprecated model saved → auto-migrate to default
      const defaultModel = AVAILABLE_MODELS[0].id;
      localStorage.setItem(MODEL_STORAGE, defaultModel);
      console.warn(`⚠️ Model "${newModel}" không còn khả dụng. Đã tự động chuyển sang "${defaultModel}".`);
      return defaultModel;
    }
    const oldModel = localStorage.getItem(OLD_MODEL_STORAGE);
    if (oldModel) {
      const isValid = AVAILABLE_MODELS.some(m => m.id === oldModel);
      const finalModel = isValid ? oldModel : AVAILABLE_MODELS[0].id;
      localStorage.setItem(MODEL_STORAGE, finalModel);
      return finalModel;
    }
    return AVAILABLE_MODELS[0].id;
  }
  return AVAILABLE_MODELS[0].id;
};

export const setSelectedModel = (modelId: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MODEL_STORAGE, modelId);
  }
};

export const hasApiKey = (): boolean => {
  const key = getApiKey();
  return !!key && key.length > 30;
};

// Create AI instance with API key from localStorage
const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_REQUIRED: Vui lòng nhập API key đ→sử dụng ứng dụng');
  }
  return new GoogleGenAI({ apiKey });
};

// Helper function to delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry with model fallback and exponential backoff
export const callWithFallback = async <T>(
  fn: (model: string) => Promise<T>,
  startModelIndex: number = 0
): Promise<T> => {
  const models = AVAILABLE_MODELS.slice(startModelIndex);
  let lastError: Error | null = null;
  const maxRetriesPerModel = 2; // Thử lại tối đa 2 lần cho mỗi model

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        return await fn(model.id);
      } catch (error: any) {
        lastError = error;
        const errorMessage = error.message || '';
        const isOverloaded = errorMessage.includes('503') || errorMessage.includes('429') || errorMessage.includes('high demand');
        const isNotFound = errorMessage.includes('404') || errorMessage.includes('NOT_FOUND') || errorMessage.includes('not found');
        
        console.warn(`[Lần ${attempt}] Model ${model.id} failed:`, errorMessage);
        
        // Model không tồn tại → bỏ qua ngay, chuyển model dự phòng
        if (isNotFound) {
          console.warn(`⚠️ Model "${model.id}" không tồn tại. Chuyển sang model dự phòng...`);
          break;
        }
        
        if (isOverloaded && attempt < maxRetriesPerModel) {
          // Delay 2s (lần 1), 4s (lần 2)...
          const waitTime = 2000 * attempt;
          console.log(`Server đang quá tải, thử lại sau ${waitTime/1000}s...`);
          await delay(waitTime);
          continue; // Thử lại model hiện tại
        }
        
        // Thoát vòng lặp retry của model này, chuyển sang model dự phòng tiếp theo
        break;
      }
    }
  }

  // Nếu đã thử tất cả các model và vẫn lỗi
  const finalErrorMsg = lastError?.message || '';
  if (finalErrorMsg.includes('404') || finalErrorMsg.includes('NOT_FOUND') || finalErrorMsg.includes('not found')) {
    throw new Error('Tất cả các model AI đều không khả dụng (lỗi 404). Vui lòng vào ⚙️ Cài đặt API Key → chọn lại Model mới nhất, hoặc liên hệ hỗ trợ.');
  }
  if (finalErrorMsg.includes('503') || finalErrorMsg.includes('429') || finalErrorMsg.includes('high demand')) {
    throw new Error('Hệ thống AI của Google đang bị quá tải do nhu cầu cao (Lỗi 503). Hệ thống đã tự động thử lại nhiều lần bằng các model dự phòng nhưng chưa thành công. Vui lòng đợi khoảng 1-2 phút rồi ấn thử lại nhé!');
  }

  throw lastError || new Error('Tất cả các model đều thất bại. Vui lòng kiểm tra lại kết nối mạng hoặc API key.');
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

// ===== TTS SYSTEM: Mobile-First with IMMEDIATE Playback =====
// Uses Web Speech API with SYNCHRONOUS speak() for mobile compatibility
// CRITICAL: On Android, speak() MUST be called synchronously in the click handler

let currentUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoice: SpeechSynthesisVoice | null = null;
let ttsInitialized = false;

// Get voices SYNCHRONOUSLY - do not await
const getVoicesSync = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
};

// Get the best English voice from available voices - prefer expressive female voices
const getBestVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  if (cachedVoice && voices.includes(cachedVoice)) return cachedVoice;
  if (!voices || voices.length === 0) return null;

  // Priority: Female voices (more melodic) > Google > Microsoft > Native English
  const priorities = [
    // Female Google voices - most natural and melodic
    (v: SpeechSynthesisVoice) => v.name.includes('Google') && v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('UK English Female')),
    // Any Google English voice
    (v: SpeechSynthesisVoice) => v.name.includes('Google') && v.lang.startsWith('en'),
    // Microsoft Zira/Aria - expressive female voices
    (v: SpeechSynthesisVoice) => v.name.includes('Microsoft') && v.lang.startsWith('en') && (v.name.includes('Zira') || v.name.includes('Aria') || v.name.includes('Jenny')),
    // Any Microsoft English voice
    (v: SpeechSynthesisVoice) => v.name.includes('Microsoft') && v.lang.startsWith('en'),
    // US English - clearer pronunciation
    (v: SpeechSynthesisVoice) => v.lang === 'en-US',
    // Any English voice
    (v: SpeechSynthesisVoice) => v.lang.startsWith('en'),
  ];

  for (const check of priorities) {
    const voice = voices.find(check);
    if (voice) {
      cachedVoice = voice;
      return voice;
    }
  }

  cachedVoice = voices[0];
  return voices[0];
};

// Pre-load voices in background (non-blocking)
const preloadVoices = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Try to get voices immediately
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    getBestVoice(voices); // Cache the best voice
    return;
  }

  // Listen for voices to become available
  window.speechSynthesis.onvoiceschanged = () => {
    const v = window.speechSynthesis.getVoices();
    if (v.length > 0) {
      getBestVoice(v); // Cache the best voice
    }
  };
};

// Initialize TTS - call this on first user interaction (e.g., page touch)
export const initTTSOnUserInteraction = (): void => {
  if (ttsInitialized) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  ttsInitialized = true;

  // Warm up the speech synthesis engine with a silent utterance
  // This tricks mobile browsers into allowing future speech
  try {
    const warmup = new SpeechSynthesisUtterance('');
    warmup.volume = 0;
    warmup.rate = 10; // Fast to complete quickly
    window.speechSynthesis.speak(warmup);
    window.speechSynthesis.cancel(); // Cancel immediately
  } catch (e) {
    // Ignore errors during warmup
  }

  // Pre-cache voices
  preloadVoices();
};

// Pre-load voices on page load
if (typeof window !== 'undefined' && window.speechSynthesis) {
  preloadVoices();

  // Also try to init on first touch/click anywhere
  const initOnInteraction = () => {
    initTTSOnUserInteraction();
    document.removeEventListener('touchstart', initOnInteraction);
    document.removeEventListener('click', initOnInteraction);
  };
  document.addEventListener('touchstart', initOnInteraction, { passive: true });
  document.addEventListener('click', initOnInteraction, { passive: true });
}

// Main TTS function - FULLY SYNCHRONOUS for mobile compatibility
// NO AWAITS before speak() - this is critical for Android
export const playGeminiTTS = (text: string): void => {
  // Check availability
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis not available');
    return;
  }

  // Clean text - keep only speakable characters
  const cleanText = text.trim().replace(/[^\w\s.,!?'"-]/g, '');
  if (!cleanText) return;

  // CRITICAL: Cancel any existing speech FIRST
  window.speechSynthesis.cancel();
  currentUtterance = null;

  // Create utterance IMMEDIATELY - no delays
  try {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    currentUtterance = utterance;

    // Get voices synchronously - use cached or whatever is available
    const voices = getVoicesSync();
    const voice = getBestVoice(voices);
    if (voice) {
      utterance.voice = voice;
    }

    // Settings for melodic, engaging pronunciation (trầm bổng, cuốn hút)
    utterance.lang = 'en-US';
    utterance.rate = 0.85;  // Slightly slower for clearer, more expressive speech
    utterance.pitch = 1.1;  // Slightly higher for warmer, more melodic tone
    utterance.volume = 1.0;

    // Event handlers
    utterance.onend = () => {
      currentUtterance = null;
    };

    utterance.onerror = (e) => {
      // Don't log 'interrupted' errors - they're normal when canceling
      if (e.error !== 'interrupted') {
        console.warn('TTS error:', e.error);
      }
      currentUtterance = null;
    };

    // SPEAK IMMEDIATELY - NO DELAYS!
    window.speechSynthesis.speak(utterance);

    // Mobile Chrome/Safari fix: resume if browser pauses speech
    // Check every 100ms and resume if paused
    let resumeAttempts = 0;
    const mobileResumeFix = setInterval(() => {
      resumeAttempts++;

      // Stop checking after speech ends or 30 seconds
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        clearInterval(mobileResumeFix);
        return;
      }

      if (resumeAttempts > 300) { // 30 seconds max
        clearInterval(mobileResumeFix);
        currentUtterance = null;
        return;
      }

      // Resume if paused (happens on some Android devices)
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 100);

  } catch (e) {
    console.error('TTS Error:', e);
  }
};

// Stop any playing audio
export const stopTTS = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
};

// Optional: Gemini TTS for high-quality audio (can be used as enhancement)
export const generateAudioFromContent = async (text: string): Promise<string> => {
  const ai = getAI();
  let lastError = null;
  
  // Tự động retry 2 lần vì API text-to-speech hay bị rate limit/overload
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }
            }
          }
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    } catch (e: any) {
      lastError = e;
      if ((e.message?.includes('503') || e.message?.includes('429')) && attempt < 2) {
        await delay(2000);
        continue;
      }
      break;
    }
  }
  
  console.warn("TTS API Error:", lastError);
  return ""; // Trả về chuỗi rỗng để app không sập, tiếp tục fallback sang Web Speech API
};

export const generateLessonPlan = async (topicInput?: string, textInput?: string, images: string[] = []): Promise<LessonPlan> => {
  const ai = getAI();
  const imageParts = images.map(data => ({ inlineData: { data, mimeType: 'image/jpeg' } }));
  const prompt = `CÔ PHƯỢNG UYÊN AI - EXPERT PEDAGOGY MODE (CHUYÊN GIA TIẾNG ANH).
  TASK: Analyze the provided content (text/images) and create a comprehensive lesson plan.
  
  ===== ⚠️⚠️⚠️ CRITICAL WARNING: ZERO TOLERANCE FOR GRADING ERRORS ⚠️⚠️⚠️ =====
  
  🚨 BẠN ĐANG TẠO BÀI KIỂM TRA CHO HỌC SINH THẬT! 🚨
  - Nếu đáp án SAI → Học sinh bị chấm SAI → THẤT BẠI!
  - Mỗi câu hỏi PHẢI được kiểm tra 2 LẦN trước khi output
  
  ===== CRITICAL: 100% CONTENT EXTRACTION =====
  ⚠️ QUAN TRỌNG NHẤT: Phải trích xuất CHÍNH XÁC và ĐẦY ĐỦ 100% nội dung từ nguồn!
  - Nếu ảnh/văn bản có 10 từ vựng → tạo ĐÚNG 10 từ vựng, KHÔNG được bỏ sót
  - KHÔNG được thêm từ vựng mà nguồn không có
  - Từ vựng phải GIỐNG HỆT với nội dung gốc (word, IPA, meaning, example)
  
  CRITICAL LANGUAGE REQUIREMENTS:
  - GRAMMAR section:
    * "topic": Keep in English (the grammar rule name)
    * "explanation": MUST be in VIETNAMESE (giải thích bằng tiếng Việt, dễ hiểu cho học sinh)
    * "examples": Each example MUST include Vietnamese translation in format: "English sentence" → "bản dịch tiếng việt viết thường"
  
  - VOCABULARY section (EXTRACT ALL FROM SOURCE):
    * Extract EVERY SINGLE vocabulary word from the source - DO NOT SKIP ANY
    * "word": English word (EXACTLY as shown in source)
    * "ipa": IPA pronunciation (EXACTLY as shown in source if available)
    * "meaning": Vietnamese meaning (EXACTLY as shown in source, lowercase)
    * "example": English example sentence (EXACTLY as shown in source)
    * "sentenceMeaning": Vietnamese translation of example (EXACTLY as shown in source, lowercase)
  
  ===== QUIZ - TỔNG CỘNG 30 CÂU HỎI =====
  
  🎓 YOU ARE A PROFESSIONAL ENGLISH TEACHER WITH 20 YEARS EXPERIENCE
  You must create exercises with 100% grammatical accuracy. Every answer key must be verified.
  
  ⚠️ CRITICAL: 80% CONTENT MUST USE INPUT VOCABULARY/GRAMMAR
  At least 80% of questions MUST directly use the vocabulary, grammar patterns, and concepts from the INPUT SOURCE.
  
  ⚠️ LANGUAGE RULES FOR QUESTIONS:
  - ALL questions, options, hints, and explanations MUST be in ENGLISH
  - "vietnameseHint" in multipleChoice: provide a brief Vietnamese translation/hint for the question
  - wordGuess "hint": MUST be in English (e.g. "The male parent of a child")
  - oddOneOut "explanation": MUST be in English
  - emojiDecode "explanation": MUST be in English
  
  MANDATORY QUESTION COUNT (TOTAL = 30):
  1. Create EXACTLY 10 Multiple Choice Questions (multipleChoice). Each must have a "vietnameseHint" field with Vietnamese translation/hint.
  2. Create EXACTLY 5 Word Guess Questions (wordGuess) with English hints
  3. Create EXACTLY 1 Memory Match set (memoryMatch) containing EXACTLY 5 pairs of english-vietnamese words
  4. Create EXACTLY 5 Odd One Out Questions (oddOneOut) with English explanation
  5. Create EXACTLY 5 Emoji Decode Questions (emojiDecode) with English explanation
  
  DO NOT create: fillBlank, scramble, errorId, trueFalse, listening, vocabTranslation.
  
  All content must align strictly with the source provided. Do not invent unrelated topics.`;

  const inputParts: any[] = [];
  if (textInput) inputParts.push({ text: `SOURCE TEXT:\n${textInput}` });
  if (topicInput) inputParts.push({ text: `TOPIC FOCUS:\n${topicInput}` });
  inputParts.push(...imageParts);
  inputParts.push({ text: prompt });

  // Use fallback mechanism - automatically retry with next model if current fails
  return callWithFallback(async (modelId: string) => {
    console.log(`🤖 Đang thử với model: ${modelId}`);
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: inputParts },
      config: { responseMimeType: "application/json", responseSchema: lessonSchema }
    });
    return safeJsonParse<LessonPlan>(response.text);
  });
};

export const analyzeImageAndCreateContent = async (images: string[], mimeType: string, char: CharacterProfile, mode: AppMode, customPrompt?: string, topic?: string, text?: string): Promise<ContentResult> => {
  const ai = getAI();
  const imageParts = images.map(data => ({ inlineData: { data, mimeType } }));
  const prompt = `CÔ PHƯỢNG UYÊN AI - CREATIVE STORYTELLER.
  
  Analyze the input and create:
  1. A magical story featuring ${char.name}.
  2. EXACTLY 10 Comprehension Quiz questions.
  3. EXACTLY 10 Speaking interaction prompts.
  4. A SCIENTIFIC WRITING PROMPT for the student in BOTH English and Vietnamese.
  
  Source material: Topic: ${topic || "N/A"}, Text: ${text || "N/A"}.
  Character context: ${char.promptContext}.`;

  return callWithFallback(async (modelId: string) => {
    console.log(`🤖 Storyteller - Đang thử với model: ${modelId}`);
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [...imageParts, { text: prompt }] },
      config: { responseMimeType: "application/json", responseSchema: contentResultSchema }
    });
    return safeJsonParse<ContentResult>(response.text);
  });
};

const safeJsonParse = <T>(text: string): T => {
  try {
    let cleanText = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const start = Math.min(cleanText.indexOf('{') === -1 ? Infinity : cleanText.indexOf('{'), cleanText.indexOf('[') === -1 ? Infinity : cleanText.indexOf('['));
    const end = Math.max(cleanText.lastIndexOf('}'), cleanText.lastIndexOf(']'));
    if (start !== Infinity && end !== -1) cleanText = cleanText.substring(start, end + 1);
    return JSON.parse(cleanText) as T;
  } catch (e) { throw new Error("Lỗi xử lý dữ liệu AI."); }
};

const lessonSchema = { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, vocabulary: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, emoji: { type: Type.STRING }, ipa: { type: Type.STRING }, meaning: { type: Type.STRING }, example: { type: Type.STRING }, sentenceMeaning: { type: Type.STRING }, type: { type: Type.STRING } }, required: ["word", "ipa", "meaning", "example", "type", "emoji"] } }, grammar: { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, explanation: { type: Type.STRING }, examples: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["topic", "explanation", "examples"] }, reading: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, passage: { type: Type.STRING }, translation: { type: Type.STRING }, comprehension: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.INTEGER }, explanation: { type: Type.STRING } }, required: ["id", "question", "options", "correctAnswer"] } } }, required: ["title", "passage", "translation", "comprehension"] }, practice: { type: Type.OBJECT, properties: { megaTest: { type: Type.OBJECT, properties: { multipleChoice: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, question: { type: Type.STRING }, vietnameseHint: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.INTEGER }, explanation: { type: Type.STRING } }, required: ["id", "question", "vietnameseHint", "options", "correctAnswer"] } }, memoryMatch: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, pairs: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, vietnamese: { type: Type.STRING } }, required: ["english", "vietnamese"] } } }, required: ["id", "pairs"] } }, oddOneOut: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, answer: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["id", "options", "answer", "explanation"] } }, wordGuess: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, word: { type: Type.STRING }, hint: { type: Type.STRING } }, required: ["id", "word", "hint"] } }, emojiDecode: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, emojis: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, answer: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["id", "emojis", "options", "answer", "explanation"] } } }, required: ["multipleChoice", "memoryMatch", "oddOneOut", "wordGuess", "emojiDecode"] } }, required: ["megaTest"] }, teacherTips: { type: Type.STRING } }, required: ["topic", "vocabulary", "grammar", "reading", "practice", "teacherTips"] };


const contentResultSchema = {
  type: Type.OBJECT,
  properties: {
    storyEnglish: { type: Type.STRING },
    translatedText: { type: Type.STRING },
    writingPromptEn: { type: Type.STRING },
    writingPromptVi: { type: Type.STRING },
    vocabulary: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, meaning: { type: Type.STRING }, emoji: { type: Type.STRING } } } },
    imagePrompt: { type: Type.STRING },
    comprehensionQuestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.INTEGER }, explanation: { type: Type.STRING } } } },
    speakingQuestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, question: { type: Type.STRING }, suggestedAnswer: { type: Type.STRING } } } }
  },
  required: ["storyEnglish", "translatedText", "writingPromptEn", "writingPromptVi", "vocabulary", "imagePrompt", "comprehensionQuestions", "speakingQuestions"]
};

export const generateMindMap = async (content: any, mode: MindMapMode): Promise<MindMapData> => {
  const ai = getAI();
  return callWithFallback(async (modelId: string) => {
    const response = await ai.models.generateContent({
      model: modelId, // Cho phép fallback thay vì hardcode gemini-3-pro-preview
      contents: `Create a professional Mind Map following Tony Buzan's principles for: ${JSON.stringify(content)}. 
      Structure: Root node is the main topic. Child nodes are key sub-concepts with emojis. 
      Output strictly in JSON format matching the schema.`,
      config: { responseMimeType: "application/json", responseSchema: mindMapSchema }
    });
    return safeJsonParse<MindMapData>(response.text);
  });
};

export const evaluateSpeech = async (base64Audio: string): Promise<SpeechEvaluation> => {
  const ai = getAI();
  return callWithFallback(async (modelId: string) => {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ inlineData: { data: base64Audio, mimeType: 'audio/wav' } }, { text: "Evaluate the student's speaking performance on a scale of 0-10. Provide encouraging feedback in Vietnamese." }] },
      config: { responseMimeType: "application/json", responseSchema: speechEvaluationSchema }
    });
    return safeJsonParse<SpeechEvaluation>(response.text);
  });
};

export const generateStoryImage = async (prompt: string, style: string, ratio: ImageRatio): Promise<string> => {
  const ai = getAI();
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Model ảnh không có fallback text model được
        contents: { parts: [{ text: `A high-quality educational illustration for kids: ${prompt}. Artistic Style: ${style}. High resolution, 8k, vibrant colors.` }] },
        config: { imageConfig: { aspectRatio: ratio } }
      });
      for (const part of response.candidates[0].content.parts) { if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`; }
    } catch (e: any) {
      lastError = e;
      if (e.message?.includes('503') || e.message?.includes('429')) {
        await delay(2000 * attempt);
        continue;
      }
      break;
    }
  }
  throw new Error("Hệ thống tạo ảnh đang quá tải. Vui lòng thử lại sau.");
};

export const correctWriting = async (userText: string, creativePrompt: string): Promise<any> => {
  const ai = getAI();
  return callWithFallback(async (modelId: string) => {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Evaluate and correct this student writing: "${userText}". The topic was: "${creativePrompt}". Provide a score (0-10), feedback, fixed text, and detailed error list.`,
      config: { responseMimeType: "application/json", responseSchema: writingCorrectionSchema }
    });
    return safeJsonParse<any>(response.text);
  });
};

export const generatePresentation = async (data: MindMapData): Promise<PresentationScript> => {
  const ai = getAI();
  return callWithFallback(async (modelId: string) => {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Create a professional English presentation script for a student based on this Mind Map data: ${JSON.stringify(data)}. 
      Include a warm introduction, body sections for each node, and a polite conclusion. 
      Provide both English script and Vietnamese translation.`,
      config: { responseMimeType: "application/json", responseSchema: presentationSchema }
    });
    return safeJsonParse<PresentationScript>(response.text);
  });
};

export const generateMindMapPrompt = async (content: any, mode: MindMapMode): Promise<string> => {
  const ai = getAI();
  return callWithFallback(async (modelId: string) => {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `TASK: Generate a single, highly detailed English prompt for drawing a professional Tony Buzan Mind Map using AI art tools (like Midjourney or DALL-E). 
      CONTENT SOURCE: ${JSON.stringify(content)}. 
      
      PROMPT SPECIFICATIONS:
      - Style: 3D Organic Tony Buzan Mind Map, Pixar-style animation render.
      - Central Theme: A clear 3D icon representing the lesson topic at the center.
      - Branches: Curvy, organic, thick-to-thin colorful branches spreading outwards.
      - Elements: Floating keywords in English, cute 3D emojis/icons next to branches.
      - Environment: Clean bright studio background, 8k resolution, cinematic lighting, vibrant pedagogical colors.
      - Exclude: No text other than the keywords. 
      
      JUST PROVIDE THE RAW PROMPT STRING.`
    });
    return response.text;
  });
};

const mindMapSchema = { type: Type.OBJECT, properties: { center: { type: Type.OBJECT, properties: { title_en: { type: Type.STRING }, title_vi: { type: Type.STRING }, emoji: { type: Type.STRING } } }, nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text_en: { type: Type.STRING }, text_vi: { type: Type.STRING }, emoji: { type: Type.STRING } } } } } };
const presentationSchema = { type: Type.OBJECT, properties: { introduction: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, vietnamese: { type: Type.STRING } } }, body: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { keyword: { type: Type.STRING }, script: { type: Type.STRING } } } }, conclusion: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, vietnamese: { type: Type.STRING } } } } };
const speechEvaluationSchema = { type: Type.OBJECT, properties: { scores: { type: Type.OBJECT, properties: { pronunciation: { type: Type.NUMBER } } }, overallScore: { type: Type.NUMBER }, feedback: { type: Type.STRING } } };
const writingCorrectionSchema = { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, feedback: { type: Type.STRING }, fixedText: { type: Type.STRING }, breakdown: { type: Type.OBJECT, properties: { vocabulary: { type: Type.NUMBER }, grammar: { type: Type.NUMBER } } }, errors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { original: { type: Type.STRING }, fixed: { type: Type.STRING }, reason: { type: Type.STRING } } } }, suggestions: { type: Type.STRING } } };

