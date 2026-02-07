
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useEffect, useState } from 'react';
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
  const [showObservability, setShowObservability] = useState(false);

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

  // Proactive Sentinel Heartbeat simulation
  useEffect(() => {
    if (appState === AppState.IDLE) {
      const interval = setInterval(() => {
        setLogs(prev => [...prev, {
          timestamp: new Date().toISOString(),
          level: 'DEBUG',
          message: 'Sentinel heartbeat: System integrity verified. Latency: 12ms',
          source: 'SENTINEL_NODE'
        }].slice(-50));
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [appState]);

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
        
        // Dynamic detection of applied fixes from log stream
        if (newLog?.source === 'SENTINEL_ENGINE' && newLog?.message.includes('applied')) {
          setFixesApplied(prev => prev + 1);
        }
      });
      setResult(output);
      setAppState(AppState.SUCCESS);
    } catch (error) {
      console.error('Pipeline crashed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'System architectural failure');
      setAppState(AppState.ERROR);
      
      // Auto-trigger Forensic Analysis
      setAppState(AppState.FORENSIC);
      const diagnosis = await forensicLogAnalysis(logs);
      setForensicAnalysis(diagnosis);
      setAppState(AppState.ERROR);
    }
  }, [logs]);

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setResult(null);
    setLogs([]);
    setFixesApplied(0);
    setForensicAnalysis(null);
    setPipelineProgress({ message: '', percent: 0 });
  };

  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {showApiKeyDialog && (
        <ApiKeyDialog onContinue={() => { setShowApiKeyDialog(false); window.aistudio?.openSelectKey(); }} />
      )}
      
      <header className="sticky top-0 z-50 w-full bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 py-5 px-8 flex justify-center">
        <div className="max-w-7xl w-full flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] transform hover:rotate-6 transition-transform">
              <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">VisionNarrate AI</h1>
              <p className="text-[10px] text-indigo-400 uppercase tracking-[0.4em] font-bold">Production-Grade Pipeline v3.1</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-6">
            <button 
              onClick={() => setShowObservability(!showObservability)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${appState !== AppState.IDLE ? 'bg-indigo-500 animate-pulse' : 'bg-slate-600'}`}></div>
              {showObservability ? 'Hide Observability' : 'System Telemetry'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col max-w-7xl mx-auto w-full p-6 md:p-12 pb-24 relative">
        {showObservability && <ObservabilityPanel logs={logs} state={appState} fixesApplied={fixesApplied} onAnalyze={() => setAppState(AppState.FORENSIC)} />}

        {appState === AppState.IDLE ? (
          <div className="flex flex-col gap-16 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                   <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Sentinel Active: Monitoring Nodes</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-white leading-[1.05] mb-8 tracking-tighter text-balance">
                  Grounded <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-500 to-indigo-600">Product Narration</span> at Scale.
                </h2>
                <h2 className="text-xl text-slate-400 leading-relaxed max-w-xl font-medium">
                  VisionNarrate uses Multi-LLM inheritance and V-JEPA scene understanding to transform screen recordings into deterministic 30-minute demo engines.
                </h2>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-[48px] p-8 hidden lg:block relative overflow-hidden group">
                 <div className="absolute inset-0 bg-indigo-600/[0.03] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-8">Inheritance Architecture Logic</h4>
                 <div className="space-y-6 relative">
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">01</div>
                       <div className="flex-grow">
                          <p className="text-xs font-bold text-slate-200">Ingestion & Grounding</p>
                          <p className="text-[10px] text-slate-500">Video source persistence in GCP Buckets.</p>
                       </div>
                    </div>
                    <div className="w-px h-6 bg-white/5 ml-4"></div>
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">02</div>
                       <div className="flex-grow">
                          <p className="text-xs font-bold text-slate-200">V-JEPA Analysis</p>
                          <p className="text-[10px] text-slate-500">Temporal representation learning & scene metadata.</p>
                       </div>
                    </div>
                    <div className="w-px h-6 bg-white/5 ml-4"></div>
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">03</div>
                       <div className="flex-grow">
                          <p className="text-xs font-bold text-slate-200">Master Planner LLM</p>
                          <p className="text-[10px] text-slate-500">Long-video DAG decomposition (Gemini 3 Pro).</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
            
            <PromptForm onGenerate={handleGenerate} />
            <ArchitectureDetails />
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center py-8">
            {appState !== AppState.SUCCESS && appState !== AppState.ERROR && appState !== AppState.FORENSIC && (
              <LoadingIndicator 
                customStatus={pipelineProgress.message} 
                progress={pipelineProgress.percent}
                state={appState}
              />
            )}

            {appState === AppState.FORENSIC && (
              <div className="flex flex-col items-center gap-8 animate-pulse">
                <LoadingIndicator 
                  customStatus="Initiating AI Forensic Deep-Dive into telemetry logs..." 
                  progress={99}
                  state={appState}
                />
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
              <div className="text-center bg-red-950/20 border border-red-500/20 p-12 rounded-[48px] max-w-2xl shadow-2xl animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <span className="text-red-500 text-4xl font-black">!</span>
                </div>
                <h3 className="text-3xl font-black text-white mb-4 uppercase italic">Pipeline Disrupted</h3>
                <p className="text-slate-400 text-lg mb-6 leading-relaxed font-medium">{errorMessage}</p>
                
                {forensicAnalysis && (
                  <div className="mb-8 bg-black/60 border border-indigo-500/20 p-8 rounded-3xl text-left shadow-2xl animate-in fade-in duration-1000">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-black mb-4">Neural Forensic Insight</p>
                    <div className="text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                      {forensicAnalysis}
                    </div>
                  </div>
                )}

                {lastLog && (
                  <div className="mb-12 bg-black/40 border border-red-500/10 p-4 rounded-xl font-mono text-left">
                    <p className="text-[8px] uppercase tracking-widest text-slate-600 mb-2">Last Telemetry Signal</p>
                    <p className="text-[10px] text-red-400 leading-tight">
                      [{lastLog.timestamp.split('T')[1].split('.')[0]}] {lastLog.source}: {lastLog.message}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                   <button onClick={handleReset} className="w-full px-8 py-5 bg-white text-black hover:bg-slate-200 rounded-2xl transition-all font-bold text-sm uppercase tracking-[0.2em]">
                     Initialize Recovery Sequence
                   </button>
                   <p className="text-[10px] text-red-500/50 font-mono">ERROR_CODE: ARCH_FATAL_STP_029</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-8 px-12 border-t border-white/5 bg-[#050505] text-[10px] text-slate-600 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex flex-wrap gap-8 uppercase font-bold tracking-widest">
            <span className="flex items-center gap-3">ENGINE: <span className="text-indigo-400">VEO_3.1_L_STP</span></span>
            <span className="flex items-center gap-3">ML_CORE: <span className="text-indigo-400">V-JEPA_TEMPORAL</span></span>
            <span className="flex items-center gap-3">ORCHESTRATION: <span className="text-indigo-400">MULTI_LLM_INHERIT</span></span>
          </div>
          <div className="flex gap-6 items-center">
            <span className="text-slate-500">© 2025 VisionNarrate Platform | Built for GCP</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
