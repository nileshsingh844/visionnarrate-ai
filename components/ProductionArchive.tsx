
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { GenerationResult } from '../types';
import { Video, Clock, Calendar, Play, Trash2, X, HardDrive } from 'lucide-react';

interface ProductionArchiveProps {
  history: GenerationResult[];
  onSelect: (result: GenerationResult) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function ProductionArchive({ history, onSelect, onRemove, onClose }: ProductionArchiveProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl h-full max-h-[850px] bg-[#0A0A0A] border border-white/10 rounded-[56px] shadow-[0_0_120px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 ring-1 ring-white/10">
        <div className="p-10 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <HardDrive className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Production Archive</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1">Grounded_Asset_Library</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow p-10 overflow-y-auto custom-scrollbar">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
              <Video className="w-24 h-24 mb-8" />
              <h3 className="text-2xl font-black uppercase tracking-widest">No Masters Found</h3>
              <p className="mt-2 font-mono text-sm tracking-widest">Synthesize your first master to begin building the vault.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
              {history.map((item) => (
                <div 
                  key={item.id}
                  className="group relative bg-white/[0.02] border border-white/5 rounded-[40px] p-8 flex flex-col gap-6 hover:border-indigo-500/30 transition-all hover:bg-indigo-600/[0.04] animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">ID: {item.id}</span>
                      </div>
                      <h4 className="text-xl font-black text-white leading-none tracking-tight group-hover:text-indigo-400 transition-colors uppercase">{item.productName}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-1">
                       <Clock className="w-3 h-3 text-slate-500" />
                       <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Duration</span>
                       <span className="text-xs font-mono font-bold text-slate-300">{formatTime(item.totalDuration)}</span>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-1">
                       <Calendar className="w-3 h-3 text-slate-500" />
                       <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Date</span>
                       <span className="text-xs font-mono font-bold text-slate-300">{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-3 pt-2">
                    <button 
                      onClick={() => onSelect(item)}
                      className="flex-grow flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all shadow-xl shadow-indigo-600/20 group/play"
                    >
                      <Play className="w-4 h-4 fill-white group-hover/play:scale-125 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Recall Master</span>
                    </button>
                    <button 
                      onClick={() => onRemove(item.id)}
                      className="w-14 h-14 bg-red-500/10 hover:bg-red-500 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 hover:text-white transition-all shadow-xl shadow-red-500/5 group/del"
                      title="Purge from Archive"
                    >
                      <Trash2 className="w-5 h-5 group-hover/del:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-8 border-t border-white/5 bg-white/[0.01] text-center">
          <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.3em]">Vault Encrypted & Local Session Persistent</p>
        </div>
      </div>
    </div>
  );
}
