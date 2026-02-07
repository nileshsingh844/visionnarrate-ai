
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chapter } from '../types';
import {
  ArrowPathIcon,
  DownloadIcon,
  SparklesIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  VolumeIcon,
  VolumeXIcon,
  MaximizeIcon,
} from './icons';

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function base64ToUint8(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function VideoResult({ videoUrl, audioUrl, chapters, onNewVideo }: {
  videoUrl: string,
  audioUrl: string | null,
  chapters: Chapter[],
  onNewVideo: () => void,
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [hoveredChapter, setHoveredChapter] = useState<number | null>(null);

  useEffect(() => {
    if (audioUrl && audioUrl.startsWith('data:audio/pcm;base64,')) {
      const base64 = audioUrl.replace('data:audio/pcm;base64,', '');
      const raw = base64ToUint8(base64);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = ctx;
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);
      gainNodeRef.current = gainNode;
      decodeAudioData(raw, ctx, 24000, 1).then(buffer => { audioBufferRef.current = buffer; });
    }
    return () => { audioContextRef.current?.close(); };
  }, [audioUrl]);

  // Ensure video re-loads if URL changes and apply state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [videoUrl, volume, isMuted, playbackSpeed]);

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
  }, []);

  const playAudio = useCallback(() => {
    stopAudio();
    if (audioContextRef.current && audioBufferRef.current && gainNodeRef.current && videoRef.current) {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(gainNodeRef.current);
      source.playbackRate.value = playbackSpeed;
      const startTime = videoRef.current.currentTime;
      source.start(0, startTime);
      audioSourceRef.current = source;
    }
  }, [stopAudio, playbackSpeed]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(e => {
        console.error("Video playback failed:", e);
      });
      playAudio();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      stopAudio();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const seekToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      if (isPlaying) playAudio();
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const error = (e.target as HTMLVideoElement).error;
    console.error("CRITICAL_VIDEO_RENDER_FAULT:", error?.message || "Unknown rendering error", error?.code);
  };

  return (
    <div className="w-full flex flex-col items-center gap-16 animate-in fade-in zoom-in-95 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-10">
           <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-6 px-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                   <h3 className="text-3xl font-black text-white tracking-tighter">Engine Master Export</h3>
                </div>
                <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] font-mono font-bold text-slate-500">
                   <span>ID: NARRATE_V3_FINAL</span>
                   <span className="text-slate-700">|</span>
                   <span className="text-indigo-400">FPS: 60.0_STABLE</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <button className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 hover:bg-white/10 transition-all uppercase tracking-[0.2em]">
                    <MaximizeIcon className="w-4 h-4" /> Full View
                 </button>
                 <a href={videoUrl} download="vision_narrate_master.mp4" className="group relative flex items-center gap-3 px-8 py-3 bg-indigo-600 rounded-2xl text-[10px] font-black text-white hover:bg-indigo-500 transition-all uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <DownloadIcon className="w-4 h-4" /> Export Production MP4
                 </a>
              </div>
           </div>

           <div ref={containerRef} className="relative group w-full overflow-hidden rounded-[56px] bg-black border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] transition-all ring-1 ring-white/10 aspect-video">
             <video 
               ref={videoRef} 
               src={videoUrl} 
               onTimeUpdate={handleTimeUpdate}
               onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
               onError={handleVideoError}
               onEnded={() => { setIsPlaying(false); stopAudio(); }}
               onClick={togglePlay}
               className="w-full h-full object-cover cursor-pointer" 
             />
             
             {!isPlaying && (
               <div onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[4px] cursor-pointer animate-in fade-in duration-500">
                 <div className="w-28 h-28 bg-indigo-600 rounded-[40px] flex items-center justify-center shadow-2xl hover:scale-110 transition-all group/play ring-8 ring-indigo-500/10">
                   <PlayIcon className="w-12 h-12 text-white fill-white ml-2 group-hover:scale-110 transition-transform"/>
                 </div>
               </div>
             )}

             <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
               <div className="flex flex-col gap-6">
                 <div className="relative w-full h-10 flex items-center group/seekbar">
                   {hoveredChapter !== null && duration > 0 && (
                     <div 
                       className="absolute bottom-full mb-6 px-5 py-3 bg-indigo-600 text-white text-[11px] font-black rounded-2xl shadow-2xl whitespace-nowrap transform -translate-x-1/2 pointer-events-none z-50 animate-in fade-in slide-in-from-bottom-2 border border-white/10"
                       style={{ left: `${(hoveredChapter / chapters.length) * 100}%` }}
                     >
                       <div className="flex items-center gap-3 mb-1">
                          <span className="opacity-50 text-[9px] uppercase tracking-[0.2em]">Segment 0{hoveredChapter + 1}</span>
                       </div>
                       {chapters[hoveredChapter]?.title}
                     </div>
                   )}
                   <div className="absolute inset-0 flex items-center pointer-events-none h-full w-full">
                     {chapters.map((_, idx) => idx > 0 && (
                       <div key={idx} className="absolute w-[2px] h-4 bg-white/20 z-10" style={{ left: `${(idx / chapters.length) * 100}%` }} />
                     ))}
                   </div>
                   <input type="range" min="0" max={duration || 0} step="0.01" value={currentTime} onChange={e => seekToTime(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all z-20 relative" />
                   <div className="absolute inset-0 flex z-30 opacity-0 group-hover/seekbar:opacity-100 transition-opacity">
                     {chapters.map((_, idx) => (
                       <div key={idx} className="flex-grow h-full cursor-pointer" onMouseEnter={() => setHoveredChapter(idx)} onMouseLeave={() => setHoveredChapter(null)} onClick={() => duration > 0 && seekToTime((idx / chapters.length) * duration)} />
                     ))}
                   </div>
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-10">
                     <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors transform active:scale-90 transition-transform">
                       {isPlaying ? <PauseIcon className="w-8 h-8 fill-white" /> : <PlayIcon className="w-8 h-8 fill-white" />}
                     </button>
                     <div className="flex items-center gap-3 text-[12px] font-mono text-slate-400 font-bold tracking-tighter">
                       <span className="text-white text-lg">{formatTime(currentTime)}</span>
                       <span className="opacity-20 text-xl">/</span>
                       <span className="text-lg">{formatTime(duration)}</span>
                     </div>
                   </div>
                   <div className="flex items-center gap-8">
                     <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                        {[1, 1.5, 2].map(speed => (
                          <button 
                            key={speed}
                            onClick={() => setPlaybackSpeed(speed)}
                            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${playbackSpeed === speed ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                            {speed}x
                          </button>
                        ))}
                     </div>
                     <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-indigo-400 transition-colors">
                       {isMuted || volume === 0 ? <VolumeXIcon className="w-7 h-7" /> : <VolumeIcon className="w-7 h-7" />}
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           </div>
        </div>

        {/* Sidebar: Pipeline Observability & Chapter Control */}
        <div className="lg:col-span-4 h-full">
           <div className="p-10 bg-white/[0.03] border border-white/5 rounded-[56px] flex flex-col gap-10 shadow-2xl h-full sticky top-28 overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-600/[0.01] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-center justify-between border-b border-white/5 pb-8 relative">
                <div className="flex items-center gap-3">
                   <SparklesIcon className="w-5 h-5 text-indigo-500" />
                   <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-300">Representation Refinement</h3>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
              
              <div className="flex flex-col gap-5 overflow-y-auto max-h-[600px] pr-4 custom-scrollbar relative">
                {chapters.map((c, idx) => {
                  const segmentStart = (idx / chapters.length) * duration;
                  const segmentEnd = ((idx + 1) / chapters.length) * duration;
                  const isActive = currentTime >= segmentStart && currentTime < segmentEnd;
                  const score = c.metadata?.importanceScore || 0;
                  
                  return (
                    <div 
                      key={c.id} 
                      className={`group/chapter p-6 rounded-[32px] border transition-all cursor-pointer relative overflow-hidden ${isActive ? 'bg-indigo-600/10 border-indigo-500/40 shadow-2xl scale-[1.02]' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                      onClick={() => duration > 0 && seekToTime(segmentStart)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Module 0{idx+1}</span>
                        <div className="flex items-center gap-3">
                           <div className="flex flex-col items-end">
                              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Importance</span>
                              <span className="text-[10px] font-mono font-black text-slate-400">{score.toFixed(2)}</span>
                           </div>
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40"></div>
                        </div>
                      </div>

                      {/* Calibrated Importance Bar */}
                      <div className="w-full h-1 bg-white/5 rounded-full mb-4 overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-1000"
                          style={{ width: `${score * 100}%` }}
                        ></div>
                      </div>

                      <h4 className="text-[15px] font-black text-white group-hover/chapter:text-indigo-300 transition-colors mb-2 tracking-tight">{c.title}</h4>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                         <span className="text-[8px] font-black bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-indigo-400 uppercase tracking-[0.1em]">
                           {c.metadata?.visualEvent || 'Scene_Stable'}
                         </span>
                         <span className="text-[8px] font-black bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-slate-500 uppercase tracking-[0.1em]">V-JEPA_Synced</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium italic opacity-80 line-clamp-2 hover:line-clamp-none transition-all">"{c.narrationScript}"</p>
                      
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 animate-pulse"></div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto pt-10 border-t border-white/5 flex flex-col gap-4 relative">
                 <button onClick={onNewVideo} className="w-full flex items-center justify-center gap-3 py-5 bg-white text-black hover:bg-slate-200 text-xs font-black rounded-2xl border border-white/10 transition-all uppercase tracking-[0.3em] shadow-xl">
                   <PlusIcon className="w-4 h-4"/> New Synthesis Cycle
                 </button>
                 <div className="flex justify-center gap-6 text-[9px] font-mono text-slate-700 font-bold uppercase tracking-[0.2em]">
                    <span>MEM: ACTIVE</span>
                    <span>CRC: 0x8F2A</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
