
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef } from 'react';
import { 
  PipelineConfig, 
  VideoType, 
  VideoTone 
} from '../types';
import { 
  TextModeIcon, 
  SparklesIcon, 
  ArrowRightIcon, 
  FilmIcon,
  XMarkIcon,
  FileImageIcon
} from './icons';
import { Settings2, AlertCircle } from 'lucide-react';

export default function PromptForm({ onGenerate }: { onGenerate: (c: PipelineConfig) => void }) {
  const [product, setProduct] = useState({
    name: '',
    targetUsers: '',
    coreProblem: '',
    differentiators: '',
    constraints: 'Standard Enterprise Security'
  });

  const [goal, setGoal] = useState({
    type: VideoType.DEMO,
    durationMinutes: 10,
    tone: VideoTone.TECHNICAL,
    audience: 'Senior Architects & Project Leads'
  });

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualVjepa, setManualVjepa] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulateUpload = (files: FileList) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 12;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(null);
          const newFiles = Array.from(files).map(f => f.name);
          setUploadedFiles(prev => [...prev, ...newFiles]);
        }, 500);
      }
      setUploadProgress(progress);
    }, 180);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateUpload(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({ product, goal, recordings: uploadedFiles, manualVjepa: manualVjepa.trim() || undefined });
  };

  const isFormValid = product.name && product.coreProblem && (uploadedFiles.length > 0 || manualVjepa.length > 10);

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full max-w-7xl mx-auto items-start">
      {/* Knowledge Base Section */}
      <div className="lg:col-span-7 flex flex-col gap-8">
        <div className="p-10 bg-white/[0.03] border border-white/5 rounded-[48px] flex flex-col gap-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <TextModeIcon className="w-16 h-16 text-indigo-500" />
          </div>
          
          <div className="flex items-center gap-4 border-b border-white/5 pb-8 relative">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-300">Ground Truth Knowledge Base</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Product / Project Name</label>
              <input 
                required
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium placeholder:text-slate-700"
                placeholder="VisionNarrate Pro..."
                value={product.name}
                onChange={e => setProduct({...product, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Target User Persona</label>
              <input 
                required
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium placeholder:text-slate-700"
                placeholder="Cloud Architects, SREs..."
                value={product.targetUsers}
                onChange={e => setProduct({...product, targetUsers: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Core Problem Solved</label>
            <textarea 
              required
              className="w-full h-28 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none font-medium placeholder:text-slate-700"
              placeholder="Deeply explain the value proposition..."
              value={product.coreProblem}
              onChange={e => setProduct({...product, coreProblem: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Key Differentiators (Narrative Focus)</label>
            <textarea 
              required
              className="w-full h-20 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none font-medium placeholder:text-slate-700"
              placeholder="Why is this unique? Grounding focus..."
              value={product.differentiators}
              onChange={e => setProduct({...product, differentiators: e.target.value})}
            />
          </div>
        </div>

        <div className="p-10 bg-indigo-500/[0.04] border border-indigo-500/10 rounded-[48px] flex flex-col gap-6 shadow-2xl group transition-all hover:bg-indigo-500/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FilmIcon className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-300">Visual Ingest & Resiliency</h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showAdvanced ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-slate-500 border border-white/5'}`}
            >
              <Settings2 className="w-3 h-3" />
              Manual V-JEPA Override
            </button>
          </div>
          
          {!showAdvanced ? (
            <>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Attach screen recordings. Our V-JEPA layer uses these as the ONLY source of visual truth. No synthetic hallucinations allowed.
              </p>
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <input 
                    type="file" 
                    multiple 
                    accept="video/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                  />
                  <button 
                    type="button" 
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-grow flex items-center justify-center gap-3 px-8 py-5 bg-white text-black hover:bg-slate-200 disabled:opacity-50 transition-all rounded-2xl font-black text-xs uppercase tracking-[0.2em]"
                  >
                    {isUploading ? 'Ingesting Media...' : 'Upload Ground Truth Files'}
                  </button>
                </div>

                {uploadedFiles.length > 0 && !isUploading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {uploadedFiles.map((fileName, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-[10px] text-slate-300 font-mono group/file">
                        <div className="flex items-center gap-2 truncate">
                          <FilmIcon className="w-3 h-3 text-indigo-500" />
                          <span className="truncate">{fileName}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeFile(idx)}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest leading-relaxed">
                  Resilience Mode: Paste V-JEPA Grounding JSON here to skip token-heavy analysis. Useful for retries or teammate collaborations.
                </p>
              </div>
              <textarea 
                className="w-full h-48 bg-black/60 border border-amber-500/20 rounded-2xl px-6 py-5 font-mono text-[10px] text-amber-200 focus:ring-2 focus:ring-amber-500 transition-all outline-none resize-none placeholder:text-amber-900/50"
                placeholder='[{"scene_id": 1, "visual_event": "..."}]'
                value={manualVjepa}
                onChange={e => setManualVjepa(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Goal Config Section */}
      <div className="lg:col-span-5 h-full">
        <div className="p-10 bg-white/[0.03] border border-white/5 rounded-[48px] flex flex-col gap-10 shadow-2xl h-full sticky top-28">
          <div className="flex items-center gap-4 border-b border-white/5 pb-8">
            <SparklesIcon className="w-6 h-6 text-indigo-400" />
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-300">Synthesis Engine Config</h3>
          </div>

          <div className="space-y-10">
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Narrative Objective</label>
              <div className="grid grid-cols-1 gap-3">
                {Object.values(VideoType).map(v => (
                  <button 
                    key={v}
                    type="button"
                    onClick={() => setGoal({...goal, type: v})}
                    className={`px-5 py-4 rounded-2xl border text-xs font-bold text-left transition-all uppercase tracking-widest ${goal.type === v ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/30' : 'bg-black/40 border-white/5 text-slate-500 hover:border-white/20'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Tone & Personality Profiling</label>
              <select 
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold uppercase tracking-widest text-slate-300 outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                value={goal.tone}
                onChange={e => setGoal({...goal, tone: e.target.value as VideoTone})}
              >
                {Object.values(VideoTone).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Engine Runtime Goal</label>
                <span className="text-xs font-mono font-black text-indigo-400">{goal.durationMinutes} MINUTES</span>
              </div>
              <input 
                type="range" min="1" max="30" step="1"
                className="w-full h-2 bg-indigo-950/30 rounded-full appearance-none cursor-pointer accent-indigo-500"
                value={goal.durationMinutes}
                onChange={e => setGoal({...goal, durationMinutes: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="mt-auto pt-10">
            <button 
              type="submit"
              disabled={!isFormValid || isUploading}
              className="group relative w-full overflow-hidden bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:grayscale transition-all py-6 rounded-2xl shadow-2xl shadow-indigo-600/30"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
              <div className="relative flex items-center justify-center gap-4">
                 <span className="text-sm font-black text-white uppercase tracking-[0.3em]">Initialize Pipeline</span>
                 <ArrowRightIcon className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
