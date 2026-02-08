
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  FileImageIcon,
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
  if (isNaN(seconds)) return '0:00';
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

  const isImageSource = useMemo(() => {
    if (!videoUrl) return false;
    return videoUrl.startsWith('data:image') || !!videoUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
  }, [videoUrl]);

  useEffect(() => {
    if (audioUrl && audioUrl.includes('base64,')) {
      const base64 = audioUrl.split('base64,')[1];
      const raw = base64ToUint8(base64);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = ctx;
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);
      gainNodeRef.current = gainNode;
      decodeAudioData(raw, ctx, 24000, 1).then(buffer => { 
        audioBufferRef.current = buffer; 
        if (isImageSource) setDuration(buffer.duration);
      });
    }
    return () => { audioContextRef.current?.close(); };
  }, [audioUrl, isImageSource]);

  useEffect(() => {
    let interval: any;
    if (isPlaying && isImageSource) {
      const step = 0.1;
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + step;
          if (audioBufferRef.current && next >= audioBufferRef.current.duration) {
            setIsPlaying(false);
            stopAudio();
            return audioBufferRef.current.duration;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isImageSource]);

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
  }, []);

  const playAudio = useCallback(() => {
    stopAudio();
    if (audioContextRef.current && audioBufferRef.current && gainNodeRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(gainNodeRef.current);
      source.playbackRate.value = playbackSpeed;
      const startTime = isImageSource ? currentTime : (videoRef.current?.currentTime || 0);
      source.start(0, startTime);
      audioSourceRef.current = source;
    }
  }, [stopAudio, playbackSpeed, isImageSource, currentTime]);

  const togglePlay = () => {
    if (isImageSource) {
      if (!isPlaying) {
        if (currentTime >= (audioBufferRef.current?.duration || 0)) {
          setCurrentTime(0);
        }
        playAudio();
        setIsPlaying(true);
      } else {
        stopAudio();
        setIsPlaying(false);
      }
      return;
    }
    
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        playAudio();
        setIsPlaying(true);
      }).catch(e => console.error("Video play failed", e));
    } else {
      videoRef.current.pause();
      stopAudio();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isImageSource) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const seekToTime = (time: number) => {
    setCurrentTime(time);
    if (!isImageSource && videoRef.current) {
      videoRef.current.currentTime = time;
    }
    if (isPlaying) playAudio();
  };

  return (
    <div className="w-full flex flex-col items-center gap-16 animate-in fade-in zoom-in-95 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">
           <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-6 px-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                   <div className={`w-2 h-2 rounded-full ${isImageSource ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'} shadow-[0_0_10px_rgba(16,185,129,0.5)]`}></div>
                   <h3 className="text-3xl font-black text-white tracking-tighter uppercase">
                     {isImageSource ? 'Grounded Project Summary' : 'Production Project Demo'}
                   </h3>
                </div>
                <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] font-mono font-bold text-slate-500">
                   <span>ID: VEO_GROUNDED_DEMO_MASTER</span>
                   <span className="text-slate-700">|</span>
                   <span className={isImageSource ? 'text-amber-400' : 'text-indigo-400'}>
                     {isImageSource ? 'MODE: FALLBACK_UI_SCALING' : 'QUALITY: 1080P_MASTER'}
                   </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <button className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 hover:bg-white/10 transition-all uppercase tracking-[0.2em]">
                    <MaximizeIcon className="w-4 h-4" /> Fullscreen
                 </button>
                 <a href={videoUrl} download={isImageSource ? "demo_frame.png" : "project_demo.mp4"} className="group relative flex items-center gap-3 px-8 py-3 bg-indigo-600 rounded-2xl text-[10px] font-black text-white hover:bg-indigo-500 transition-all uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30">
                    <DownloadIcon className="w-4 h-4" /> Export Production
                 </a>
              </div>
           </div>

           <div ref={containerRef} className="relative group w-full overflow-hidden rounded-[56px] bg-[#0A0A0A] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.9)] transition-all ring-1 ring-white/10 aspect-video">
             {isImageSource ? (
               <div className="w-full h-full flex items-center justify-center bg-black relative">
                 <img src={videoUrl} alt="Synthesis Fallback" className="w-full h-full object-contain" />
                 {!isPlaying && (
                   <div onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[4px] cursor-pointer animate-in fade-in duration-500">
                     <div className="w-24 h-24 bg-amber-600 rounded-[30px] flex items-center justify-center shadow-2xl hover:scale-105 transition-all">
                       <PlayIcon className="w-10 h-10 text-white fill-white ml-1"/>
                     </div>
                   </div>
                 )}
               </div>
             ) : (
               <>
                <video 
                  ref={videoRef} 
                  src={videoUrl} 
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
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
               </>
             )}

             <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/95 via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <div className="flex flex-col gap-6">
                 <div className="relative w-full h-10 flex items-center group/seekbar">
                   <input 
                     type="range" min="0" max={duration || 0} step="0.01" 
                     value={currentTime} 
                     onChange={e => seekToTime(parseFloat(e.target.value))} 
                     className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all z-20 relative" 
                   />
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-10">
                     <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors transform active:scale-90">
                       {isPlaying ? <PauseIcon className="w-8 h-8 fill-white" /> : <PlayIcon className="w-8 h-8 fill-white" />}
                     </button>
                     <div className="flex items-center gap-3 text-[12px] font-mono text-slate-400 font-bold tracking-tighter">
                       <span className="text-white text-lg">{formatTime(currentTime)}</span>
                       <span className="opacity-20 text-xl">/</span>
                       <span className="text-lg">{formatTime(duration)}</span>
                     </div>
                   </div>
                   <div className="flex items-center gap-8">
                     <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-indigo-400 transition-colors">
                       {isMuted || volume === 0 ? <VolumeXIcon className="w-7 h-7" /> : <VolumeIcon className="w-7 h-7" />}
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           </div>
        </div>

        <div className="lg:col-span-4 h-full">
           <div className="p-10 bg-white/[0.03] border border-white/5 rounded-[56px] flex flex-col gap-10 shadow-2xl h-full sticky top-28 overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/5 pb-8 relative">
                <div className="flex items-center gap-3">
                   <SparklesIcon className="w-5 h-5 text-indigo-500" />
                   <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-300">Demo Narrative Trace</h3>
                </div>
              </div>
              
              <div className="flex flex-col gap-5 overflow-y-auto max-h-[600px] pr-4 custom-scrollbar relative">
                {chapters.map((c, idx) => {
                  const segmentStart = (idx / chapters.length) * duration;
                  const segmentEnd = ((idx + 1) / chapters.length) * duration;
                  const isActive = currentTime >= segmentStart && currentTime < segmentEnd;
                  
                  return (
                    <div 
                      key={c.id} 
                      className={`group/chapter p-6 rounded-[32px] border transition-all cursor-pointer relative overflow-hidden ${isActive ? 'bg-indigo-600/10 border-indigo-500/40' : 'bg-black/20 border-white/5'}`}
                      onClick={() => seekToTime(segmentStart)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Module 0{idx+1}</span>
                      </div>
                      <h4 className="text-[15px] font-black text-white group-hover/chapter:text-indigo-300 transition-colors mb-2 tracking-tight">{c.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed italic line-clamp-2">"{c.narrationScript}"</p>
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>}
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto pt-10 border-t border-white/5 flex flex-col gap-4 relative">
                 <button onClick={onNewVideo} className="w-full flex items-center justify-center gap-3 py-5 bg-white text-black hover:bg-slate-200 text-xs font-black rounded-2xl border border-white/10 transition-all uppercase tracking-[0.3em] shadow-xl">
                   <PlusIcon className="w-4 h-4"/> New Demo Sequence
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
