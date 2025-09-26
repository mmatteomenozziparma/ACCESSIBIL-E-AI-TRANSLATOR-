
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { TranslationMode } from './types';
import type { Language } from './types';
import { LANGUAGES } from './constants';
import * as geminiService from './services/geminiService';
import Icon from './components/Icon';

const ModeSelector: React.FC<{
  selectedMode: TranslationMode;
  onModeChange: (mode: TranslationMode) => void;
}> = ({ selectedMode, onModeChange }) => (
  <div className="flex justify-center p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
    {Object.values(TranslationMode).map((mode) => (
      <button
        key={mode}
        onClick={() => onModeChange(mode)}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${
          selectedMode === mode
            ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
        }`}
      >
        {mode}
      </button>
    ))}
  </div>
);

const LanguageSelector: React.FC<{
  id: string;
  label: string;
  'aria-label': string;
  value: string;
  onChange: (value: string) => void;
  languages: Language[];
  disabled?: boolean;
  isLoading?: boolean;
}> = ({ id, label, 'aria-label': ariaLabel, value, onChange, languages, disabled, isLoading }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
      {label}
    </label>
    <div className="relative">
      <select
        id={id}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading}
        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 disabled:opacity-50"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
      {isLoading && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <div className="w-4 h-4 border-2 border-gray-400 dark:border-gray-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  </div>
);

const ImageUpload: React.FC<{
  onImageUpload: (file: File) => void;
  imagePreview: string | null;
  onOpenCamera: () => void;
}> = ({ onImageUpload, imagePreview, onOpenCamera }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="mt-4">
      <label
        htmlFor="image-upload"
        className="relative flex justify-center items-center w-full aspect-square bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {imagePreview ? (
          <img src={imagePreview} alt="Upload preview" className="w-full h-full object-cover rounded-lg" />
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 p-4 flex flex-col items-center justify-center h-full">
            <Icon name="upload" className="w-12 h-12 mx-auto text-gray-400" />
            <p className="mt-2 text-sm">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs">PNG, JPG, or WEBP</p>
            <div className="flex items-center my-2 w-3/4">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
              <span className="flex-shrink mx-2 text-xs text-gray-400">OR</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onOpenCamera(); }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition text-sm font-semibold"
            >
              <Icon name="camera" className="w-4 h-4" />
              Use Camera
            </button>
          </div>
        )}
        <input id="image-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
      </label>
    </div>
  );
};

const CameraModal: React.FC<{
    onClose: () => void;
    onCapture: (file: File) => void;
}> = ({ onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                alert("Could not access the camera. Please check permissions.");
                onClose();
            }
        };
        startCamera();
        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              canvas.toBlob((blob) => {
                  if (blob) {
                      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                      onCapture(file);
                  }
              }, 'image/jpeg');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-md aspect-video bg-gray-900"></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <div className="mt-4 flex justify-center gap-4">
                    <button onClick={handleCapture} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Capture</button>
                    <button onClick={onClose} className="px-6 py-2 bg-gray-200 dark:bg-gray-600 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                </div>
            </div>
        </div>
    );
};

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
    >
      {theme === 'light' ? (
        <Icon name="moon" className="w-5 h-5 text-gray-700" />
      ) : (
        <Icon name="sun" className="w-5 h-5 text-yellow-400" />
      )}
    </button>
  );
};


export default function App() {
  const [mode, setMode] = useState<TranslationMode>(TranslationMode.NORMAL);
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const DETECT_LANGUAGE_CODE = 'auto';
  const [sourceLang, setSourceLang] = useState<string>(DETECT_LANGUAGE_CODE);
  const [targetLang, setTargetLang] = useState<string>('it');
  const [easyReadLevel, setEasyReadLevel] = useState<number>(8);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDetectingLang, setIsDetectingLang] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const debounceTimeoutRef = useRef<number | null>(null);

  const sourceLanguages = useMemo(() => [
    { code: DETECT_LANGUAGE_CODE, name: 'Detect Language' },
    ...LANGUAGES,
  ], []);

  const targetLanguages = useMemo(
    () => LANGUAGES.filter((lang) => lang.code !== sourceLang),
    [sourceLang]
  );
    
  useEffect(() => {
    // Debounced language detection
    const detectLanguage = () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (sourceLang === DETECT_LANGUAGE_CODE && inputText.trim().length > 10) {
        setIsDetectingLang(true);
        debounceTimeoutRef.current = window.setTimeout(async () => {
          try {
            const detectedLangCode = await geminiService.detectLanguage(inputText);
            if (sourceLang === DETECT_LANGUAGE_CODE) { // Check if user hasn't changed away
              setSourceLang(detectedLangCode);
              if (targetLang === detectedLangCode) {
                 const newTarget = LANGUAGES.find(l => l.code !== detectedLangCode && l.code === 'en') || LANGUAGES.find(l => l.code !== detectedLangCode);
                 if (newTarget) {
                    setTargetLang(newTarget.code);
                 }
              }
            }
          } catch (e) {
            console.error("Language detection failed:", e);
            if (sourceLang === DETECT_LANGUAGE_CODE) {
                setSourceLang('en'); // Default to English on failure
            }
          } finally {
            setIsDetectingLang(false);
          }
        }, 700);
      } else {
        setIsDetectingLang(false);
      }
    };
    detectLanguage();

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [inputText, sourceLang, targetLang]);
  
  // When input text is cleared, reset to auto-detect mode
  useEffect(() => {
    if (!inputText.trim() && sourceLang !== DETECT_LANGUAGE_CODE) {
        setSourceLang(DETECT_LANGUAGE_CODE);
    }
  }, [inputText, sourceLang]);

  const handleImageUpload = useCallback(async (file: File) => {
      setIsLoading(true);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64String = (reader.result as string).split(',')[1];
          setImagePreview(reader.result as string);
          try {
              const text = await geminiService.extractTextFromImage(base64String, file.type);
              setInputText(text);
          } catch (e) {
              setError(e instanceof Error ? e.message : "An unknown error occurred during image processing.");
          } finally {
              setIsLoading(false);
          }
      };
      reader.onerror = () => {
        setError("Failed to read the image file.");
        setIsLoading(false);
      }
      reader.readAsDataURL(file);
  }, []);

  const handleCaptureFromCamera = useCallback((file: File) => {
    handleImageUpload(file);
    setIsCameraOpen(false);
  }, [handleImageUpload]);


  const handleSwapLanguages = () => {
    if (mode === TranslationMode.NORMAL && sourceLang !== DETECT_LANGUAGE_CODE) {
      setSourceLang(targetLang);
      setTargetLang(sourceLang);
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim() || sourceLang === DETECT_LANGUAGE_CODE) return;
    setIsLoading(true);
    setError(null);
    setOutputText('');
    try {
      let result = '';
      const sourceLangName = LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang;
      const targetLangName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;

      switch (mode) {
        case TranslationMode.NORMAL:
          result = await geminiService.translateText(inputText, sourceLangName, targetLangName);
          break;
        case TranslationMode.EASY_READ:
          result = await geminiService.simplifyText(inputText, sourceLangName, easyReadLevel);
          break;
        case TranslationMode.AAC:
          result = await geminiService.generateAAC(inputText, sourceLangName);
          break;
      }
      setOutputText(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
    
  const handleTextToSpeech = (text: string, lang: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };


  const renderOutput = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    if (error) {
      return <div className="text-red-500 p-4">{error}</div>;
    }
    if (!outputText) {
      return <div className="text-gray-400 dark:text-gray-500 p-4">Your result will appear here...</div>;
    }
    if (mode === TranslationMode.AAC) {
        return (
            <div className="p-4 flex flex-wrap gap-2">
                {outputText.split(' - ').map((word, index) => (
                    <div key={index} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium px-3 py-1.5 rounded-lg flex items-center justify-center text-center">
                        {word}
                    </div>
                ))}
            </div>
        );
    }
    return <p className="p-4 whitespace-pre-wrap">{outputText}</p>;
  };
    
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors">
      {isCameraOpen && <CameraModal onClose={() => setIsCameraOpen(false)} onCapture={handleCaptureFromCamera} />}
      <main className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8 relative">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Accessible AI Translator</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">Translate, simplify, and convert text with the power of Gemini.</p>
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
        </header>
        
        <div className="mb-6">
          <ModeSelector selectedMode={mode} onModeChange={setMode} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
               <LanguageSelector id="source-lang" label="From" aria-label="Select source language" value={sourceLang} onChange={setSourceLang} languages={sourceLanguages} isLoading={isDetectingLang} />
                {mode === TranslationMode.NORMAL ? (
                    <div className="relative">
                        <LanguageSelector id="target-lang" label="To" aria-label="Select target language" value={targetLang} onChange={setTargetLang} languages={targetLanguages} />
                         <button onClick={handleSwapLanguages} disabled={sourceLang === DETECT_LANGUAGE_CODE} aria-label="Swap languages" className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 p-1.5 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            <Icon name="swap" className="w-4 h-4 text-gray-600 dark:text-gray-300"/>
                        </button>
                    </div>
                ) : <div/>}
            </div>
             {mode === TranslationMode.EASY_READ && (
                <div className="mb-4">
                    <label htmlFor="easy-read-level" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Simplicity Level: {easyReadLevel}
                    </label>
                    <input
                        id="easy-read-level"
                        type="range"
                        min="1"
                        max="15"
                        value={easyReadLevel}
                        onChange={(e) => setEasyReadLevel(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                </div>
            )}

            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text here..."
                className="w-full h-48 p-4 text-base bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 resize-none"
                aria-label="Input text"
                maxLength={20000}
              />
            </div>
            <div className="flex justify-end items-center gap-4 mt-2">
                <button onClick={() => handleTextToSpeech(inputText, sourceLang)} disabled={!inputText.trim()} aria-label="Listen to input text" className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:hover:text-gray-400 transition-colors">
                  <Icon name="sound" className="w-5 h-5" />
                </button>
                <div className="text-xs text-gray-500 dark:text-gray-400">{inputText.length} / 20000</div>
            </div>
            
            <ImageUpload onImageUpload={handleImageUpload} imagePreview={imagePreview} onOpenCamera={() => setIsCameraOpen(true)} />
            
            <button
              onClick={handleGenerate}
              disabled={isLoading || !inputText.trim() || sourceLang === DETECT_LANGUAGE_CODE}
              className="mt-6 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                  <span>{mode === TranslationMode.NORMAL ? 'Translate' : 'Generate'}</span>
              )}
            </button>
          </div>

          {/* Output Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-1 flex flex-col">
            <div className="flex-grow relative" aria-live="polite">
                {renderOutput()}
            </div>
            {outputText && !isLoading && (
              <div className="flex items-center gap-2 p-3 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => handleTextToSpeech(outputText, mode === TranslationMode.NORMAL ? targetLang : sourceLang)} aria-label="Listen to result" className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                  <Icon name="sound" className="w-5 h-5" />
                </button>
                <button onClick={() => handleCopyToClipboard(outputText)} aria-label="Copy result to clipboard" className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                  <Icon name="clipboard" className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
        <footer className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>Powered by Google Gemini. Designed for accessibility.</p>
            <div className="mt-2">
                <a href="#" className="hover:underline mx-2">Privacy Policy</a>
                <span className="mx-1">·</span>
                <a href="#" className="hover:underline mx-2">Terms of Service</a>
            </div>
            <p className="mt-1 text-xs">This application is designed with GDPR and NIS 2 principles in mind.</p>
        </footer>
      </main>
    </div>
  );
}
