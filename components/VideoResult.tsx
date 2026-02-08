
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Chapter } from '../types';
import {
  DownloadIcon,
  PlayIcon,
  PauseIcon,
  VolumeIcon,
  VolumeXIcon,
  MaximizeIcon,
} from './icons';
import { FileText, AlignLeft, List, Download, Search, Copy, CheckCircle2, X, Anchor, Video } from 'lucide-react';

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
  if (isNaN(seconds) || seconds === Infinity) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
  if (!highlight.trim()) return <>{text}</>;
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-indigo-500/40 text-white rounded-sm px-0.5 no-underline">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

export default function VideoResult({ videoUrl, audioUrl, chapters, transcript, onNewVideo }: {
  videoUrl: string,
  audioUrl: string | null,
  chapters: Chapter[],
  transcript: string,
  onNewVideo: () => void,
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'transcript'>('blueprint');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [followPlayback, setFollowPlayback] = useState(true);
  
  const controlsTimeoutRef = useRef<number | null>(null);

  const isImageSource = useMemo(() => {
    if (!videoUrl) return false;
    return videoUrl.startsWith('data:image') || !!videoUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
  }, [videoUrl]);

  // Audio setup
  useEffect(() => {
    if (audioUrl && audioUrl.includes('base64,')) {
      const base64 = audioUrl.split('base64,')[1];
      const raw = base64ToUint8(base64);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = ctx;
      const gainNode = ctx.createGain();
      gainNode.gain.value = isMuted ? 0 : volume;
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
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(isMuted ? 0 : volume, audioContextRef.current?.currentTime || 0, 0.05);
    }
  }, [volume, isMuted]);

  // Unified playback position synchronization
  useEffect(() => {
    let animationFrame: number;
    const update = () => {
      if (isPlaying) {
        if (isImageSource || !videoRef.current) {
          setCurrentTime(prev => {
            const next = prev + 0.016; // Approx 60fps
            if (duration > 0 && next >= duration) {
              setIsPlaying(false);
              stopAudio();
              return duration;
            }
            return next;
          });
        } else if (videoRef.current && !isDragging) {
          setCurrentTime(videoRef.current.currentTime);
        }
      }
      animationFrame = requestAnimationFrame(update);
    };
    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, isImageSource, duration, isDragging]);

  // Transcript auto-scrolling logic
  useEffect(() => {
    if (activeTab === 'transcript' && transcriptScrollRef.current && followPlayback && !searchQuery) {
      const activeElement = transcriptScrollRef.current.querySelector('.active-transcript-segment');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, activeTab, searchQuery, followPlayback]);

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
      const startTime = isImageSource ? currentTime : (videoRef.current?.currentTime || 0);
      
      if (startTime < audioBufferRef.current.duration) {
        source.start(0, startTime);
        audioSourceRef.current = source;
      }
    }
  }, [stopAudio, isImageSource, currentTime]);

  const togglePlay = () => {
    if (isImageSource) {
      if (!isPlaying) {
        if (currentTime >= duration) setCurrentTime(0);
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

  const seekToTime = (time: number) => {
    const clampedTime = Math.max(0, Math.min(time, duration));
    setCurrentTime(clampedTime);
    if (!isImageSource && videoRef.current) {
      videoRef.current.currentTime = clampedTime;
    }
    if (isPlaying) {
      playAudio();
    } else {
      stopAudio();
    }
  };

  const handleSeekStart = () => {
    setIsDragging(true);
  };

  const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement>) => {
    setIsDragging(false);
    const time = parseFloat(e.currentTarget.value);
    seekToTime(time);
  };

  const handleSeekBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (seekBarRef.current && duration > 0) {
      const rect = seekBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      setHoverTime(percent * duration);
      setTooltipPos(percent * 100);
    }
  };

  const handleSeekBarMouseLeave = () => {
    setHoverTime(null);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume > 0) setIsMuted(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying && !isDragging) setShowControls(false);
    }, 3000);
  };

  const handleDownloadTranscript = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vision_narrate_transcript.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(transcript).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleDownloadVideo = () => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = 'vision_narrate_master.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredChapters = useMemo(() => {
    if (!searchQuery) return chapters;
    const lowerQuery = searchQuery.toLowerCase();
    return chapters.filter(c => 
      c.title.toLowerCase().includes(lowerQuery) || 
      c.narrationScript.toLowerCase().includes(lowerQuery)
    );
  }, [chapters, searchQuery]);

  return (
    <div className="w-full flex flex-col items-center gap-12 animate-in fade-in zoom-in-95 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
        {/* VIDEO PLAYER COLUMN */}
        <div className="lg:col-span-8 flex flex-col gap-8">
           <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-4 px-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-1">
                   <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] animate-pulse"></div>
                   <h3 className="text-2xl font-black text-white tracking-tighter uppercase">
                     Production Master
                   </h3>
                </div>
                <div className="flex items-center gap-4 text-[9px] uppercase tracking-[0.2em] font-mono font-bold text-slate-500">
                   <span>ID: SYNTH_{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                   <span className="text-slate-800">|</span>
                   <span className="text-indigo-400">STATUS: VERIFIED</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <button 
                   onClick={handleDownloadTranscript}
                   className="group flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-[9px] font-black text-slate-300 transition-all uppercase tracking-widest"
                 >
                    <FileText className="w-3.5 h-3.5" /> Download Transcript
                 </button>
                 <button 
                   onClick={handleDownloadVideo}
                   className="group flex items-center gap-2 px-6 py-2.5 bg-indigo-600 rounded-xl text-[9px] font-black text-white hover:bg-indigo-500 transition-all uppercase tracking-widest shadow-xl shadow-indigo-600/20"
                 >
                    <DownloadIcon className="w-3.5 h-3.5" /> Export MP4
                 </button>
              </div>
           </div>

           <div 
             ref={containerRef}
             onMouseMove={handleMouseMove}
             className="relative group w-full overflow-hidden rounded-[40px] bg-black border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] aspect-video ring-1 ring-white/10"
           >
             {isImageSource ? (
               <div className="w-full h-full flex items-center justify-center bg-black">
                 <img src={videoUrl} className="w-full h-full object-contain opacity-90" alt="Frame Synthesis" />
               </div>
             ) : (
               <video 
                  ref={videoRef} 
                  src={videoUrl} 
                  onLoadedMetadata={() => {
                    if (videoRef.current?.duration && videoRef.current.duration !== Infinity) {
                      setDuration(videoRef.current.duration);
                    }
                  }}
                  onTimeUpdate={() => {
                    if (!isDragging && videoRef.current) {
                      setCurrentTime(videoRef.current.currentTime);
                    }
                  }}
                  onEnded={() => { setIsPlaying(false); stopAudio(); }}
                  onClick={togglePlay}
                  muted 
                  className="w-full h-full object-cover cursor-pointer" 
                />
             )}

             {/* Overlay Play Button */}
             {!isPlaying && (
               <div onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[4px] cursor-pointer animate-in fade-in duration-500 z-30">
                 <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center shadow-2xl hover:scale-110 transition-all group/play ring-4 ring-white/10">
                   <PlayIcon className="w-10 h-10 text-white fill-white ml-1.5"/>
                 </div>
               </div>
             )}

             {/* ENHANCED CONTROL BAR */}
             <div className={`absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-black/95 via-black/80 to-transparent transition-all duration-500 z-40 ${showControls || !isPlaying ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
               <div className="flex flex-col gap-4">
                 
                 {/* ROBUST SEEK BAR */}
                 <div 
                    ref={seekBarRef}
                    className="relative w-full h-5 flex items-center group/seek cursor-pointer"
                    onMouseMove={handleSeekBarMouseMove}
                    onMouseLeave={handleSeekBarMouseLeave}
                 >
                    {/* Tooltip */}
                    {hoverTime !== null && (
                      <div 
                        className="absolute bottom-full mb-3 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-lg shadow-2xl pointer-events-none -translate-x-1/2 border border-white/10"
                        style={{ left: `${tooltipPos}%` }}
                      >
                        {formatTime(hoverTime)}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-indigo-600"></div>
                      </div>
                    )}

                    {/* Progress Track */}
                    <div className="absolute w-full h-1 bg-white/20 rounded-full overflow-hidden transition-all group-hover/seek:h-1.5">
                      {/* Active progress */}
                      <div 
                        className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,1)] transition-all" 
                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                      />
                    </div>
                    
                    {/* Native Range Input for Interaction */}
                    <input 
                      type="range" 
                      min="0" 
                      max={duration || 100} 
                      step="any" 
                      value={currentTime}
                      onMouseDown={handleSeekStart}
                      onMouseUp={handleSeekEnd}
                      onChange={(e) => {
                        const time = parseFloat(e.target.value);
                        setCurrentTime(time);
                        if (!isDragging) {
                           seekToTime(time);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 appearance-none" 
                    />
                 </div>

                 {/* CONTROLS ROW */}
                 <div className="flex items-center justify-between gap-6">
                   <div className="flex items-center gap-5">
                     <button 
                       onClick={togglePlay} 
                       className="text-white transform active:scale-90 transition-transform hover:text-indigo-400 p-1"
                     >
                       {isPlaying ? <PauseIcon className="w-6 h-6 fill-current" /> : <PlayIcon className="w-6 h-6 fill-current" />}
                     </button>
                     
                     <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 font-bold min-w-[100px]">
                       <span className="text-white">{formatTime(currentTime)}</span>
                       <span className="opacity-20">/</span>
                       <span>{formatTime(duration)}</span>
                     </div>
                   </div>

                   <div className="flex items-center gap-6 flex-grow justify-end">
                     {/* VOLUME CONTROL - ALWAYS ACCESSIBLE */}
                     <div className="flex items-center gap-3 group/vol max-w-[180px]">
                       <button onClick={toggleMute} className="text-slate-400 hover:text-white transition-colors">
                         {isMuted || volume === 0 ? <VolumeXIcon className="w-5 h-5" /> : <VolumeIcon className="w-5 h-5" />}
                       </button>
                       <div className="w-24 md:w-32 h-1 bg-white/10 rounded-full relative cursor-pointer overflow-hidden">
                          <input 
                            type="range" min="0" max="1" step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div 
                            className="h-full bg-slate-400 group-hover/vol:bg-white transition-all"
                            style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                          />
                       </div>
                     </div>

                     <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                        <button 
                          onClick={handleDownloadVideo}
                          className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl group/dl"
                          title="Download Clip"
                        >
                          <Download className="w-5 h-5 group-hover/dl:scale-110 transition-transform" />
                        </button>

                        <button 
                          onClick={toggleFullscreen} 
                          className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
                          title="Fullscreen"
                        >
                          <MaximizeIcon className="w-5 h-5" />
                        </button>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
        </div>

        {/* SIDEBAR COLUMN (BLUEPRINT / TRANSCRIPT) */}
        <div className="lg:col-span-4 h-full">
           <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] flex flex-col gap-5 h-full sticky top-24 overflow-hidden shadow-xl">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setActiveTab('blueprint')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'blueprint' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <List className="w-3 h-3" />
                      Plan
                    </button>
                    <button 
                      onClick={() => setActiveTab('transcript')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'transcript' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <AlignLeft className="w-3 h-3" />
                      Narration
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    {activeTab === 'transcript' && (
                      <>
                        <button 
                          onClick={() => setFollowPlayback(!followPlayback)}
                          className={`p-1.5 rounded-lg transition-colors ${followPlayback ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:bg-white/10'}`}
                          title={followPlayback ? "Auto-scroll Enabled" : "Auto-scroll Disabled"}
                        >
                          <Anchor className={`w-3.5 h-3.5 ${followPlayback ? 'animate-pulse' : ''}`} />
                        </button>
                        <button 
                          onClick={handleCopyTranscript}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 transition-colors"
                          title="Copy Full Transcript"
                        >
                          {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                          onClick={handleDownloadTranscript}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 transition-colors"
                          title="Download TXT"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {activeTab === 'transcript' && (
                  <div className="relative group/search">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 group-focus-within/search:text-indigo-400 transition-colors" />
                    <input 
                      type="text"
                      placeholder="Search narrative context..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-8 py-2 text-[9px] font-bold text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all uppercase tracking-widest"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded-md transition-colors"
                      >
                        <X className="w-2.5 h-2.5 text-slate-500" />
                      </button>
                    )}
                    {searchQuery && (
                      <div className="absolute top-full mt-1 right-0 text-[8px] font-black text-indigo-500/60 uppercase tracking-widest">
                        {filteredChapters.length} result{filteredChapters.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div ref={transcriptScrollRef} className="flex-grow overflow-y-auto pr-1 custom-scrollbar space-y-3">
                {activeTab === 'blueprint' ? (
                  chapters.map((c, idx) => {
                    const startTime = (idx / chapters.length) * duration;
                    const endTime = ((idx + 1) / chapters.length) * duration;
                    const isActive = currentTime >= startTime && currentTime < endTime;
                    return (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${isActive ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                        onClick={() => seekToTime(startTime)}
                      >
                        <div className="flex items-center justify-between mb-1">
                           <h4 className="text-[11px] font-black text-white uppercase tracking-tight">{c.title}</h4>
                           <span className="text-[8px] font-mono text-slate-500">{formatTime(startTime)}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 leading-relaxed line-clamp-2">{c.visualIntent}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col gap-5 pb-6">
                    {filteredChapters.length === 0 ? (
                      <div className="py-12 text-center opacity-20 flex flex-col items-center gap-3">
                        <Search className="w-6 h-6" />
                        <span className="text-[9px] font-black uppercase tracking-widest">No Matches Found</span>
                      </div>
                    ) : (
                      filteredChapters.map((c, idx) => {
                        const originalIndex = chapters.indexOf(c);
                        const startTime = (originalIndex / chapters.length) * duration;
                        const isActive = currentTime >= startTime && (originalIndex === chapters.length - 1 || currentTime < ((originalIndex + 1) / chapters.length) * duration);
                        return (
                          <div 
                            key={idx} 
                            onClick={() => seekToTime(startTime)}
                            className={`transition-all duration-300 cursor-pointer group/seg ${isActive ? 'opacity-100 active-transcript-segment' : 'opacity-25 grayscale hover:opacity-50'}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                               <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-600'}`}>
                                 {formatTime(startTime)}
                               </span>
                               <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                 <HighlightText text={c.title} highlight={searchQuery} />
                               </span>
                            </div>
                            <p className={`text-[11px] leading-relaxed font-medium transition-colors ${isActive ? 'text-white' : 'text-slate-400'}`}>
                              <HighlightText text={c.narrationScript} highlight={searchQuery} />
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-2">
                 <button 
                   onClick={handleDownloadVideo} 
                   className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-xl transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                 >
                   <Video className="w-4 h-4" />
                   Download Production Master
                 </button>
                 <button 
                   onClick={onNewVideo} 
                   className="w-full py-3.5 bg-white text-black hover:bg-slate-100 text-[10px] font-black rounded-xl transition-all uppercase tracking-[0.2em]"
                 >
                   Start New Build
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
