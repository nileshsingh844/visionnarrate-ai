
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useEffect, useState } from 'react';
import { Terminal, ShieldCheck, ShieldAlert, Sparkles, Database } from 'lucide-react';
import ApiKeyDialog from './components/ApiKeyDialog';
import LoadingIndicator from './components/LoadingIndicator';
import PromptForm from './components/PromptForm';
import VideoResult from './components/VideoResult';
import ArchitectureDetails from './components/ArchitectureDetails';
import ObservabilityPanel from './components/ObservabilityPanel';
import { runVisionNarratePipeline, forensicLogAnalysis } from './services/geminiService';
import {
  AppState,
  PipelineConfig,
  GenerationResult,
  LogEntry
} from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [pipelineProgress, setPipelineProgress] = useState({ message: '', percent: 0 });
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [fixesApplied, setFixesApplied] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forensicAnalysis, setForensicAnalysis] = useState<string | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showObservability, setShowObservability] = useState(true);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        try {
          if (!(await window.aistudio.hasSelectedApiKey())) setShowApiKeyDialog(true);
        } catch (error) {
          setShowApiKeyDialog(true);
        }
      }
    };
    checkApiKey();
  }, []);

  const handleGenerate = useCallback(async (config: PipelineConfig) => {
    setAppState(AppState.INGESTION);
    setErrorMessage(null);
    setForensicAnalysis(null);
    setFixesApplied(0);
    setLogs([]);

    try {
      const output = await runVisionNarratePipeline(config, (state, message, percent, newLog) => {
        setAppState(state);
        setPipelineProgress({ message, percent });
        if (newLog) setLogs(prev => [...prev, newLog]);
      });
      setResult(output);
      setAppState(AppState.SUCCESS);
    } catch (error: any) {
      console.error('Pipeline crashed:', error);
      
      // Fix: Adhere to guidelines for handling "Requested entity was not found." error by prompting key selection.
      if (error.message?.includes("Requested entity was not found.")) {
        window.aistudio?.openSelectKey();
      }
      
      setErrorMessage(error.message || 'System architectural failure');
      setAppState(AppState.ERROR);
    }
  }, []);

  const handleForensicDeepDive = async () => {
    setAppState(AppState.FORENSIC);
    const diagnosis = await forensicLogAnalysis(logs);
    setForensicAnalysis(diagnosis);
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setResult(null);
    setLogs([]);
    setErrorMessage(null);
    setForensicAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {showApiKeyDialog && (
        <ApiKeyDialog onContinue={() => { setShowApiKeyDialog(false); window.aistudio?.openSelectKey(); }} />
      )}
      
      <header className="sticky top-0 z-50 w-full bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 py-6 px-12 flex justify-center">
        <div className="max-w-7xl w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-[20px] flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.3)] transform hover:rotate-6 transition-transform">
               <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white">VisionNarrate AI</h1>
              <p className="text-[9px] text-indigo-400 uppercase tracking-[0.5em] font-black">Transparency_Engine_V3.5</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowObservability(!showObservability)}
              className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 transition-all"
            >
              <Terminal className="w-4 h-4" />
              {showObservability ? 'Collapse Pipeline' : 'Inspect Pipeline'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col max-w-7xl mx-auto w-full p-12 pb-32 relative">
        {showObservability && <ObservabilityPanel logs={logs} state={appState} fixesApplied={fixesApplied} onAnalyze={handleForensicDeepDive} />}

        {appState === AppState.IDLE ? (
          <div className="flex flex-col gap-24 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-10">
                   <ShieldCheck className="w-4 h-4 text-emerald-500" />
                   <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">Verified Ground Truth Processing</span>
                </div>
                <h2 className="text-6xl md:text-8xl font-black text-white leading-[0.95] mb-10 tracking-tighter text-balance">
                  Auditable <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 via-blue-500 to-indigo-600">Synthesis</span> Pipeline.
                </h2>
                <h3 className="text-xl text-slate-400 leading-relaxed max-w-xl font-medium">
                  VisionNarrate AI exposes every internal reasoning step, from V-JEPA scene analysis to LLM prompt construction. Reliability by design.
                </h3>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-[56px] p-12 hidden lg:block relative overflow-hidden group">
                 <div className="absolute inset-0 bg-indigo-600/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                 <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-12">Transparency Layers</h4>
                 <div className="space-y-10 relative">
                    <div className="flex items-start gap-6 group/item">
                       <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-[12px] font-black text-indigo-400 group-hover/item:scale-110 transition-transform">V</div>
                       <div className="flex-grow">
                          <p className="text-sm font-black text-slate-200 uppercase tracking-widest mb-1">V-JEPA Grounding</p>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">Immutable scene embeddings and importance calibration metrics.</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-6 group/item">
                       <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-[12px] font-black text-amber-500 group-hover/item:scale-110 transition-transform">P</div>
                       <div className="flex-grow">
                          <p className="text-sm font-black text-slate-200 uppercase tracking-widest mb-1">Prompt Persistency</p>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">Every LLM prompt is visible, copyable, and version-tracked.</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-6 group/item">
                       <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-[12px] font-black text-emerald-500 group-hover/item:scale-110 transition-transform">A</div>
                       <div className="flex-grow">
                          <p className="text-sm font-black text-slate-200 uppercase tracking-widest mb-1">Artifact Audit</p>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">JSON chapter plans and segment prompts persisted for manual reuse.</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
            
            <PromptForm onGenerate={handleGenerate} />
            <ArchitectureDetails />
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center py-12">
            {(appState !== AppState.SUCCESS && appState !== AppState.ERROR && appState !== AppState.FORENSIC) && (
              <LoadingIndicator 
                customStatus={pipelineProgress.message} 
                progress={pipelineProgress.percent}
                state={appState}
              />
            )}

            {appState === AppState.FORENSIC && (
              <div className="text-center bg-white/[0.02] border border-white/5 p-16 rounded-[56px] max-w-4xl shadow-2xl animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-indigo-600/20 rounded-[32px] flex items-center justify-center mx-auto mb-10">
                  <Sparkles className="text-indigo-400 w-12 h-12" />
                </div>
                <h3 className="text-4xl font-black text-white mb-6 uppercase tracking-tight">Forensic System Audit</h3>
                <div className="text-left bg-black/60 border border-white/10 p-10 rounded-[32px] mb-10 font-mono text-sm text-indigo-300 leading-relaxed shadow-inner">
                  {forensicAnalysis || "Analyzing architectural integrity..."}
                </div>
                <button onClick={handleReset} className="px-12 py-5 bg-white text-black hover:bg-slate-200 rounded-2xl transition-all font-black text-xs uppercase tracking-[0.3em]">
                  Re-Initialize Engine
                </button>
              </div>
            )}
            
            {appState === AppState.SUCCESS && result && (
              <VideoResult
                videoUrl={result.finalVideoUrl}
                audioUrl={result.finalAudioUrl || null}
                chapters={result.chapters}
                onNewVideo={handleReset}
              />
            )}

            {appState === AppState.ERROR && (
              <div className="text-center bg-red-950/20 border border-red-500/20 p-16 rounded-[56px] max-w-2xl shadow-2xl animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-red-500/20 rounded-[32px] flex items-center justify-center mx-auto mb-10">
                  <ShieldAlert className="text-red-500 w-12 h-12" />
                </div>
                <h3 className="text-4xl font-black text-white mb-6 uppercase tracking-tight italic">Pipeline Interrupted</h3>
                <p className="text-slate-400 text-xl mb-10 leading-relaxed font-medium">{errorMessage}</p>
                <div className="flex flex-col gap-4">
                   <button onClick={handleReset} className="w-full px-12 py-5 bg-white text-black hover:bg-slate-200 rounded-2xl transition-all font-black text-xs uppercase tracking-[0.3em]">
                     Re-Initialize System
                   </button>
                   <button onClick={handleForensicDeepDive} className="w-full px-12 py-5 bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 rounded-2xl transition-all font-black text-xs uppercase tracking-[0.3em]">
                     View Artifact Forensic Trace
                   </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-12 px-24 border-t border-white/5 bg-[#050505] text-[10px] text-slate-600 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="flex flex-wrap gap-12 uppercase font-black tracking-[0.3em]">
            <span className="flex items-center gap-3">ENGINE: <span className="text-indigo-400">VISION_NARRATE_V3.5</span></span>
            <span className="flex items-center gap-3">AUDIT: <span className="text-emerald-500">GROUNDED_PERSISTENCE_ON</span></span>
          </div>
          <div className="flex gap-10 items-center">
            <span className="text-slate-500 font-black">© 2025 VisionNarrate AI | Transparent Architecture</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
