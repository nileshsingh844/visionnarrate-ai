
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { AppState } from '../types';

interface LoadingIndicatorProps {
  customStatus?: string;
  progress?: number;
  state: AppState;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ customStatus, progress = 0, state }) => {
  return (
    <div className="flex flex-col items-center justify-center p-16 md:p-24 bg-[#050505] rounded-[48px] border border-white/5 shadow-2xl w-full max-w-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
      
      <div className="relative w-40 h-40 mb-16">
        <div className="absolute inset-0 border-[1.5px] border-white/5 rounded-full"></div>
        <div 
          className="absolute inset-0 border-[1.5px] border-t-indigo-500 rounded-full animate-spin"
          style={{ animationDuration: '2s' }}
        ></div>
        
        <div className="absolute inset-4 border-[1px] border-white/5 rounded-full opacity-50"></div>
        <div 
          className="absolute inset-4 border-[1px] border-b-indigo-400/50 rounded-full animate-spin"
          style={{ animationDuration: '4s', animationDirection: 'reverse' }}
        ></div>

        <div className="absolute inset-8 rounded-full flex flex-col items-center justify-center bg-white/[0.02] backdrop-blur-sm border border-white/5">
          <span className="text-4xl font-extrabold text-white tracking-tighter">
            {Math.round(progress)}<span className="text-indigo-500 text-lg">%</span>
          </span>
          <span className="text-[8px] uppercase tracking-[0.4em] text-slate-500 font-bold mt-1">Stage_{AppState[state]}</span>
        </div>
      </div>
      
      <div className="text-center w-full relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Architectural_Loop</span>
        </div>

        <div className="bg-black/80 border border-white/5 p-6 rounded-[28px] font-mono shadow-inner group-hover:border-indigo-500/20 transition-all duration-700">
           <p className="text-[12px] text-indigo-300 uppercase tracking-wider leading-relaxed">
            {customStatus || "Waiting for dispatcher instruction..."}
          </p>
        </div>

        {state === AppState.GENERATION && (
          <div className="mt-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-1000">
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest leading-relaxed">
              ⚠️ Extended Duration Processing: Longer videos require multiple synthesis passes. This may take several minutes. Please stay connected.
            </p>
          </div>
        )}
      </div>

      <div className="w-full mt-12 space-y-2">
        <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">
          <span>Inheritance Architecture</span>
          <span className="text-slate-700">Status: Active</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-indigo-700 to-indigo-400 transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(79,70,229,0.3)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
