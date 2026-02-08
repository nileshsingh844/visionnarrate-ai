
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useEffect, useState } from 'react';
import { LogEntry, AppState, Artifact } from '../types';
import { 
  Terminal, 
  Database, 
  Code, 
  FileJson, 
  Search, 
  Layers, 
  Activity,
  Copy,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ObservabilityPanelProps {
  logs: LogEntry[];
  state: AppState;
  onAnalyze: () => void;
  fixesApplied?: number;
}

export default function ObservabilityPanel({ logs, state, onAnalyze, fixesApplied = 0 }: ObservabilityPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (scrollRef.current && !selectedArtifact) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, selectedArtifact]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-12 right-12 w-[450px] h-[650px] bg-[#0A0A0A]/95 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-[0_0_80px_rgba(0,0,0,0.8)] z-[60] flex flex-col overflow-hidden animate-in slide-in-from-right-20 duration-500 ring-1 ring-white/10">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 z-10"></div>
      
      {/* HEADER: Transparent Engine Status */}
      <div className="p-8 border-b border-white/5 flex flex-col gap-6 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-200">Transparency_Dashboard</h3>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                <div className={`w-1.5 h-1.5 rounded-full ${state === AppState.IDLE ? 'bg-slate-700' : 'bg-emerald-500 animate-pulse'}`}></div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{AppState[state]}</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
           <div className="bg-black/40 border border-white/5 p-4 rounded-3xl flex flex-col items-center gap-1 group hover:border-indigo-500/30 transition-colors">
              <Database className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Artifacts</span>
              <span className="text-sm font-mono font-black text-slate-200">{logs.filter(l => !!l.artifact).length}</span>
           </div>
           <div className="bg-black/40 border border-white/5 p-4 rounded-3xl flex flex-col items-center gap-1 group hover:border-indigo-500/30 transition-colors">
              <Code className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Prompts</span>
              <span className="text-sm font-mono font-black text-slate-200">{logs.filter(l => l.artifact?.type === 'PROMPT').length}</span>
           </div>
           <div className="bg-black/40 border border-white/5 p-4 rounded-3xl flex flex-col items-center gap-1 group hover:border-indigo-500/30 transition-colors">
              <Layers className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Resilience</span>
              <span className="text-sm font-mono font-black text-emerald-500">Tier 0</span>
           </div>
        </div>
      </div>
      
      {/* MAIN CONTENT: Logs or Artifact Inspector */}
      <div className="flex-grow flex flex-col overflow-hidden relative">
        {selectedArtifact ? (
          <div className="absolute inset-0 bg-black z-30 flex flex-col p-8 animate-in fade-in zoom-in-95 duration-300">
             <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                   <FileJson className="w-4 h-4 text-indigo-500" />
                   <h4 className="text-[10px] font-black text-slate-200 uppercase tracking-[0.2em]">{selectedArtifact.stage}</h4>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => handleCopy(selectedArtifact.payload)}
                     className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
                   >
                     {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                   </button>
                   <button 
                     onClick={() => setSelectedArtifact(null)}
                     className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
                   >
                     <AlertCircle className="w-4 h-4 rotate-45" />
                   </button>
                </div>
             </div>
             <div className="flex-grow bg-white/[0.02] rounded-3xl p-6 font-mono text-[11px] overflow-auto border border-white/5 custom-scrollbar selection:bg-indigo-500/30">
                <pre className="text-indigo-300 whitespace-pre-wrap">
                   {typeof selectedArtifact.payload === 'string' 
                      ? selectedArtifact.payload 
                      : JSON.stringify(selectedArtifact.payload, null, 2)}
                </pre>
             </div>
             <p className="mt-4 text-[9px] text-slate-600 uppercase font-black tracking-widest text-center">Persisted Artifact Trace ID: {selectedArtifact.id}</p>
          </div>
        ) : null}

        <div ref={scrollRef} className="flex-grow p-8 overflow-y-auto space-y-4 font-mono custom-scrollbar">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
               <Search className="w-10 h-10" />
               <span className="text-[10px] uppercase font-black tracking-[0.4em]">Awaiting_Artifacts</span>
            </div>
          ) : (
            logs.map((log, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  log.artifact ? 'bg-indigo-600/5 border-indigo-500/20 hover:bg-indigo-600/10' : 'bg-white/[0.02] border-white/5'
                }`}
                onClick={() => log.artifact && setSelectedArtifact(log.artifact)}
              >
                <div className="flex items-center justify-between mb-2">
                   <span className="text-[8px] font-black text-slate-600">{log.timestamp.split('T')[1].split('.')[0]}</span>
                   <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                     log.level === 'ERROR' ? 'bg-red-500/10 text-red-500' : 'bg-indigo-500/10 text-indigo-400'
                   }`}>{log.level}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3 break-words">
                  <span className="text-slate-600 font-bold">[{log.source}]</span> {log.message}
                </p>
                {log.artifact && (
                  <div className="flex items-center justify-between px-3 py-2 bg-black/40 rounded-xl border border-white/5 group">
                     <div className="flex items-center gap-2">
                        <FileJson className="w-3 h-3 text-indigo-500" />
                        <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Artifact: {log.artifact.type}</span>
                     </div>
                     <span className="text-[8px] font-black text-slate-600 group-hover:text-indigo-400 transition-colors">INSPECT_ARTIFACT</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* FOOTER: Controls */}
      <div className="p-8 border-t border-white/5 bg-white/[0.01] flex flex-col gap-4">
         <div className="flex gap-4">
            <button 
              onClick={onAnalyze}
              className="flex-grow flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-600/20"
            >
              <Terminal className="w-4 h-4" />
              Perform Root Cause Diagnosis
            </button>
         </div>
         <p className="text-[9px] text-slate-700 uppercase font-black tracking-[0.2em] text-center">Audit Logs Persisted to Cloud SQL & Storage Bucket</p>
      </div>
    </div>
  );
}
