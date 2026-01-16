
import React, { useState, useCallback, useEffect } from 'react';
import { ScanResult, RecognitionData } from './types';
import { recognizePlate } from './services/geminiService';
import { 
  CameraIcon, 
  PhotoIcon, 
  ArrowPathIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('plate_recognition_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('plate_recognition_history', JSON.stringify(history));
  }, [history]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!image) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const base64Data = image.split(',')[1];
      const data: RecognitionData = await recognizePlate(base64Data);
      
      const newResult: ScanResult = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageUrl: image,
        plateNumber: data.plate_number,
        region: data.region,
        vehicle: {
          make: data.vehicle_make,
          model: data.vehicle_model,
          color: data.vehicle_color,
          type: data.vehicle_type,
        },
        confidence: data.confidence_score,
      };
      
      setResult(newResult);
      setHistory(prev => [newResult, ...prev].slice(0, 10)); // Keep last 10
    } catch (err: any) {
      console.error(err);
      setError("Failed to recognize plate. Please try a clearer image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear all history?")) {
      setHistory([]);
      localStorage.removeItem('plate_recognition_history');
    }
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <MagnifyingGlassIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">SmartPlate <span className="text-blue-600">AI</span></h1>
          </div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-widest hidden sm:block">
            Powered by Gemini 3
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        {/* Upload Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col items-center">
              {!image ? (
                <label className="w-full flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="bg-blue-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                      <PhotoIcon className="w-10 h-10 text-blue-500" />
                    </div>
                    <p className="mb-2 text-sm text-slate-700">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-500">Vehicle photo (JPG, PNG or WEBP)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                  />
                </label>
              ) : (
                <div className="w-full space-y-6">
                  <div className="relative rounded-xl overflow-hidden bg-slate-100 max-h-[400px] flex justify-center">
                    <img src={image} alt="Vehicle" className="object-contain h-full" />
                    <button 
                      onClick={() => { setImage(null); setResult(null); setError(null); }}
                      className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={processImage}
                      disabled={isProcessing}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      {isProcessing ? (
                        <>
                          <ArrowPathIcon className="w-5 h-5 animate-spin" />
                          Analyzing Image...
                        </>
                      ) : (
                        <>
                          <MagnifyingGlassIcon className="w-5 h-5" />
                          Recognize License Plate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-700">
            <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 border-b px-6 py-4 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  Recognition Result
                </h2>
                <span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-700 uppercase">
                  {result.confidence} Confidence
                </span>
              </div>
              <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Detected License Plate</label>
                  <div className="bg-slate-900 rounded-lg p-6 flex items-center justify-center border-4 border-slate-700 shadow-inner">
                    <span className="text-white text-5xl md:text-6xl font-mono-custom tracking-wider font-bold">
                      {result.plateNumber}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-slate-600">
                    <span className="text-sm font-medium bg-slate-100 px-3 py-1 rounded-full">{result.region}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Vehicle Details</label>
                    <div className="grid grid-cols-2 gap-4">
                      <DetailBox label="Make" value={result.vehicle.make} />
                      <DetailBox label="Model" value={result.vehicle.model} />
                      <DetailBox label="Color" value={result.vehicle.color} />
                      <DetailBox label="Type" value={result.vehicle.type} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* History Section */}
        {history.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-bold text-slate-800">Recent Scans</h2>
              <button 
                onClick={clearHistory}
                className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors"
              >
                Clear History
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-blue-300 transition-colors group"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    <img src={item.imageUrl} alt="Car" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                      <button onClick={() => deleteHistoryItem(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500">
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="font-mono-custom font-bold text-slate-800 truncate">{item.plateNumber}</p>
                    <p className="text-xs text-slate-500 truncate">{item.vehicle.make} {item.vehicle.model}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 sm:hidden">
        <label className="bg-blue-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center cursor-pointer active:scale-90 transition-transform">
          <CameraIcon className="w-6 h-6" />
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            capture="environment"
            onChange={handleFileUpload}
          />
        </label>
      </div>
    </div>
  );
};

const DetailBox: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{label}</span>
    <span className="text-slate-800 font-semibold">{value}</span>
  </div>
);

export default App;
