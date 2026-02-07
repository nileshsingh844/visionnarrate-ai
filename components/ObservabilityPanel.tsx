
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useEffect } from 'react';
import { LogEntry, AppState } from '../types';
import { Terminal, ShieldAlert, Sparkles, Activity, HeartPulse } from 'lucide-react';

interface ObservabilityPanelProps {
  logs: LogEntry[];
  state: AppState;
  onAnalyze: () => void;
  fixesApplied?: number;
}

export default function ObservabilityPanel({ logs, state, onAnalyze, fixesApplied = 0 }: ObservabilityPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const hasError = logs.some(l => l.level === 'ERROR');
  const errorCount = logs.filter(l => l.level === 'ERROR').length;
  const healthScore = Math.max(0, 100 - (errorCount * 15) + (fixesApplied * 10));

  return (
    <div className="fixed bottom-12 right-12 w-96 h-[500px] bg-[#0A0A0A]/95 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[60] flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-500">
      {/* Scanning Line Effect */}
      <div className="absolute top-0 left-0 right-0 h-px bg-indigo-500/50 shadow-[0_0_15px_indigo] animate-scan z-10 pointer-events-none"></div>

      <div className="p-6 border-b border-white/5 flex flex-col gap-4 bg-white/[0.02] relative z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-indigo-500" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">System Telemetry</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${state !== AppState.IDLE ? 'bg-indigo-500 animate-pulse' : 'bg-slate-700'}`}></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-black/40 border border-white/5 p-3 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                 <HeartPulse className="w-3 h-3 text-emerald-500" />
                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Neural Health</span>
              </div>
              <span className={`text-sm font-mono font-black ${healthScore > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{healthScore}%</span>
           </div>
           <div className="bg-black/40 border border-white/5 p-3 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                 <Sparkles className="w-3 h-3 text-indigo-400" />
                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Fixes Applied</span>
              </div>
              <span className="text-sm font-mono font-black text-indigo-400">{fixesApplied}</span>
           </div>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto font-mono text-[10px] space-y-3 custom-scrollbar relative z-20">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 uppercase tracking-widest gap-2">
             <div className="w-8 h-px bg-white/5"></div>
             <span>Idle_Awaiting_Signal</span>
             <div className="w-8 h-px bg-white/5"></div>
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={`flex gap-3 group transition-colors p-1 rounded ${log.level === 'ERROR' ? 'bg-red-500/5' : ''}`}>
              <span className="text-slate-700 shrink-0">[{log.timestamp.split('T')[1].split('.')[0]}]</span>
              <span className={`shrink-0 font-bold ${log.level === 'ERROR' ? 'text-red-500' : log.level === 'WARN' ? 'text-amber-500' : 'text-indigo-500'}`}>
                {log.level}
              </span>
              <span className="text-slate-400 leading-relaxed break-words">
                <span className="text-slate-600">[{log.source}]</span> {log.message}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="p-6 border-t border-white/5 bg-white/[0.01] space-y-4 relative z-20">
         {hasError && state === AppState.ERROR && (
           <button 
             onClick={onAnalyze}
             className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/20 group"
           >
             <Activity className="w-3 h-3 group-hover:rotate-12 transition-transform" />
             AI Forensic Insight
           </button>
         )}

         <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3 h-3 text-slate-600" />
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Sentinel Monitoring</span>
            </div>
            <span className="text-[8px] font-mono text-indigo-400">Worker-01: OK</span>
         </div>
      </div>
    </div>
  );
}
